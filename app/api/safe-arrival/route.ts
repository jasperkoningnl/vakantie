import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
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
  const { leg, message } = await req.json()
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('safe_arrival')
    .insert({ leg, message, timestamp: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
