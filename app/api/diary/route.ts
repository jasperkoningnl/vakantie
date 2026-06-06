import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { reiskalender } from '@/lib/reiskalender'

const DIARY_TEXT_LIMITS = {
  actual_text: 4000,
  plan_text: 8000,
  story_text: 2000,
} as const

const ALLOWED_DIARY_FIELDS = [
  'date',
  'actual_text',
  'plan_text',
  'story_text',
  'mood_emoji',
  'photos',
] as const

type DiaryPayload = {
  date: string
  actual_text?: string
  plan_text?: string
  story_text?: string
  mood_emoji?: string
  photos?: unknown
}

function isValidTripDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date in reiskalender
}

function validateDiaryPayload(body: unknown): { data?: DiaryPayload; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Een dagboekregel heeft een geldige JSON-object body nodig.' }
  }

  const source = body as Record<string, unknown>

  if (typeof source.date !== 'string' || !isValidTripDate(source.date)) {
    return { error: 'Een dagboekregel heeft een geldige reisdatum nodig (YYYY-MM-DD).' }
  }

  const data: DiaryPayload = { date: source.date }

  for (const field of ALLOWED_DIARY_FIELDS) {
    if (!(field in source) || field === 'date') continue

    const value = source[field]
    if (value === undefined || value === null) continue

    if (field in DIARY_TEXT_LIMITS) {
      if (typeof value !== 'string') {
        return { error: `${field} moet tekst zijn.` }
      }
      if (value.length > DIARY_TEXT_LIMITS[field as keyof typeof DIARY_TEXT_LIMITS]) {
        return { error: `${field} is te lang.` }
      }
      data[field] = value
      continue
    }

    if (field === 'mood_emoji') {
      if (typeof value !== 'string' || value.length > 16) {
        return { error: 'mood_emoji moet een korte tekst zijn.' }
      }
      data.mood_emoji = value
      continue
    }

    if (field === 'photos') {
      if (!Array.isArray(value)) {
        return { error: 'photos moet een lijst zijn.' }
      }
      data.photos = value
    }
  }

  return { data }
}

export async function GET(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const date = req.nextUrl.searchParams.get('date')

  if (date) {
    if (!isValidTripDate(date)) {
      return NextResponse.json({ error: 'Gebruik een geldige reisdatum (YYYY-MM-DD).' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { data, error } = await db.from('diary_entries').select('*').eq('date', date).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || null)
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON in het dagboekverzoek.' }, { status: 400 })
  }

  const { data: payload, error: validationError } = validateDiaryPayload(body)
  if (validationError || !payload) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data, error } = await db
    .from('diary_entries')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
