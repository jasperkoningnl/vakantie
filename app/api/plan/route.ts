import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { uitjes } from '@/lib/uitjes'
import { marktdagen } from '@/lib/marktdagen'
import { getParisWeekdayName } from '@/lib/date-utils'
import { speeltuinen } from '@/lib/speeltuinen'

const LENA_DAGRITME = `Houd rekening met Lena's dagritme. Ze is 4 jaar oud. De ochtend (9:00-12:00) is het actieve venster: plan dan de buitenactiviteit of het avontuur. Rond 12:30 lunchen. Tussen 13:00 en 15:00 is een rustig moment (autorit = slaapje in de auto). Vanaf 15:00 een tweede kort venster voor een kalme activiteit. Plan de langste autorit rond 13:30 als dat kan. Eindig de dag niet te laat: uiterlijk 17:30 terug bij Les Escaliers.`

const TUSSENSTOP_TIPS = `Als er onderweg naar de gekozen bestemmingen leuke tussenstops zijn (speeltuinen, boulangeries/patisseries, bijzondere winkeltjes), noem die dan als optionele tip bij de relevante etappe. Markeer ze als "Tip onderweg:" zodat ze herkenbaar zijn als bonus, niet als vaste stop. Voeg ze toe als extra stop-objecten met "isTip": true in de JSON. Bekende bakkertjes in de regio (u33–u37): Chez Mado en Maison Petersen in Montcuq, Pain et Chocolat en Boulangerie Larroque in Lauzerte, Du Quercy Vert in Montaigu. Als de route via een van deze plaatsen gaat, stel de bakker dan voor als ochtend-tussenstop.`

const SYSTEM_PROMPT = `Je bent een vriendelijke Franse reisplanner voor een Nederlands gezin:
Jasper (48), Hilda en Lena (4 jaar). Ze verblijven bij Les Escaliers
de La Combe in Porte-du-Quercy (44.521, 1.150). Ze eten vegetarisch.
Je krijgt het huidige weer, de gewenste activiteit, de maximale rijdijd,
en een lijst van beschikbare uitjes.

${LENA_DAGRITME}

${TUSSENSTOP_TIPS}`

function buildMarktdagenContext(): string {
  const todayNaam = getParisWeekdayName()
  const vandaagMarkten = marktdagen.filter(m => m.dag === todayNaam)

  if (vandaagMarkten.length === 0) return ''
  const marktInfo = vandaagMarkten.map(m => `${m.dag}: ${m.plaats} — ${m.omschrijving}`).join('; ')
  return `\nVandaag zijn er markten: ${marktInfo}. Als de gebruiker eten of boodschappen wil, stel de markt dan als eerste optie voor.`
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Geen JSON gevonden in antwoord')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    const { phase, activity, driveTime, weather, selectedIds, visitedNames } = await req.json()

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const uitjesText = uitjes
      .map(u => `[${u.id}] ${u.name} (${u.type}, ${u.drive}): ${u.desc}${u.vegetarian ? ' 🌿' : ''}`)
      .join('\n')

    const marktContext = buildMarktdagenContext()
    const visitedContext = visitedNames?.length
      ? `\nDe volgende uitjes zijn al bezocht en hoef je niet meer voor te stellen: ${(visitedNames as string[]).join(', ')}.`
      : ''
    const speeltuinenContext = `\nSpeeltuinen in de regio (gebruik als route-tip voor Lena): ${speeltuinen.map(s => `${s.name} (${s.coords[0].toFixed(3)}, ${s.coords[1].toFixed(3)})`).join('; ')}.`

    const systemWithContext = SYSTEM_PROMPT + marktContext + visitedContext + speeltuinenContext

    if (phase === 'suggest') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: systemWithContext,
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
        .map(u => `${u.name} (coords: ${u.coords[0]}, ${u.coords[1]}): ${u.desc} (${u.drive}, maps: ${u.gmaps})`)
        .join('\n')

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemWithContext,
        messages: [
          {
            role: 'user',
            content: `Weer: ${weather}
Gewenste activiteit: ${activity}
Maximale rijduur: ${driveTime}
Gekozen uitjes:
${selectedText}

Maak een logische route en tijdschema. Houd rekening met Lena's ritme (actief 9-12, lunch 12:30, rust/autorit 13-15, kort venster 15-17, uiterlijk 17:30 terug).

Per stop: tijd, naam, 1 zin met iets interessants, praktische tip, Google Maps link.
Schrijf alleen het programma, geen inleidingen of afsluitteksten. Schrijf in het Nederlands.

Antwoord ALLEEN met geldige JSON:
{
  "intro": null,
  "stops": [
    {
      "time": "10:00",
      "name": "naam",
      "description": "beschrijving",
      "tip": "tip",
      "mapsUrl": "url",
      "isTip": false
    }
  ],
  "checklist": ["item1", "item2"]
}
Gebruik "isTip": true voor optionele tussenstops (speeltuinen, boulangeries etc.).`,
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
