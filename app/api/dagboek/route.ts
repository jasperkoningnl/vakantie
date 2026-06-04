import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const supabase = createAdminClient()

  let query = supabase
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(date ? data?.[0] ?? null : data)
}

export async function POST(req: NextRequest) {
  const { date, plan_text, actual_text } = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('diary_entries')
    .upsert({ date, plan_text, actual_text }, { onConflict: 'date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
