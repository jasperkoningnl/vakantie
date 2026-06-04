import type { Metadata, Viewport } from 'next'
import { DM_Sans, Cormorant_Garamond, Caveat } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Providers } from '@/components/Providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-caveat',
})

export const metadata: Metadata = {
  title: 'Notre Voyage',
  description: 'Familie vakantie in de Lot, Zuid-Frankrijk',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${dmSans.variable} ${cormorant.variable} ${caveat.variable} antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="bg-background text-on-surface min-h-screen">
        <Providers>
          <main className="max-w-md mx-auto min-h-screen pb-24">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
