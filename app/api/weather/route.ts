import { NextResponse } from 'next/server'

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=44.398&longitude=1.119&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3'

export async function GET() {
  const res = await fetch(WEATHER_URL, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 * 60 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Weerbericht ophalen mislukt.' },
      { status: 502 },
    )
  }

  const data = await res.json()
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  })
}
