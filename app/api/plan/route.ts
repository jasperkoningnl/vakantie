import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { uitjes } from '@/lib/uitjes'

const SYSTEM_PROMPT = `Je bent een vriendelijke Franse reisplanner voor een Nederlands gezin:
Jasper (48), Hilda en Lena (4 jaar). Ze verblijven bij Les Escaliers
de La Combe in Porte-du-Quercy (44.521, 1.150). Ze eten vegetarisch.
Je krijgt het huidige weer, de gewenste activiteit, de maximale rijdijd,
en een lijst van beschikbare uitjes.`

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Geen JSON gevonden in antwoord')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    const { phase, activity, driveTime, weather, selectedIds } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const uitjesText = uitjes
      .map(u => `[${u.id}] ${u.name} (${u.type}, ${u.drive}): ${u.desc}${u.vegetarian ? ' 🌿' : ''}`)
      .join('\n')

    if (phase === 'suggest') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Weer: ${weather}
Gewenste activiteit: ${activity}
Maximale rijduur: ${driveTime}

Beschikbare uitjes:
${uitjesText}

Geef een JSON array van 2-3 suggesties die passen bij de activiteit en rijduur.
Antwoord ALLEEN met geldige JSON in dit formaat (geen andere tekst):
{"suggesties": [{"id": "u3", "naam": "...", "reden": "..."}]}`,
          },
        ],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed = extractJson(text)
      return NextResponse.json(parsed)
    }

    if (phase === 'plan') {
      const selected = uitjes.filter(u => selectedIds.includes(u.id))
      const selectedText = selected
        .map(u => `${u.name}: ${u.desc} (${u.drive}, maps: ${u.gmaps})`)
        .join('\n')

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Weer: ${weather}
Gewenste activiteit: ${activity}
Maximale rijduur: ${driveTime}
Gekozen uitjes:
${selectedText}

Stel een dagprogramma samen met 2-3 stops. Per stop: tijd, naam, beschrijving (max 3 zinnen, vertel iets interessants), praktische tip, Google Maps URL.
Geef ook aan welke spullen handig zijn (zwemspullen, zonnebrand, regenjas, etc.).
Schrijf warm en persoonlijk in het Nederlands.

Antwoord ALLEEN met geldige JSON:
{
  "intro": "korte inleiding (1 zin)",
  "stops": [
    {
      "time": "10:00",
      "name": "naam",
      "description": "beschrijving",
      "tip": "tip",
      "mapsUrl": "url"
    }
  ],
  "checklist": ["item1", "item2"]
}`,
          },
        ],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed = extractJson(text)
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: 'Onbekende fase' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/plan]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
