import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, limitText, logMinimalApiError } from '@/lib/ai-request-safety'

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const rateLimited = checkRateLimit(req, '/api/reisverhaal')
  if (rateLimited) return rateLimited

  try {
    const { entries } = await req.json()
    const safeEntries = Array.isArray(entries) ? entries.slice(0, 40) : []

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const entriesText = safeEntries
      .map(entry => {
        const e = entry && typeof entry === 'object' && !Array.isArray(entry)
          ? entry as { date?: unknown; actual_text?: unknown; mood_emoji?: unknown; plan_text?: unknown }
          : {}
        const dateValue = limitText(e.date, 10)
        const date = new Date(dateValue + 'T12:00:00').toLocaleDateString('nl-NL', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const parts = []
        if (e.plan_text) {
          try {
            const safePlanText = limitText(e.plan_text, 6000)
            const plan = safePlanText.startsWith('{')
              ? JSON.parse(safePlanText)
              : null
            if (Array.isArray(plan?.stops)) {
              parts.push(`Gepland: ${plan.stops.slice(0, 20).map((s: { name: unknown }) => limitText(s.name, 80)).join(' → ')}`)
            }
          } catch { /* ignore */ }
        }
        if (e.actual_text) parts.push(`Werkelijk: ${limitText(e.actual_text, 1200)}`)
        if (e.mood_emoji) parts.push(`Stemming: ${limitText(e.mood_emoji, 16)}`)
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
    logMinimalApiError('/api/reisverhaal', err)
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 })
  }
}
