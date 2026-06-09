import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requirePrivateAccess } from '@/lib/api-auth'

const PICKER_API_BASE_URL = 'https://photospicker.googleapis.com/v1'
const MAX_PICKED_PHOTOS = 50

type GooglePickerError = {
  error?: {
    message?: string
    status?: string
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
      error: 'Google Photos moet opnieuw gekoppeld worden met de nieuwe Google Photos Picker-toegang.',
      code: 'GOOGLE_PHOTOS_RECONNECT_REQUIRED',
    },
    { status },
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
  if (res.status === 401 || res.status === 403) return pickerAuthError(res.status)
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
        error: 'Google Photos kan niet meer automatisch per datum zoeken. Kies de foto’s zelf via de Google Photos Picker.',
        code: 'GOOGLE_PHOTOS_PICKER_REQUIRED',
      },
      { status: 400 },
    )
  }

  const sessionRes = await fetch(`${PICKER_API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const session = await sessionRes.json().catch(() => ({})) as PickerSession & GooglePickerError
  if (sessionRes.status === 401 || sessionRes.status === 403) return pickerAuthError(sessionRes.status)
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

  fetch(`${PICKER_API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {})

  return NextResponse.json({
    mediaItemsSet: true,
    mediaItems: picked.mediaItems,
  })
}
