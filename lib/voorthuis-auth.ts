import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

// Gedeeld wachtwoord voor de thuisblijverspagina. Bewust een simpele,
// deelbare drempel (geen account nodig voor familie); via de env-variabele
// VOORTHUIS_PASSWORD is het wachtwoord aan te passen zonder code-wijziging.
const DEFAULT_PASSWORD = 'thuisblijver'

export const VOORTHUIS_COOKIE = 'voorthuis_auth'
export const VOORTHUIS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

function getPassword(): string {
  return process.env.VOORTHUIS_PASSWORD || DEFAULT_PASSWORD
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Cookiewaarde is een HMAC van het wachtwoord: niet te raden zonder secret,
// en alle uitgedeelde cookies vervallen vanzelf zodra het wachtwoord wijzigt.
export function voorthuisCookieValue(): string {
  return createHmac('sha256', process.env.NEXTAUTH_SECRET ?? 'voorthuis')
    .update(getPassword())
    .digest('hex')
}

export function isCorrectVoorthuisPassword(input: unknown): boolean {
  return typeof input === 'string' && safeEqual(input.trim(), getPassword())
}

export async function hasVoorthuisAccess(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(VOORTHUIS_COOKIE)?.value
  if (!value) return false
  return safeEqual(value, voorthuisCookieValue())
}
