import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

const SAFE_ARRIVAL_TEXT_LIMITS = {
  leg: 80,
  message: 1000,
} as const

const ALLOWED_SAFE_ARRIVAL_FIELDS = ['leg', 'message'] as const

type SafeArrivalPayload = {
  leg: string
  message?: string
}

function validateSafeArrivalPayload(body: unknown): { data?: SafeArrivalPayload; error?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'De aankomstupdate heeft een geldige JSON-object body nodig.' }
  }

  const source = body as Record<string, unknown>
  const unknownField = Object.keys(source).find(
    field => !ALLOWED_SAFE_ARRIVAL_FIELDS.includes(field as (typeof ALLOWED_SAFE_ARRIVAL_FIELDS)[number]),
  )
  if (unknownField) return { error: `Onbekend veld: ${unknownField}.` }

  if (typeof source.leg !== 'string' || source.leg.trim().length === 0) {
    return { error: 'leg is verplicht.' }
  }
  if (source.leg.length > SAFE_ARRIVAL_TEXT_LIMITS.leg) {
    return { error: 'leg is te lang.' }
  }

  const data: SafeArrivalPayload = { leg: source.leg }

  if (source.message !== undefined && source.message !== null) {
    if (typeof source.message !== 'string') return { error: 'message moet tekst zijn.' }
    if (source.message.length > SAFE_ARRIVAL_TEXT_LIMITS.message) {
      return { error: 'message is te lang.' }
    }
    data.message = source.message
  }

  return { data }
}

export async function GET() {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const db = supabaseAdmin()
  const { data } = await db
    .from('safe_arrival')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json(data || null)
}

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON in het aankomstverzoek.' }, { status: 400 })
  }

  const { data: payload, error: validationError } = validateSafeArrivalPayload(body)
  if (validationError || !payload) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('safe_arrival')
    .insert({ ...payload, timestamp: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
