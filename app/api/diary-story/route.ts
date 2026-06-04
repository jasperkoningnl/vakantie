import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { date, plan_text, actual_text, mood_emoji, photos } = await req.json()

  const photoDesc = photos?.length
    ? `Foto's genomen op deze dag: ${photos.map((p: { filename: string }) => p.filename).join(', ')}`
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

  const story_text = message.content[0].type === 'text' ? message.content[0].text : ''

  const db = supabaseAdmin()
  await db
    .from('diary_entries')
    .upsert({ date, story_text }, { onConflict: 'date' })

  return NextResponse.json({ story_text })
}
