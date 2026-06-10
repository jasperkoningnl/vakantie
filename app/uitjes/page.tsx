'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { uitjes, Uitje, UitjeType } from '@/lib/uitjes'

const UitjesMap = dynamic(() => import('@/components/UitjesMap'), { ssr: false })

const HOME_COORDS: [number, number] = [44.398, 1.119]

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLon = (b[1] - a[1]) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

type FilterValue = UitjeType | 'all' | 'lena' | 'nature' | 'nearby'

interface Filter {
  label: string
  value: FilterValue
  icon: string
}

const FILTERS: Filter[] = [
  { label: 'Vermaak',      value: 'lena',    icon: 'child_care' },
  { label: 'Cultuur',      value: 'culture', icon: 'museum' },
  { label: 'Natuur',       value: 'nature',  icon: 'forest' },
  { label: 'Eten',         value: 'food',    icon: 'restaurant' },
  { label: 'Bakkers',      value: 'bakery',  icon: 'bakery_dining' },
  { label: 'Boodschappen', value: 'shop',    icon: 'shopping_cart' },
]

const LENA_IDS = ['u1', 'u2', 'u6', 'u14', 'u19', 'u22', 'u23', 'u29', 'u30', 'u31', 'u32']

const TYPE_ICONS: Record<string, string> = {
  entertainment: 'attractions',
  nature:        'forest',
  culture:       'museum',
  food:          'restaurant',
  shop:          'shopping_cart',
  bakery:        'bakery_dining',
}

const TYPE_COLORS: Record<string, string> = {
  entertainment: 'oklch(79% 0.16 83)',
  nature:        'oklch(58% 0.10 148)',
  culture:       'oklch(57% 0.14 40)',
  food:          'oklch(65% 0.09 298)',
  shop:          'oklch(65% 0.10 218)',
  bakery:        'oklch(72% 0.14 60)',
}

const FILTER_COLORS: Record<string, string> = {
  all:           'oklch(57% 0.14 40)',
  nearby:        'oklch(60% 0.11 185)',
  lena:          'oklch(79% 0.16 83)',
  culture:       'oklch(57% 0.14 40)',
  entertainment: 'oklch(79% 0.16 83)',
  nature:        'oklch(58% 0.10 148)',
  food:          'oklch(65% 0.09 298)',
  shop:          'oklch(65% 0.10 218)',
  bakery:        'oklch(72% 0.14 60)',
}

export default function UitjesPage() {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [basketIds, setBasketIds] = useState<string[]>([])
  const [visitedNames, setVisitedNames] = useState<string[]>([])
  const [detailUitje, setDetailUitje] = useState<Uitje | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)

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

  useEffect(() => {
    if (filter !== 'nearby' || userLocation || locationDenied) return
    if (!('geolocation' in navigator)) { setLocationDenied(true); return }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setLocationDenied(true),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [filter, userLocation, locationDenied])

  // Lock body scroll when detail sheet is open
  useEffect(() => {
    if (detailUitje) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [detailUitje])

  const locationBase: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : HOME_COORDS

  const filtered = uitjes.filter(u => {
    if (filter === 'all' || filter === 'nearby') return true
    if (filter === 'lena') return !!u.lena
    if (filter === 'nature') return u.type === 'nature' || u.type === 'entertainment'
    if (filter === 'food') return u.type === 'food'
    if (filter === 'shop') return u.type === 'shop' || u.type === 'bakery'
    return u.type === filter
  }).sort((a, b) => {
    if (filter !== 'nearby') return 0
    return haversineKm(locationBase, a.coords) - haversineKm(locationBase, b.coords)
  })

  const isVisited = (u: Uitje) => visitedNames.some(n => n.includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(n))

  const toggleBasket = (id: string) => {
    setBasketIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('dagplan_basket', JSON.stringify(next))
      return next
    })
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
          style={{ height: 'calc(100vh - 360px)', border: '1px solid #E4D9C8', isolation: 'isolate' }}
        >
          <UitjesMap
            uitjes={filtered}
            selected={selectedMapId}
            onSelect={(id) => {
              setSelectedMapId(id)
              const u = filtered.find(x => x.id === id)
              if (u) setDetailUitje(u)
            }}
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
              onDetail={setDetailUitje}
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

      {/* Detail bottom sheet */}
      {detailUitje && (
        <div
          className="fixed inset-0 z-[60] flex items-end"
          style={{ background: 'rgba(44,35,22,0.45)' }}
          onClick={() => setDetailUitje(null)}
        >
          <div
            className="relative w-full rounded-t-3xl overflow-y-auto"
            style={{
              background: '#FAF7F0',
              maxHeight: '85vh',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#D6C9B0' }} />
            </div>

            <div className="px-5 pb-2 pt-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${TYPE_COLORS[detailUitje.type] || 'oklch(57% 0.14 40)'}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: TYPE_COLORS[detailUitje.type], fontVariationSettings: "'FILL' 1" }}
                    >
                      {TYPE_ICONS[detailUitje.type]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg leading-tight" style={{ color: '#2C2316' }}>
                      {detailUitje.name}
                    </h2>
                    <span
                      className="text-xs font-semibold rounded-full px-2 py-0.5 inline-block mt-0.5"
                      style={{ background: '#F0E9DA', color: '#6B5A3E' }}
                    >
                      {detailUitje.drive}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailUitje(null)}
                  className="ml-2 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: '#F0E9DA', color: '#6B5A3E' }}
                  aria-label="Sluiten"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: '#4A3B2C' }}>
                {detailUitje.desc}
              </p>

              {detailUitje.vegetarian && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium mt-2"
                  style={{ color: 'oklch(58% 0.10 148)' }}
                >
                  🌿 Vegetarisch
                </span>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2 mt-4">
                <a
                  href={detailUitje.gmaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#F0E9DA', color: 'oklch(65% 0.10 218)' }}
                >
                  📍 Maps
                </a>
                {detailUitje.wiki && (
                  <a
                    href={detailUitje.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#F0E9DA', color: 'oklch(65% 0.10 218)' }}
                  >
                    Wikipedia
                  </a>
                )}
                {detailUitje.site && (
                  <a
                    href={detailUitje.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: '#F0E9DA', color: 'oklch(65% 0.10 218)' }}
                  >
                    Website
                  </a>
                )}
              </div>

              {/* Kies als bestemming */}
              <button
                onClick={() => {
                  const saved = localStorage.getItem('dagplan_basket')
                  const basket: string[] = saved ? JSON.parse(saved) : []
                  if (!basket.includes(detailUitje.id)) {
                    basket.push(detailUitje.id)
                    localStorage.setItem('dagplan_basket', JSON.stringify(basket))
                  }
                  localStorage.setItem('dagplan_destination', detailUitje.id)
                  window.location.href = '/vandaag'
                }}
                className="w-full mt-4 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: TYPE_COLORS[detailUitje.type] || 'oklch(57% 0.14 40)', color: 'white' }}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                Kies als bestemming
              </button>

              {/* Basket button */}
              <button
                onClick={() => toggleBasket(detailUitje.id)}
                className="w-full mt-2 rounded-2xl py-3 text-sm font-bold transition-all"
                style={
                  basketIds.includes(detailUitje.id)
                    ? { background: 'oklch(93% 0.05 40)', color: 'oklch(57% 0.14 40)', border: '1.5px solid oklch(57% 0.14 40 / 0.4)' }
                    : { background: '#F0E9DA', color: '#6B5A3E', border: '1px solid #E4D9C8' }
                }
              >
                {basketIds.includes(detailUitje.id) ? '✓ Toegevoegd als tussenstop' : 'Voeg toe als tussenstop'}
              </button>
            </div>
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
  onDetail,
  visited,
}: {
  uitje: Uitje
  inBasket: boolean
  onToggle: (id: string) => void
  onDetail: (uitje: Uitje) => void
  visited: boolean
}) {
  const c = TYPE_COLORS[uitje.type] || 'oklch(57% 0.14 40)'

  return (
    <div
      className="rounded-2xl p-4 shadow-blue transition-opacity cursor-pointer active:scale-[0.99]"
      style={{
        background: '#FAF7F0',
        border: '1px solid #E4D9C8',
        opacity: visited ? 0.65 : 1,
      }}
      onClick={() => onDetail(uitje)}
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
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="text-xs font-semibold rounded-full px-2 py-0.5"
                style={{ background: '#F0E9DA', color: '#6B5A3E' }}
              >
                {uitje.drive}
              </span>
              <span className="material-symbols-outlined text-base" style={{ color: '#A8937A' }}>
                chevron_right
              </span>
            </div>
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
        onClick={e => e.stopPropagation()}
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
