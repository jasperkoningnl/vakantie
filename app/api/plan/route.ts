import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { uitjes } from '@/lib/uitjes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Je bent een vriendelijke Franse reisplanner voor een Nederlands gezin:
Jasper (48), Hilda en Lena (4 jaar). Ze verblijven bij Les Escaliers
de La Combe in Porte-du-Quercy (44.521, 1.150). Ze eten vegetarisch.
Je krijgt het huidige weer, de gewenste activiteit, de maximale rijduur,
en een lijst van beschikbare uitjes.`

export async function POST(req: NextRequest) {
  const { phase, activity, driveTime, weather, selectedIds } = await req.json()

  const uitjesText = uitjes
    .map(u => `[${u.id}] ${u.name} (${u.type}, ${u.drive}): ${u.desc}${u.vegetarian ? ' 🌿' : ''}`)
    .join('\n')

  if (phase === 'suggest') {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Ongeldig antwoord' }, { status: 500 })
    }
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  }

  if (phase === 'plan') {
    const selected = uitjes.filter(u => selectedIds.includes(u.id))
    const selectedText = selected
      .map(u => `${u.name}: ${u.desc} (${u.drive}, ${u.gmaps})`)
      .join('\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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

Stel een dagprogramma samen met 2-3 stops, inclusief tijden, een leuke beschrijving per stop
(vertel iets interessants, max 3 zinnen), een praktische tip, en een Google Maps URL naar de eerste stop.
Geef ook aan of zwemspullen, zonnebrand of regenjas handig zijn.
Schrijf warm en persoonlijk in het Nederlands.

Antwoord ALLEEN met geldige JSON (geen andere tekst):
{
  "intro": "korte inleiding (1 zin)",
  "stops": [
    {
      "time": "10:00",
      "name": "naam stop",
      "description": "beschrijving (max 3 zinnen)",
      "tip": "praktische tip",
      "mapsUrl": "google maps url"
    }
  ],
  "checklist": ["item1", "item2"]
}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Ongeldig antwoord' }, { status: 500 })
    }
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  }

  return NextResponse.json({ error: 'Onbekende fase' }, { status: 400 })
}
