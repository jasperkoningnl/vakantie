import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit, limitText, logMinimalApiError } from '@/lib/ai-request-safety'

export async function POST(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  const rateLimited = checkRateLimit(req, '/api/tussenstop')
  if (rateLimited) return rateLimited

  try {
    const { van, naar, route, lat, lon } = await req.json()
    const safeVan = limitText(van, 120)
    const safeNaar = limitText(naar, 120)
    const safeRoute = limitText(route, 800)
    const safeLat = limitText(lat, 32)
    const safeLon = limitText(lon, 32)

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: 'Je bent een vriendelijke reisassistent voor een Nederlands gezin op vakantie.',
      messages: [
        {
          role: 'user',
          content: `Het gezin rijdt vandaag van ${safeVan} naar ${safeNaar} via ${safeRoute}. Hun huidige locatie is ${safeLat}, ${safeLon}. Stel een tussenstop voor: een dorpje waar ze even van de snelweg af kunnen, Lena (4 jaar) kan rondrennen, en ze ergens kunnen lunchen of een koffie drinken. Geef naam, korte omschrijving (max 2 zinnen), en een Google Maps link. Denk aan dorpspleinen, boulangeries, parken langs de route. Schrijf in het Nederlands.\n\nAntwoord ALLEEN met geldige JSON:\n{"naam": "...", "beschrijving": "...", "gmaps": "https://..."}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip fenced code blocks if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err) {
    logMinimalApiError('/api/tussenstop', err)
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 })
  }
}
