import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { weather, date } = await req.json()

    const weerContext = weather
      ? `Weer vandaag: ${Math.round(weather.temperature_2m)}°C (voelt als ${Math.round(weather.apparent_temperature)}°C), ${weather.description}, wind ${Math.round(weather.windspeed_10m)} km/h, neerslagkans ${weather.precipitation_probability}%, luchtvochtigheid ${weather.relativehumidity_2m}%.`
      : 'Weersomstandigheden niet beschikbaar.'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Je bent een enthousiaste vakantie-assistent voor een Nederlands gezin op zomervakantie in de Lot, Zuid-Frankrijk. Ze verblijven bij "Les Escaliers de La Combe" in Porte-du-Quercy.

Datum: ${date}
${weerContext}

Maak een concreet dagplan met 3–4 activiteiten. Houd rekening met het weer. Kies uit: Saint-Cirq-Lapopie, Cahors, Rocamadour, Pech Merle grot, kanoën op de Lot, lokale markt, picknick, zwemmen, wijnproeverij Cahors, Bonaguil kasteel, etc.

Schrijf in het Nederlands, in een warme en enthousiaste toon. Format:
⏰ [tijd] **[activiteit]** – [korte beschrijving (1 zin)]

Geen inleiding, geen afsluiting. Alleen het dagplan.`,
        },
      ],
    })

    const plan = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ plan })
  } catch (err) {
    console.error('Dagplanner fout:', err)
    return NextResponse.json({ error: 'Dagplan genereren mislukt' }, { status: 500 })
  }
}
