import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TEXT_LIMIT = 500
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

export function limitText(value: unknown, maxLength = DEFAULT_TEXT_LIMIT): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLength)
}

export function limitStringArray(value: unknown, maxItems: number, maxLength = DEFAULT_TEXT_LIMIT): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map(item => limitText(item, maxLength))
}

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  const sessionCookie = req.cookies.get('next-auth.session-token')?.value
    || req.cookies.get('__Secure-next-auth.session-token')?.value
    || req.cookies.get('authjs.session-token')?.value
    || req.cookies.get('__Secure-authjs.session-token')?.value

  return forwardedFor || realIp || sessionCookie || 'unknown-client'
}

export function checkRateLimit(req: NextRequest, routeName: string): NextResponse | null {
  const now = Date.now()
  const key = `${routeName}:${getClientKey(req)}`
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return null
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    )
  }

  bucket.count += 1
  return null
}

export function logMinimalApiError(routeName: string, err: unknown) {
  const errorName = err instanceof Error ? err.name : typeof err
  console.error(`[${routeName}] error`, { errorName })
}
