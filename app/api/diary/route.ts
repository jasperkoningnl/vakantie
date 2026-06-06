import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const date = req.nextUrl.searchParams.get('date')
  const db = supabaseAdmin()

  if (date) {
    const { data, error } = await db.from('diary_entries').select('*').eq('date', date).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || null)
  }

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

  if (!body || typeof body !== 'object' || !('date' in body) || typeof body.date !== 'string') {
    return NextResponse.json({ error: 'Een dagboekregel heeft een geldige datum nodig.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data, error } = await db
    .from('diary_entries')
    .upsert(body, { onConflict: 'date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
