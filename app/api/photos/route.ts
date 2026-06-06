import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json(
      {
        error: 'Google Photos moet opnieuw gekoppeld worden.',
        code: 'GOOGLE_PHOTOS_RECONNECT_REQUIRED',
      },
      { status: 401 },
    )
  }

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Datum vereist' }, { status: 400 })

  const dateObj = new Date(date)
  const nextDay = new Date(dateObj)
  nextDay.setDate(nextDay.getDate() + 1)

  const filters = {
    dateFilter: {
      ranges: [
        {
          startDate: {
            year: dateObj.getFullYear(),
            month: dateObj.getMonth() + 1,
            day: dateObj.getDate(),
          },
          endDate: {
            year: nextDay.getFullYear(),
            month: nextDay.getMonth() + 1,
            day: nextDay.getDate(),
          },
        },
      ],
    },
  }

  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filters, pageSize: 50 }),
  })

  if (res.status === 401 || res.status === 403) {
    return NextResponse.json(
      {
        error: 'Google Photos toegang is verlopen of geweigerd. Verbind opnieuw met Google Photos.',
        code: 'GOOGLE_PHOTOS_RECONNECT_REQUIRED',
      },
      { status: 401 },
    )
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Google Photos fout' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data.mediaItems || [])
}
