import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { Providers } from '@/components/Providers'
import SwRegistration from '@/components/SwRegistration'
import PwaInstallBanner from '@/components/PwaInstallBanner'
import { MaterialIconHydrator } from '@/components/MaterialIconHydrator'

export const metadata: Metadata = {
  title: 'Notre Voyage',
  description: 'Familie vakantie in de Lot, Zuid-Frankrijk',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C5F42" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-background text-on-surface min-h-screen">
        <SwRegistration />
        <MaterialIconHydrator />
        <Providers>
          <PwaInstallBanner />
          <main className="max-w-md mx-auto min-h-screen pb-24">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
