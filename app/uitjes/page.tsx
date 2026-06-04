'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { uitjes, Uitje, UitjeType } from '@/lib/uitjes'

const UitjesMap = dynamic(() => import('@/components/UitjesMap'), { ssr: false })

const FILTERS: { label: string; value: UitjeType | 'all' | 'lena' }[] = [
  { label: 'Alles', value: 'all' },
  { label: 'Lena', value: 'lena' },
  { label: 'Cultuur', value: 'culture' },
  { label: 'Natuur', value: 'entertainment' },
  { label: 'Eten', value: 'food' },
  { label: 'Boodschappen', value: 'shop' },
]

const LENA_IDS = ['u1', 'u2', 'u6', 'u13', 'u14']

const TYPE_ICONS: Record<string, string> = {
  entertainment: 'attractions',
  culture: 'museum',
  food: 'restaurant',
  shop: 'shopping_cart',
}

const TYPE_COLORS: Record<string, string> = {
  entertainment: 'bg-primary/20 text-primary',
  culture: 'bg-tertiary/20 text-tertiary',
  food: 'bg-secondary/40 text-on-surface',
  shop: 'bg-green-100 text-green-700',
}

export default function UitjesPage() {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<string>('all')
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [basketIds, setBasketIds] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))
  }, [])

  const filtered = uitjes.filter(u => {
    if (filter === 'all') return true
    if (filter === 'lena') return LENA_IDS.includes(u.id)
    return u.type === filter
  })

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

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-on-surface">Uitjes</h1>
        <div className="flex rounded-full border border-outline-variant overflow-hidden">
          {(['list', 'map'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                view === v ? 'bg-primary text-white' : 'text-on-surface-variant'
              }`}
            >
              {v === 'list' ? 'Lijst' : 'Kaart'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold border transition-all ${
              filter === f.value
                ? 'bg-primary border-primary text-white'
                : 'bg-surface border-outline-variant text-on-surface'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="h-[calc(100vh-220px)] rounded-2xl overflow-hidden mb-4 shadow-blue">
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
            <UitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={toggleBasket} onSpeak={speak} />
          ))}
        </div>
      )}

      {/* Basket bar */}
      {basketIds.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-40">
          <div className="max-w-md mx-auto rounded-2xl bg-on-surface text-white p-3 flex items-center gap-3 shadow-lg">
            <span className="material-symbols-outlined text-secondary">shopping_bag</span>
            <p className="flex-1 text-sm font-semibold">
              {basketIds.length} uitje{basketIds.length > 1 ? 's' : ''} in je plan
            </p>
            <a
              href="/vandaag"
              className="rounded-full bg-primary text-white text-xs font-bold px-3 py-1.5"
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
}: {
  uitje: Uitje
  inBasket: boolean
  onToggle: (id: string) => void
  onSpeak: (text: string) => void
}) {
  return (
    <div className="rounded-2xl bg-surface border border-outline-variant p-4 shadow-blue">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[uitje.type]}`}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {TYPE_ICONS[uitje.type]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-on-surface">{uitje.name}</h3>
            <span className="text-xs font-semibold bg-outline-variant/60 rounded-full px-2 py-0.5 flex-shrink-0">
              {uitje.drive}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{uitje.desc}</p>
          {uitje.vegetarian && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium mt-1">
              🌿 Vegetarisch
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant">
        <a href={uitje.gmaps} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-tertiary">
          Maps
        </a>
        {uitje.wiki && (
          <a href={uitje.wiki} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-tertiary">
            Wikipedia
          </a>
        )}
        {uitje.site && (
          <a href={uitje.site} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-tertiary">
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
          className={`ml-auto rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            inBasket ? 'bg-primary text-white' : 'bg-primary/10 text-primary border border-primary/30'
          }`}
        >
          {inBasket ? '✓ Toegevoegd' : 'Voeg toe aan vandaag'}
        </button>
      </div>
    </div>
  )
}
