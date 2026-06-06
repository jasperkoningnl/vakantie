import 'next-auth'
import 'next-auth/jwt'

type GooglePhotosAuthError = 'MissingRefreshToken' | 'RefreshAccessTokenError'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: GooglePhotosAuthError
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: GooglePhotosAuthError
  }
}
