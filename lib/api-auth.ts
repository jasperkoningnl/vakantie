import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function requirePrivateAccess(): Promise<NextResponse | null> {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Inloggen is vereist voor deze privé API-route.' },
      { status: 401 },
    )
  }

  return null
}
