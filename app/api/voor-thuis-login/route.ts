import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ai-request-safety'
import {
  isCorrectVoorthuisPassword,
  voorthuisCookieValue,
  VOORTHUIS_COOKIE,
  VOORTHUIS_COOKIE_MAX_AGE,
} from '@/lib/voorthuis-auth'

export async function POST(req: NextRequest) {
  const rateLimited = checkRateLimit(req, '/api/voor-thuis-login')
  if (rateLimited) return rateLimited

  let wachtwoord: unknown
  try {
    const formData = await req.formData()
    wachtwoord = formData.get('wachtwoord')
  } catch {
    wachtwoord = null
  }

  if (!isCorrectVoorthuisPassword(wachtwoord)) {
    return NextResponse.redirect(new URL('/voor-thuis?fout=1', req.url), 303)
  }

  const res = NextResponse.redirect(new URL('/voor-thuis', req.url), 303)
  res.cookies.set(VOORTHUIS_COOKIE, voorthuisCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VOORTHUIS_COOKIE_MAX_AGE,
  })
  return res
}
