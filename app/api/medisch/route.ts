import { NextRequest, NextResponse } from 'next/server'
import { requirePrivateAccess } from '@/lib/api-auth'
import { isMedischContent, saveMedischContent } from '@/lib/medisch-content'

const MAX_BODY_LENGTH = 30_000

export async function PUT(req: NextRequest) {
  const unauthorized = await requirePrivateAccess()
  if (unauthorized) return unauthorized

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return NextResponse.json({ error: 'Verzoek kon niet worden gelezen.' }, { status: 400 })
  }

  if (raw.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: 'De medische inhoud is te groot.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  if (!isMedischContent(body)) {
    return NextResponse.json(
      { error: 'De JSON mist verplichte velden (urgencyText, medicalLetter, hospitals).' },
      { status: 400 },
    )
  }

  try {
    await saveMedischContent(body)
  } catch {
    return NextResponse.json({ error: 'Opslaan in Supabase mislukte. Probeer opnieuw.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
