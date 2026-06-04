'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/vandaag', label: 'Vandaag' },
  { href: '/uitjes',  label: 'Uitjes'  },
  { href: '/dagboek', label: 'Dagboek' },
  { href: '/medisch', label: 'Medisch' },
  { href: '/route',   label: 'Route'   },
]

function VandaagIcon({ c }: { c: string }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="4" fill={c} />
      {angles.map((a) => {
        const rad = (a * Math.PI) / 180
        return (
          <line
            key={a}
            x1={11 + 6.5 * Math.cos(rad)}
            y1={11 + 6.5 * Math.sin(rad)}
            x2={11 + 8.5 * Math.cos(rad)}
            y2={11 + 8.5 * Math.sin(rad)}
            stroke={c}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

function UitjesIcon({ c }: { c: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 17L8 5L11 13L14 8L17 17" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="6" r="2" fill={c} opacity="0.6" />
    </svg>
  )
}

function DagboekIcon({ c }: { c: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="3" width="11" height="16" rx="2" stroke={c} strokeWidth="1.6" />
      <path d="M4 5C4 5 6 6 6 11C6 16 4 17 4 17" stroke={c} strokeWidth="1.6" />
      <line x1="8.5" y1="8"  x2="12.5" y2="8"  stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8.5" y1="11" x2="12.5" y2="11" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8.5" y1="14" x2="11"   y2="14" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 3L15 19" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 3C15 3 18 4 18 11C18 18 15 19 15 19" stroke={c} strokeWidth="1.6" />
    </svg>
  )
}

function MedischIcon({ c }: { c: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="3.5" width="15" height="15" rx="3" stroke={c} strokeWidth="1.6" />
      <line x1="11" y1="7.5"  x2="11"   y2="14.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="7.5" y1="11" x2="14.5" y2="11"   stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function RouteIcon({ c }: { c: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="5"  cy="6"  r="2.2" stroke={c} strokeWidth="1.6" />
      <circle cx="17" cy="16" r="2.2" stroke={c} strokeWidth="1.6" />
      <path d="M5 8.2C5 8.2 5 13 11 13C17 13 17 8 17 8V13.8" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const ICONS = {
  '/vandaag': VandaagIcon,
  '/uitjes':  UitjesIcon,
  '/dagboek': DagboekIcon,
  '/medisch': MedischIcon,
  '/route':   RouteIcon,
}

export function BottomNav() {
  const path = usePathname()

  if (path === '/voor-thuis') return null

  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-50 safe-area-pb bg-surface border-t border-outline-variant">
      <div className="max-w-md mx-auto flex">
        {nav.map(({ href, label }) => {
          const active = path.startsWith(href)
          const Icon = ICONS[href as keyof typeof ICONS]
          const color = active ? 'oklch(57% 0.14 40)' : '#A8937A'
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors`}
            >
              <Icon c={color} />
              <span
                className="text-[9px] font-semibold tracking-wide"
                style={{ color }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
