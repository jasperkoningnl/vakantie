import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Providers } from '@/components/Providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Notre Voyage',
  description: 'Familie vakantie in de Lot, Zuid-Frankrijk',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} antialiased`}>
      <body className="bg-amber-50 min-h-screen">
        <Providers>
          <main className="max-w-md mx-auto min-h-screen pb-24 px-4">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
