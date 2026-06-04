import { NextResponse } from 'next/server'

// Porte-du-Quercy, Lot, France
const LAT = 44.45
const LON = 1.45

export async function GET() {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(LAT))
    url.searchParams.set('longitude', String(LON))
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,weathercode,windspeed_10m,precipitation_probability,relativehumidity_2m'
    )
    url.searchParams.set(
      'daily',
      'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    )
    url.searchParams.set('timezone', 'Europe/Paris')
    url.searchParams.set('forecast_days', '5')

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } })
    if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Weer API fout:', err)
    return NextResponse.json({ error: 'Weer ophalen mislukt' }, { status: 500 })
  }
}
