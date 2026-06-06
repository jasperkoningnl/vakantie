import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { reiskalender } from '@/lib/reiskalender'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STORY_TEXT_LIMITS = {
  actual_text: 4000,
  plan_text: 8000,
} as const

const ALLOWED_STORY_FIELDS = ['date', 'plan_text', 'actual_text', 'mood_emoji', 'photos'] as const

type StoryPayload = {
  date: string
  plan_text?: string
  actual_text?: string
  mood_emoji?: string
  photos?: Array<{ filename: string }>
}

function isValidTripDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date in reiskalender
}

function validatePhotos(value: unknown): { data?: Array<{ filename: string }>; error?: string } {
  if (value === undefined || value === null) return { data: [] }
  if (!Array.isArray(value)) return { error: 'photos moet een lijst zijn.' }
  if (value.length > 50) return { error: 'photos bevat te veel items.' }

  const photos: Array<{ filename: string }> = []
  for (const photo of value) {
    if (!photo || typeof photo !== 'object' || Array.isArray(photo)) {
      return { error: 'Elke foto moet een object zijn.' }
    }

    const filename = (photo as Record<string, unknown>).filename
    if (typeof filename !== 'string' || filename.length > 200) {
      return { error: 'Elke foto heeft een geldige bestandsnaam nodig.' }
    }

    photos.push({ filename })
  }

  return { data: photos }
}

function validateStoryPayload(body: unknown): { data?: StoryPayload; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Het dagboekverhaal heeft een geldige JSON-object body nodig.' }
  }

  const source = body as Record<string, unknown>
  const unknownField = Object.keys(source).find(
    field => !ALLOWED_STORY_FIELDS.includes(field as (typeof ALLOWED_STORY_FIELDS)[number]),
  )
  if (unknownField) return { error: `Onbekend veld: ${unknownField}.` }

  if (typeof source.date !== 'string' || !isValidTripDate(source.date)) {
    return { error: 'Het dagboekverhaal heeft een geldige reisdatum nodig (YYYY-MM-DD).' }
  }

  const payload: StoryPayload = { date: source.date }

  for (const field of ['actual_text', 'plan_text'] as const) {
    const value = source[field]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string') return { error: `${field} moet tekst zijn.` }
    if (value.length > STORY_TEXT_LIMITS[field]) return { error: `${field} is te lang.` }
    payload[field] = value
  }

  if (source.mood_emoji !== undefined && source.mood_emoji !== null) {
    if (typeof source.mood_emoji !== 'string' || source.mood_emoji.length > 16) {
      return { error: 'mood_emoji moet een korte tekst zijn.' }
    }
    payload.mood_emoji = source.mood_emoji
  }

  const { data: photos, error: photosError } = validatePhotos(source.photos)
  if (photosError) return { error: photosError }
  payload.photos = photos

  return { data: payload }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON in het dagboekverhaalverzoek.' }, { status: 400 })
  }

  const { data: payload, error: validationError } = validateStoryPayload(body)
  if (validationError || !payload) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { date, plan_text, actual_text, mood_emoji, photos } = payload

  const photoDesc = photos?.length
    ? `Foto's genomen op deze dag: ${photos.map(p => p.filename).join(', ')}`
    : 'Geen foto\'s beschikbaar.'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Schrijf een kort, warm dagboekverhaaltje (max 150 woorden) in de stijl van een persoonlijk reisdagboek.
Schrijf in de eerste persoon meervoud ("we").
Basis:
- Plan was: ${plan_text || 'niet ingevuld'}
- Wat er echt gebeurde: ${actual_text || 'niet ingevuld'}
- Stemming: ${mood_emoji || '😎'}
- ${photoDesc}

Schrijf in het Nederlands, warm en persoonlijk. Alleen de dagboektekst, geen titels of inleidingen.`,
      },
    ],
  })

  const story_text = message.content[0].type === 'text' ? message.content[0].text.slice(0, 2000) : ''

  const db = supabaseAdmin()
  const { error } = await db
    .from('diary_entries')
    .upsert({ date, story_text }, { onConflict: 'date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story_text })
}
