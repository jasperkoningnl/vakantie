import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const db = supabaseAdmin()

  if (date) {
    const { data } = await db.from('diary_entries').select('*').eq('date', date).single()
    return NextResponse.json(data || null)
  }

  const { data } = await db
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('diary_entries')
    .upsert(body, { onConflict: 'date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
