import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  try {
    const { entries } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const entriesText = entries
      .map((e: { date: string; actual_text?: string; mood_emoji?: string; plan_text?: string }) => {
        const date = new Date(e.date + 'T12:00:00').toLocaleDateString('nl-NL', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const parts = []
        if (e.plan_text) {
          try {
            const plan = typeof e.plan_text === 'string' && e.plan_text.startsWith('{')
              ? JSON.parse(e.plan_text)
              : null
            if (plan?.stops) {
              parts.push(`Gepland: ${plan.stops.map((s: { name: string }) => s.name).join(' → ')}`)
            }
          } catch { /* ignore */ }
        }
        if (e.actual_text) parts.push(`Werkelijk: ${e.actual_text}`)
        if (e.mood_emoji) parts.push(`Stemming: ${e.mood_emoji}`)
        return `**${date}**\n${parts.join('\n')}`
      })
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Je krijgt alle dagboekentries van een gezinsvakantie in Zuid-Frankrijk.
Schrijf hier een warm, persoonlijk reisverhaal van, alsof het in een mooi reisboek staat.
Gebruik de eerste persoon meervoud ("we").
Begin met een sfeervolle inleiding over de reis ernaartoe, eindig met een reflectie op de vakantie.
Verwerk de dagelijkse verhalen, de stemmingen en de plekken die bezocht zijn.
Maak het max 1500 woorden. Schrijf in het Nederlands.

Dagboekentries:
${entriesText}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ verhaal: text })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/reisverhaal]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
