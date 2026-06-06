import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export async function requirePrivatePageAccess(callbackUrl: string) {
  const session = await auth()

  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return session
}
