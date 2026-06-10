import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requirePrivateAccess } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Foto's downloaden + uploaden kan even duren bij een grote selectie.
export const maxDuration = 60

const PICKER_API_BASE_URL = 'https://photospicker.googleapis.com/v1'
const MAX_PICKED_PHOTOS = 50

// Picker-baseUrls vereisen een OAuth-header en verlopen na 60 minuten;
// daarom slaan we de bytes direct op in Supabase Storage en bewaart het
// dagboek alleen nog onze eigen, permanente publieke URL.
const PHOTO_BUCKET = 'diary-photos'
const PHOTO_DOWNLOAD_SIZE = '=w1600-h1600'
const UPLOAD_CONCURRENCY = 4

type GooglePickerError = {
  error?: {
    message?: string
    status?: string
    details?: Array<{ reason?: string }>
  }
}

type PickerSession = {
  id: string
  pickerUri?: string
  mediaItemsSet?: boolean
  pollingConfig?: {
    pollInterval?: string
    timeoutIn?: string
  }
  expireTime?: string
}

type PickedMediaItem = {
  id: string
  createTime?: string
  type?: 'TYPE_UNSPECIFIED' | 'PHOTO' | 'VIDEO'
  mediaFile?: {
    baseUrl?: string
    filename?: string
    mediaFileMetadata?: {
      width?: number
      height?: number
    }
  }
}

function pickerAuthError(status = 401) {
  return NextResponse.json(
    {
      error: 'Google Photos moet opnieuw gekoppeld worden om foto’s te kunnen kiezen.',
      code: 'GOOGLE_PHOTOS_RECONNECT_REQUIRED',
    },
    { status },
  )
}

function needsGooglePhotosReconnect(status: number, data: GooglePickerError) {
  const googleStatus = data.error?.status
  const message = data.error?.message?.toLowerCase() ?? ''
  const detailReasons = data.error?.details?.map(detail => detail.reason?.toLowerCase() ?? '') ?? []

  return (
    status === 401 ||
    googleStatus === 'UNAUTHENTICATED' ||
    message.includes('insufficient authentication scopes') ||
    detailReasons.some(reason => reason.includes('access_token_scope_insufficient'))
  )
}

function googlePhotosError(status: number, data: GooglePickerError) {
  const googleMessage = data.error?.message
  return NextResponse.json(
    {
      error: googleMessage || 'Google Photos Picker fout. Probeer opnieuw of verbind Google Photos opnieuw.',
      code: data.error?.status || 'GOOGLE_PHOTOS_PICKER_ERROR',
    },
    { status },
  )
}

async function getAccessToken() {
  const session = await auth()
  return session?.accessToken
}

function mapPickedMediaItem(item: PickedMediaItem) {
  return {
    id: item.id,
    baseUrl: item.mediaFile?.baseUrl ?? '',
    filename: item.mediaFile?.filename ?? 'Google Photos foto',
    mediaMetadata: {
      creationTime: item.createTime ?? '',
      width: String(item.mediaFile?.mediaFileMetadata?.width ?? ''),
      height: String(item.mediaFile?.mediaFileMetadata?.height ?? ''),
    },
  }
}

async function fetchPickedPhotos(accessToken: string, sessionId: string) {
  const mediaItems: ReturnType<typeof mapPickedMediaItem>[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      sessionId,
      pageSize: String(Math.min(MAX_PICKED_PHOTOS, 100)),
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(`${PICKER_API_BASE_URL}/mediaItems?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { response: googlePhotosError(res.status, data) }

    const pickedItems = Array.isArray(data.mediaItems) ? data.mediaItems as PickedMediaItem[] : []
    mediaItems.push(
      ...pickedItems
        .filter(item => item.type !== 'VIDEO' && item.mediaFile?.baseUrl)
        .map(mapPickedMediaItem),
    )
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : undefined
  } while (pageToken && mediaItems.length < MAX_PICKED_PHOTOS)

  return { mediaItems: mediaItems.slice(0, MAX_PICKED_PHOTOS) }
}

type MappedPhoto = ReturnType<typeof mapPickedMediaItem>

async function storePickedPhoto(
  db: ReturnType<typeof supabaseAdmin>,
  accessToken: string,
  item: MappedPhoto,
): Promise<MappedPhoto | null> {
  try {
    const res = await fetch(`${item.baseUrl}${PHOTO_DOWNLOAD_SIZE}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const path = `picker/${item.id.replace(/[^A-Za-z0-9_-]/g, '_')}.${extension}`
    const bytes = await res.arrayBuffer()

    const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType, upsert: true })
    if (error) return null

    return { ...item, baseUrl: db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl }
  } catch {
    return null
  }
}

async function storePickedPhotos(accessToken: string, items: MappedPhoto[]): Promise<MappedPhoto[]> {
  const db = supabaseAdmin()
  // Bestaat de bucket al, dan negeren we de foutmelding in het resultaat.
  await db.storage.createBucket(PHOTO_BUCKET, { public: true })

  const stored: MappedPhoto[] = []
  for (let i = 0; i < items.length; i += UPLOAD_CONCURRENCY) {
    const batch = await Promise.all(
      items.slice(i, i + UPLOAD_CONCURRENCY).map(item => storePickedPhoto(db, accessToken, item)),
    )
    stored.push(...batch.filter((photo): photo is MappedPhoto => photo !== null))
  }
  return stored
}

export async function POST() {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const accessToken = await getAccessToken()
  if (!accessToken) return pickerAuthError()

  const res = await fetch(`${PICKER_API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pickingConfig: { maxItemCount: String(MAX_PICKED_PHOTOS) } }),
  })

  const data = await res.json().catch(() => ({})) as PickerSession & GooglePickerError
  if (needsGooglePhotosReconnect(res.status, data)) return pickerAuthError(res.status)
  if (!res.ok) return googlePhotosError(res.status, data)

  return NextResponse.json({
    sessionId: data.id,
    pickerUri: data.pickerUri ? `${data.pickerUri}/autoclose` : undefined,
    pollingConfig: data.pollingConfig,
    expireTime: data.expireTime,
  })
}

export async function GET(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const accessToken = await getAccessToken()
  if (!accessToken) return pickerAuthError()

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json(
      {
        error: 'Start eerst een Google Photos-kiezer om foto’s te selecteren.',
        code: 'GOOGLE_PHOTOS_PICKER_REQUIRED',
      },
      { status: 400 },
    )
  }

  const sessionRes = await fetch(`${PICKER_API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const session = await sessionRes.json().catch(() => ({})) as PickerSession & GooglePickerError
  if (needsGooglePhotosReconnect(sessionRes.status, session)) return pickerAuthError(sessionRes.status)
  if (!sessionRes.ok) return googlePhotosError(sessionRes.status, session)

  if (!session.mediaItemsSet) {
    return NextResponse.json({
      mediaItemsSet: false,
      pollingConfig: session.pollingConfig,
      expireTime: session.expireTime,
    })
  }

  const picked = await fetchPickedPhotos(accessToken, sessionId)
  if (picked.response) return picked.response

  const storedPhotos = await storePickedPhotos(accessToken, picked.mediaItems ?? [])
  if ((picked.mediaItems?.length ?? 0) > 0 && storedPhotos.length === 0) {
    return NextResponse.json(
      {
        error: 'Foto’s konden niet in de app worden opgeslagen. Probeer het opnieuw.',
        code: 'GOOGLE_PHOTOS_STORE_FAILED',
      },
      { status: 502 },
    )
  }

  fetch(`${PICKER_API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {})

  return NextResponse.json({
    mediaItemsSet: true,
    mediaItems: storedPhotos,
  })
}
