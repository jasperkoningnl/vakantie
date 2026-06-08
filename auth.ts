import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { JWT } from 'next-auth/jwt'

const GOOGLE_PHOTOS_CONNECTION_MAX_AGE_SECONDS = 21 * 24 * 60 * 60
const GOOGLE_ACCESS_TOKEN_FALLBACK_TTL_SECONDS = 60 * 60
const TOKEN_REFRESH_BUFFER_SECONDS = 5 * 60

type GoogleTokenRefreshResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  error?: string
  error_description?: string
}

function getAccessTokenExpiresAt(
  accountExpiresAt?: number,
  accountExpiresIn?: number,
) {
  if (accountExpiresAt) return accountExpiresAt

  return (
    Math.floor(Date.now() / 1000) +
    (accountExpiresIn ?? GOOGLE_ACCESS_TOKEN_FALLBACK_TTL_SECONDS)
  )
}

function clearAccessToken(token: JWT, error: JWT['error']) {
  delete token.accessToken
  token.error = error
  return token
}

async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return clearAccessToken(token, 'MissingRefreshToken')
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = (await response.json()) as GoogleTokenRefreshResponse

    if (!response.ok || !refreshedTokens.access_token) {
      console.error('Failed to refresh Google access token', {
        status: response.status,
        error: refreshedTokens.error,
        errorDescription: refreshedTokens.error_description,
      })
      return clearAccessToken(token, 'RefreshAccessTokenError')
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt:
        Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in ?? 3600),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    }
  } catch (error) {
    console.error('Failed to refresh Google access token', error)
    return clearAccessToken(token, 'RefreshAccessTokenError')
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/photoslibrary.readonly',
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: GOOGLE_PHOTOS_CONNECTION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: GOOGLE_PHOTOS_CONNECTION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token ?? token.refreshToken
        token.expiresAt = getAccessTokenExpiresAt(
          account.expires_at,
          account.expires_in,
        )
        token.error = undefined
      }

      if (!token.accessToken) {
        return token
      }

      if (
        token.expiresAt &&
        Date.now() < (token.expiresAt - TOKEN_REFRESH_BUFFER_SECONDS) * 1000
      ) {
        return token
      }

      return refreshGoogleAccessToken(token)
    },
    async session({ session, token }) {
      if (token.accessToken && !token.error) {
        session.accessToken = token.accessToken
      } else {
        delete session.accessToken
      }

      if (token.error) {
        session.error = token.error
      }

      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})
