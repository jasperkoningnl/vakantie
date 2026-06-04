'use client'
import { useEffect, useState } from 'react'
import { WeatherData, wmoToDescription, wmoToEmoji, DayPlan } from '@/lib/types'
import { uitjes, Uitje } from '@/lib/uitjes'
import { marktdagen } from '@/lib/marktdagen'
import { reiskalender } from '@/lib/reiskalender'
import { getSupabase } from '@/lib/supabase'

// Categorie-knoppen voor de dagbouwer
const CATEGORIES = [
  { label: 'Iets voor Lena', icon: 'child_care',    value: 'lena',          color: 'oklch(79% 0.16 83)',  bg: 'oklch(92% 0.07 83)',  uitjeFilter: (u: Uitje) => ['u1','u2','u6','u13','u14','u19'].includes(u.id) },
  { label: 'Kasteel of dorp', icon: 'castle',        value: 'culture',       color: 'oklch(57% 0.14 40)',  bg: 'oklch(93% 0.05 40)',  uitjeFilter: (u: Uitje) => u.type === 'culture' },
  { label: 'Water of bos',    icon: 'forest',        value: 'nature',        color: 'oklch(58% 0.10 148)', bg: 'oklch(92% 0.05 148)', uitjeFilter: (u: Uitje) => u.type === 'entertainment' },
  { label: 'Lekker eten',     icon: 'restaurant',    value: 'food',          color: 'oklch(65% 0.09 298)', bg: 'oklch(92% 0.05 298)', uitjeFilter: (u: Uitje) => u.type === 'food' },
  { label: 'Boodschappen',    icon: 'shopping_cart', value: 'shop',          color: 'oklch(65% 0.10 218)', bg: 'oklch(92% 0.05 218)', uitjeFilter: (u: Uitje) => u.type === 'shop' },
  { label: 'Verras ons',      icon: 'auto_awesome',  value: 'surprise',      color: 'oklch(68% 0.11 10)',  bg: 'oklch(93% 0.05 10)',  uitjeFilter: () => true },
]

type Phase = 'build' | 'planning' | 'plan'

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0]
}

function getTodayMarkten() {
  const today = new Date().getDay()
  const dagNamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const todayNaam = dagNamen[today]
  return marktdagen.filter(m => m.dag === todayNaam)
}

function getRainWarning(weather: WeatherData | null): string | null {
  if (!weather?.daily?.precipitation_probability_max) return null
  const tomorrowProb = weather.daily.precipitation_probability_max[1]
  if (tomorrowProb > 60) {
    return `Morgen wordt het nat (${tomorrowProb}% kans op regen) — misschien een goed moment voor Pech-Merle of het Musée de l'Insolite?`
  }
  return null
}

export default function VandaagPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [phase, setPhase] = useState<Phase>('build')

  // Dagbouwer state
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [basketIds, setBasketIds] = useState<string[]>([])

  // Plan state
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  const today = getTodayDateStr()
  const todayEntry = reiskalender[today] ?? null
  const isReisdag = todayEntry?.type === 'reisdag'
  const isVerblijfChartres = todayEntry?.type === 'verblijf'
  const vandaagMarkten = getTodayMarkten()

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=44.521&longitude=1.150&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3'
    )
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {})

    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))

    // Laad eventueel bestaand dagplan
    fetch('/api/diary')
      .then(r => r.json())
      .then((data: Array<{ date: string; plan_text?: string }>) => {
        const todayEntry = data.find(e => e.date === today)
        if (todayEntry?.plan_text) {
          try {
            const plan = typeof todayEntry.plan_text === 'string' && todayEntry.plan_text.startsWith('{')
              ? JSON.parse(todayEntry.plan_text)
              : null
            if (plan?.stops) {
              setDayPlan(plan)
              setPhase('plan')
            }
          } catch { /* geen plan */ }
        }
      })
      .catch(() => {})
  }, [])

  const weatherDesc = weather
    ? `${wmoToEmoji(weather.current.weathercode)} ${Math.round(weather.current.temperature_2m)}°C — ${wmoToDescription(weather.current.weathercode)}`
    : 'Weerbericht laden…'

  const toggleCat = (val: string) => {
    setSelectedCats(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val])
  }

  const toggleBasket = (id: string) => {
    setBasketIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('dagplan_basket', JSON.stringify(next))
      return next
    })
  }

  const handlePlan = async () => {
    if (basketIds.length === 0) return
    setError(null)
    setPhase('planning')

    const visitedNames = await getVisitedNames()

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'plan',
          activity: selectedCats.join(', ') || 'surprise',
          driveTime: 'Max 2 uur',
          weather: weatherDesc,
          selectedIds: basketIds,
          visitedNames,
        }),
      })
      if (!res.ok) throw new Error(`Server: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDayPlan(data)
      setPhase('plan')

      await getSupabase().from('diary_entries').upsert(
        { date: today, plan_text: JSON.stringify(data) },
        { onConflict: 'date' }
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.')
      setPhase('build')
    }
  }

  const reset = () => {
    setPhase('build')
    setSelectedCats([])
    setBasketIds([])
    setDayPlan(null)
    setError(null)
    localStorage.removeItem('dagplan_basket')
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const rainWarning = getRainWarning(weather)

  return (
    <div className="px-4 pt-5 pb-28">
      {/* Journal header */}
      <div className="mb-4">
        <div className="text-xl font-semibold" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>
          Notre Voyage
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{dateStr}</div>
      </div>

      {/* Weer */}
      <WeatherCard weather={weather} />

      {/* Regenmelding morgen */}
      {rainWarning && phase === 'build' && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-start gap-2"
          style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.3)' }}
        >
          <span className="material-symbols-outlined text-base mt-0.5" style={{ color: 'oklch(65% 0.10 218)' }}>water_drop</span>
          <p className="text-sm" style={{ color: '#2C2316' }}>{rainWarning}</p>
        </div>
      )}

      {/* Marktdag banner */}
      {vandaagMarkten.length > 0 && phase === 'build' && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-start gap-2"
          style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.4)' }}
        >
          <span className="text-xl">🛒</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Marktdag vandaag!</p>
            {vandaagMarkten.map((m, i) => (
              <a key={i} href={m.gmaps} target="_blank" rel="noopener noreferrer"
                className="text-xs block" style={{ color: '#6B5A3E' }}>
                {m.plaats} — {m.omschrijving}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reisdag modus */}
      {isReisdag && todayEntry.type === 'reisdag' && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: 'linear-gradient(135deg, #2C2316, oklch(40% 0.12 40))', color: 'white' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
            <p className="font-semibold">{todayEntry.label}</p>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {todayEntry.van} → {todayEntry.naar}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{todayEntry.route}</p>
        </div>
      )}

      {/* Verblijf Chartres */}
      {isVerblijfChartres && todayEntry.type === 'verblijf' && (
        <div
          className="rounded-2xl p-3 mb-4"
          style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.3)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>
            📍 {todayEntry.verblijf} — {todayEntry.label}
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-start gap-2"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <span className="material-symbols-outlined text-base mt-0.5" style={{ color: '#EF4444' }}>error</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>Oeps, er ging iets mis</p>
            <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>{error}</p>
          </div>
          <button onClick={() => setError(null)} style={{ color: '#FCA5A5' }}>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Dagbouwer */}
      {phase === 'build' && (
        <Dagbouwer
          selectedCats={selectedCats}
          onToggleCat={toggleCat}
          basketIds={basketIds}
          onToggleBasket={toggleBasket}
          vandaagMarkten={vandaagMarkten}
        />
      )}

      {/* Planning loader */}
      {phase === 'planning' && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: 'oklch(57% 0.14 40)' }}>refresh</span>
          <p className="mt-4 font-semibold text-on-surface">Dagplan samenstellen…</p>
          <p className="text-sm text-on-surface-variant mt-1">Even geduld, dit duurt 10-20 seconden</p>
        </div>
      )}

      {/* Day plan */}
      {phase === 'plan' && dayPlan && (
        <DagplanView dayPlan={dayPlan} onReset={reset} />
      )}

      {/* Persistente balk onderaan met geselecteerde uitjes */}
      {phase === 'build' && basketIds.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-40">
          <div
            className="max-w-md mx-auto rounded-2xl p-3 shadow-xl"
            style={{ background: '#2C2316', boxShadow: '0 4px 20px rgba(44,35,22,0.35)' }}
          >
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {basketIds.map(id => {
                const u = uitjes.find(x => x.id === id)
                if (!u) return null
                return (
                  <button
                    key={id}
                    onClick={() => toggleBasket(id)}
                    className="text-xs rounded-full px-2.5 py-1 font-semibold flex items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
                  >
                    {u.name}
                    <span style={{ opacity: 0.6 }}>×</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={handlePlan}
              className="w-full rounded-xl py-2.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'oklch(57% 0.14 40)' }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Maak dagplan ({basketIds.length} stop{basketIds.length > 1 ? 's' : ''})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function WeatherCard({ weather }: { weather: WeatherData | null }) {
  const days = ['Vnd', 'Mor', 'Ovr']

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: 'linear-gradient(135deg, oklch(76% 0.18 83), oklch(66% 0.17 58))' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-4xl font-light leading-none mb-1" style={{ fontFamily: 'var(--font-journal)', color: 'white' }}>
            {weather ? `${Math.round(weather.current.temperature_2m)}°` : '—°'}
          </div>
          <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {weather ? wmoToDescription(weather.current.weathercode) : 'Laden…'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Les Escaliers</div>
        </div>
        <div className="text-right">
          <div className="text-4xl">{weather ? wmoToEmoji(weather.current.weathercode) : '🌤️'}</div>
        </div>
      </div>

      {/* 3-daagse voorspelling */}
      {weather && (
        <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {weather.daily.temperature_2m_max.slice(0, 3).map((max, i) => (
            <div
              key={i}
              className="flex-1 rounded-xl py-2 flex flex-col items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{days[i]}</p>
              <p className="text-lg">{wmoToEmoji(weather.daily.weathercode[i])}</p>
              <p className="text-xs font-bold" style={{ color: 'white' }}>{Math.round(max)}°</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(weather.daily.temperature_2m_min[i])}°</p>
              {weather.daily.precipitation_probability_max?.[i] > 20 && (
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  💧{weather.daily.precipitation_probability_max[i]}%
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Dagbouwer({
  selectedCats,
  onToggleCat,
  basketIds,
  onToggleBasket,
  vandaagMarkten,
}: {
  selectedCats: string[]
  onToggleCat: (v: string) => void
  basketIds: string[]
  onToggleBasket: (id: string) => void
  vandaagMarkten: typeof marktdagen
}) {
  return (
    <div>
      <h2
        className="text-2xl mb-1 leading-tight"
        style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}
      >
        Wat willen jullie<br />vandaag doen?
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">Kies één of meerdere categorieën, dan zie je de bijpassende uitjes.</p>

      {/* Categorie multi-select */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {CATEGORIES.map(cat => {
          const isSel = selectedCats.includes(cat.value)
          return (
            <button
              key={cat.value}
              onClick={() => onToggleCat(cat.value)}
              className="rounded-2xl p-3.5 flex items-center gap-2.5 text-left transition-all"
              style={{
                background: isSel ? cat.bg : '#FAF7F0',
                border: `2px solid ${isSel ? cat.color : '#E4D9C8'}`,
                boxShadow: isSel ? `0 2px 12px ${cat.color}30` : '0 1px 4px rgba(44,35,22,0.07)',
              }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: cat.color, fontVariationSettings: isSel ? "'FILL' 1" : "'FILL' 0" }}
              >
                {cat.icon}
              </span>
              <span className="text-sm font-semibold" style={{ color: isSel ? cat.color : '#2C2316' }}>
                {cat.label}
              </span>
              {isSel && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center ml-auto flex-shrink-0"
                  style={{ background: cat.color }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Per categorie: uitjes als horizontaal scrollende kaarten */}
      {selectedCats.map(catVal => {
        const cat = CATEGORIES.find(c => c.value === catVal)!
        let catUitjes = uitjes.filter(cat.uitjeFilter)

        // Markten als eerste bij eten/boodschappen
        const showMarkten = (catVal === 'food' || catVal === 'shop') && vandaagMarkten.length > 0

        return (
          <div key={catVal} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base" style={{ color: cat.color, fontVariationSettings: "'FILL' 1" }}>
                {cat.icon}
              </span>
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                {cat.label}
              </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {/* Markt-kaartje als eerste */}
              {showMarkten && vandaagMarkten.map((m, i) => (
                <div
                  key={`markt-${i}`}
                  className="flex-shrink-0 w-48 rounded-2xl p-3"
                  style={{ background: 'oklch(92% 0.07 83)', border: '2px solid oklch(79% 0.16 83)' }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm text-on-surface">🛒 {m.plaats}</p>
                    <span
                      className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}
                    >
                      Markt!
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">{m.omschrijving}</p>
                  <a
                    href={m.gmaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold"
                    style={{ color: 'oklch(57% 0.14 40)' }}
                  >
                    Maps →
                  </a>
                </div>
              ))}

              {/* Uitjeskaartjes */}
              {catUitjes.map(u => {
                const inBasket = basketIds.includes(u.id)
                return (
                  <div
                    key={u.id}
                    className="flex-shrink-0 w-48 rounded-2xl p-3 flex flex-col justify-between"
                    style={{
                      background: inBasket ? `${cat.color}12` : '#FAF7F0',
                      border: `2px solid ${inBasket ? cat.color : '#E4D9C8'}`,
                    }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="font-semibold text-sm text-on-surface leading-tight">{u.name}</p>
                        <span
                          className="text-[10px] rounded-full px-1.5 py-0.5 flex-shrink-0 font-medium"
                          style={{ background: '#F0E9DA', color: '#6B5A3E' }}
                        >
                          {u.drive}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-3 mb-2">{u.desc}</p>
                    </div>
                    <button
                      onClick={() => onToggleBasket(u.id)}
                      className="rounded-full py-1.5 text-xs font-bold w-full transition-all"
                      style={
                        inBasket
                          ? { background: cat.color, color: 'white' }
                          : { background: '#F0E9DA', color: cat.color }
                      }
                    >
                      {inBasket ? '✓ Geselecteerd' : '+ Voeg toe'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Als nog geen categorie gekozen: toon alle uitjes */}
      {selectedCats.length === 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#A8937A' }}>
            <span className="material-symbols-outlined text-sm" style={{ color: '#A8937A' }}>explore</span>
            Of kies direct een uitje
          </div>
          <div className="flex flex-col gap-3">
            {uitjes.slice(0, 5).map(u => (
              <MiniUitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={onToggleBasket} />
            ))}
            <a href="/uitjes" className="text-center text-sm font-semibold py-2" style={{ color: 'oklch(65% 0.10 218)' }}>
              Alle {uitjes.length} uitjes bekijken →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function DagplanView({ dayPlan, onReset }: { dayPlan: DayPlan; onReset: () => void }) {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h + (m || 0) / 60
  }

  return (
    <div>
      {/* Timeline */}
      <div className="relative mb-5">
        <div className="absolute left-[18px] top-0 bottom-0 w-0.5" style={{ background: '#E4D9C8' }} />
        {dayPlan.stops.map((stop, i) => {
          const stopTime = parseTime(stop.time)
          const isNow = i < dayPlan.stops.length - 1
            ? currentHour >= stopTime && currentHour < parseTime(dayPlan.stops[i + 1].time)
            : currentHour >= stopTime

          return (
            <div key={i} className="relative flex gap-4 mb-4">
              <div
                className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10"
                style={{ background: isNow ? 'oklch(79% 0.16 83)' : 'oklch(57% 0.14 40)' }}
              >
                {isNow ? '▶' : i + 1}
              </div>
              <div
                className="flex-1 rounded-2xl p-4 shadow-blue"
                style={{
                  background: '#FAF7F0',
                  border: `1px solid ${isNow ? 'oklch(79% 0.16 83)' : '#E4D9C8'}`,
                  boxShadow: isNow ? '0 2px 12px oklch(79% 0.16 83 / 0.2)' : undefined,
                }}
              >
                <span className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>{stop.time}</span>
                {isNow && <span className="ml-2 text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: 'oklch(92% 0.07 83)', color: 'oklch(57% 0.14 40)' }}>Nu</span>}
                <h3 className="font-semibold text-on-surface mt-0.5">{stop.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{stop.description}</p>
                {stop.tip && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(65% 0.10 218)' }}>
                    <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                    {stop.tip}
                  </p>
                )}
                {stop.mapsUrl && (
                  <a
                    href={stop.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: 'oklch(65% 0.10 218)' }}
                  >
                    <span className="material-symbols-outlined text-sm">map</span>
                    Navigeer
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-2xl border-2 py-3 text-sm font-semibold text-on-surface"
        style={{ borderColor: '#E4D9C8' }}
      >
        Nieuw plan maken
      </button>
    </div>
  )
}

function MiniUitjeCard({ uitje, inBasket, onToggle }: { uitje: Uitje; inBasket: boolean; onToggle: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    entertainment: 'oklch(79% 0.16 83)',
    culture:       'oklch(57% 0.14 40)',
    food:          'oklch(65% 0.09 298)',
    shop:          'oklch(65% 0.10 218)',
  }
  const typeIcons: Record<string, string> = {
    entertainment: 'attractions',
    culture: 'museum',
    food: 'restaurant',
    shop: 'shopping_cart',
  }
  const c = typeColors[uitje.type] || 'oklch(57% 0.14 40)'

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3 shadow-blue"
      style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${c}20` }}
      >
        <span className="material-symbols-outlined" style={{ color: c, fontVariationSettings: "'FILL' 1" }}>
          {typeIcons[uitje.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-on-surface truncate">{uitje.name}</p>
          <span
            className="text-xs rounded-full px-2 py-0.5 flex-shrink-0 font-medium"
            style={{ background: '#F0E9DA', color: '#6B5A3E' }}
          >
            {uitje.drive}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant truncate">{uitje.desc}</p>
      </div>
      <button
        onClick={() => onToggle(uitje.id)}
        className="rounded-full text-xs font-bold px-3 py-1.5 flex-shrink-0 transition-all"
        style={
          inBasket
            ? { background: 'oklch(57% 0.14 40)', color: 'white' }
            : { background: '#F0E9DA', color: '#6B5A3E' }
        }
      >
        {inBasket ? '✓' : '+'}
      </button>
    </div>
  )
}

async function getVisitedNames(): Promise<string[]> {
  try {
    const res = await fetch('/api/diary')
    if (!res.ok) return []
    const data: Array<{ plan_text?: string }> = await res.json()
    const names: string[] = []
    data.forEach(e => {
      if (!e.plan_text) return
      try {
        const plan = typeof e.plan_text === 'string' && e.plan_text.startsWith('{')
          ? JSON.parse(e.plan_text)
          : null
        if (plan?.stops) {
          plan.stops.forEach((s: { name: string }) => names.push(s.name))
        }
      } catch { /* ignore */ }
    })
    return names
  } catch {
    return []
  }
}
