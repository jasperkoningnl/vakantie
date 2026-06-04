'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, BookOpen, Camera, Home } from 'lucide-react'

const nav = [
  { href: '/vandaag', label: 'Vandaag', Icon: Sun },
  { href: '/dagboek', label: 'Dagboek', Icon: BookOpen },
  { href: '/fotos', label: "Foto's", Icon: Camera },
  { href: '/thuis', label: 'Thuis', Icon: Home },
]

export function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-amber-100 z-50 safe-area-pb">
      <div className="max-w-md mx-auto flex">
        {nav.map(({ href, label, Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-amber-600' : 'text-stone-400 hover:text-stone-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
