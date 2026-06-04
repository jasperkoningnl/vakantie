'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/vandaag', label: 'Vandaag', icon: 'wb_sunny' },
  { href: '/uitjes', label: 'Uitjes', icon: 'explore' },
  { href: '/dagboek', label: 'Dagboek', icon: 'auto_stories' },
  { href: '/medisch', label: 'Medisch', icon: 'medical_services' },
  { href: '/route', label: 'Route', icon: 'route' },
]

export function BottomNav() {
  const path = usePathname()

  if (path === '/voor-thuis') return null

  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-50 safe-area-pb backdrop-blur-md bg-white/70 border-t border-outline-variant">
      <div className="max-w-md mx-auto flex">
        {nav.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] leading-none"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
