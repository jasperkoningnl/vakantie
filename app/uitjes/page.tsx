'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { uitjes, Uitje, UitjeType } from '@/lib/uitjes'

const UitjesMap = dynamic(() => import('@/components/UitjesMap'), { ssr: false })

type FilterValue = UitjeType | 'all' | 'lena'

interface Filter {
  label: string
  value: FilterValue
  icon: string
}

const FILTERS: Filter[] = [
  { label: 'Alles',       value: 'all',           icon: 'explore' },
  { label: 'Lena',        value: 'lena',           icon: 'child_care' },
  { label: 'Cultuur',     value: 'culture',        icon: 'museum' },
  { label: 'Natuur',      value: 'entertainment',  icon: 'attractions' },
  { label: 'Eten',        value: 'food',           icon: 'restaurant' },
  { label: 'Winkels',     value: 'shop',           icon: 'shopping_cart' },
]

const LENA_IDS = ['u1', 'u2', 'u6', 'u13', 'u14', 'u19']

const TYPE_ICONS: Record<string, string> = {
  entertainment: 'attractions',
  culture: 'museum',
  food: 'restaurant',
  shop: 'shopping_cart',
}

const TYPE_COLORS: Record<string, string> = {
  entertainment: 'oklch(79% 0.16 83)',
  culture:       'oklch(57% 0.14 40)',
  food:          'oklch(65% 0.09 298)',
  shop:          'oklch(65% 0.10 218)',
}

const FILTER_COLORS: Record<string, string> = {
  all:           'oklch(57% 0.14 40)',
  lena:          'oklch(79% 0.16 83)',
  culture:       'oklch(57% 0.14 40)',
  entertainment: 'oklch(79% 0.16 83)',
  food:          'oklch(65% 0.09 298)',
  shop:          'oklch(65% 0.10 218)',
}

export default function UitjesPage() {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [basketIds, setBasketIds] = useState<string[]>([])
  const [visitedNames, setVisitedNames] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))

    // Haal bezochte uitjes op uit diary entries
    fetch('/api/diary')
      .then(r => r.json())
      .then((entries: Array<{ plan_text?: string }>) => {
        const names: string[] = []
        entries.forEach(e => {
          if (!e.plan_text) return
          try {
            const plan = typeof e.plan_text === 'string' && e.plan_text.startsWith('{')
              ? JSON.parse(e.plan_text)
              : null
            if (plan?.stops) {
              plan.stops.forEach((s: { name: string }) => names.push(s.name.toLowerCase()))
            }
          } catch { /* ignore */ }
        })
        setVisitedNames(names)
      })
      .catch(() => {})
  }, [])

  const filtered = uitjes.filter(u => {
    if (filter === 'all') return true
    if (filter === 'lena') return LENA_IDS.includes(u.id)
    return u.type === filter
  })

  const isVisited = (u: Uitje) => visitedNames.some(n => n.includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(n))

  const toggleBasket = (id: string) => {
    setBasketIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('dagplan_basket', JSON.stringify(next))
      return next
    })
  }

  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'nl-NL'
    speechSynthesis.speak(utter)
  }

  const activeColor = FILTER_COLORS[filter]

  return (
    <div className="px-4 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-3xl font-medium"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Uitjes
        </h1>
        {/* List / Kaart toggle */}
        <div
          className="flex rounded-xl overflow-hidden p-0.5"
          style={{ background: '#F0E9DA' }}
        >
          {(['list', 'map'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-all"
              style={
                view === v
                  ? { background: '#FAF7F0', color: '#2C2316', boxShadow: '0 1px 3px rgba(44,35,22,0.1)' }
                  : { color: '#A8937A' }
              }
            >
              {v === 'list' ? 'Lijst' : 'Kaart'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters — 3×2 grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {FILTERS.map(f => {
          const isActive = filter === f.value
          const color = FILTER_COLORS[f.value]
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="rounded-2xl py-2.5 flex flex-col items-center gap-1 transition-all"
              style={
                isActive
                  ? { background: `${color}18`, border: `2px solid ${color}`, color }
                  : { background: '#FAF7F0', border: '2px solid #E4D9C8', color: '#6B5A3E' }
              }
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {f.icon}
              </span>
              <span className="text-xs font-semibold leading-none">{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Result count */}
      <p className="text-xs mb-3" style={{ color: '#A8937A' }}>
        {filtered.length} uitje{filtered.length !== 1 ? 's' : ''}
        {filter !== 'all' && <span> · <button className="underline" onClick={() => setFilter('all')}>Wis filter</button></span>}
      </p>

      {/* Map view */}
      {view === 'map' && (
        <div
          className="rounded-2xl overflow-hidden mb-4 shadow-blue"
          style={{ height: 'calc(100vh - 280px)', border: '1px solid #E4D9C8' }}
        >
          <UitjesMap
            uitjes={filtered}
            selected={selectedMapId}
            onSelect={setSelectedMapId}
            basketIds={basketIds}
            onBasket={toggleBasket}
          />
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="flex flex-col gap-3">
          {filtered.map(u => (
            <UitjeCard
              key={u.id}
              uitje={u}
              inBasket={basketIds.includes(u.id)}
              onToggle={toggleBasket}
              onSpeak={speak}
              visited={isVisited(u)}
            />
          ))}
        </div>
      )}

      {/* Basket bar */}
      {basketIds.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-40">
          <div
            className="max-w-md mx-auto rounded-2xl p-3 flex items-center gap-3"
            style={{ background: '#2C2316', boxShadow: '0 4px 20px rgba(44,35,22,0.3)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'oklch(79% 0.16 83)' }}>shopping_bag</span>
            <p className="flex-1 text-sm font-semibold text-white">
              {basketIds.length} uitje{basketIds.length > 1 ? 's' : ''} in je plan
            </p>
            <a
              href="/vandaag"
              className="rounded-full text-white text-xs font-bold px-3 py-1.5"
              style={{ background: 'oklch(57% 0.14 40)' }}
            >
              Maak dagplan →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function UitjeCard({
  uitje,
  inBasket,
  onToggle,
  onSpeak,
  visited,
}: {
  uitje: Uitje
  inBasket: boolean
  onToggle: (id: string) => void
  onSpeak: (text: string) => void
  visited: boolean
}) {
  const c = TYPE_COLORS[uitje.type] || 'oklch(57% 0.14 40)'

  return (
    <div
      className="rounded-2xl p-4 shadow-blue transition-opacity"
      style={{
        background: '#FAF7F0',
        border: '1px solid #E4D9C8',
        opacity: visited ? 0.65 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${c}20` }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: c, fontVariationSettings: "'FILL' 1" }}
          >
            {TYPE_ICONS[uitje.type]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-on-surface truncate">{uitje.name}</h3>
              {visited && (
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(58% 0.10 148)' }}>
                  ✓ Bezocht
                </span>
              )}
            </div>
            <span
              className="text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ background: '#F0E9DA', color: '#6B5A3E' }}
            >
              {uitje.drive}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{uitje.desc}</p>
          {uitje.vegetarian && (
            <span className="inline-flex items-center gap-1 text-xs font-medium mt-1" style={{ color: 'oklch(58% 0.10 148)' }}>
              🌿 Vegetarisch
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-3 mt-3 pt-3"
        style={{ borderTop: '1px solid #E4D9C8' }}
      >
        <a
          href={uitje.gmaps}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold"
          style={{ color: 'oklch(65% 0.10 218)' }}
        >
          Maps
        </a>
        {uitje.wiki && (
          <a
            href={uitje.wiki}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold"
            style={{ color: 'oklch(65% 0.10 218)' }}
          >
            Wikipedia
          </a>
        )}
        {uitje.site && (
          <a
            href={uitje.site}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold"
            style={{ color: 'oklch(65% 0.10 218)' }}
          >
            Website
          </a>
        )}
        <button
          onClick={() => onSpeak(uitje.desc)}
          className="text-on-surface-variant"
          aria-label="Lees voor"
        >
          <span className="material-symbols-outlined text-xl">volume_up</span>
        </button>
        <button
          onClick={() => onToggle(uitje.id)}
          className="ml-auto rounded-full px-4 py-1.5 text-xs font-bold transition-all"
          style={
            inBasket
              ? { background: 'oklch(57% 0.14 40)', color: 'white' }
              : { background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '1px solid #E4D9C8' }
          }
        >
          {inBasket ? '✓ Toegevoegd' : 'Voeg toe aan vandaag'}
        </button>
      </div>
    </div>
  )
}
