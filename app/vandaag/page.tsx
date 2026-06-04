'use client'
import { useEffect, useState } from 'react'
import { WeatherData, wmoToDescription, wmoToEmoji, Suggestion, DayPlan } from '@/lib/types'
import { uitjes, Uitje } from '@/lib/uitjes'
import { getSupabase } from '@/lib/supabase'

const ACTIVITIES = [
  { label: 'Iets voor Lena', icon: 'child_care',    value: 'entertainment', color: 'oklch(79% 0.16 83)',  bg: 'oklch(92% 0.07 83)' },
  { label: 'Kasteel of dorp', icon: 'castle',        value: 'culture',       color: 'oklch(57% 0.14 40)',  bg: 'oklch(93% 0.05 40)' },
  { label: 'Water of bos',    icon: 'forest',        value: 'nature',        color: 'oklch(58% 0.10 148)', bg: 'oklch(92% 0.05 148)' },
  { label: 'Lekker eten',     icon: 'restaurant',    value: 'food',          color: 'oklch(65% 0.09 298)', bg: 'oklch(92% 0.05 298)' },
  { label: 'Boodschappen',    icon: 'shopping_cart', value: 'shop',          color: 'oklch(65% 0.10 218)', bg: 'oklch(92% 0.05 218)' },
  { label: 'Verras ons',      icon: 'auto_awesome',  value: 'surprise',      color: 'oklch(68% 0.11 10)',  bg: 'oklch(93% 0.05 10)' },
]

const DRIVE_TIMES = ['Max 30 min', 'Max 1 uur', 'Max 2 uur']

const CHECKLISTS: Record<string, string[]> = {
  entertainment: ['Zwemspullen', 'Zonnebrand', 'Handdoek', 'Telefoon opladen', "Lena's snacks"],
  nature: ['Wandelschoenen', 'Insectenspray', 'Zonnebrand', 'Telefoon opladen', "Lena's snacks"],
  culture: ['Comfortabele schoenen', 'Waterfles', 'Camera', 'Telefoon opladen', "Lena's snacks"],
  food: ['Portemonnee', 'Reserveringsnummer', 'Telefoon opladen', "Lena's snacks"],
  shop: ['Boodschappentas', 'Boodschappenlijst', 'Telefoon opladen', "Lena's snacks"],
  surprise: ['Telefoon opladen', "Lena's snacks", 'Zonnebrand'],
}

type Phase = 'wizard' | 'suggesting' | 'selectSuggestion' | 'planning' | 'plan'

export default function VandaagPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [phase, setPhase] = useState<Phase>('wizard')
  const [activity, setActivity] = useState<string | null>(null)
  const [driveTime, setDriveTime] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [basketIds, setBasketIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=44.521&longitude=1.150&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3'
    )
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {})

    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))
  }, [])

  const weatherDesc = weather
    ? `${wmoToEmoji(weather.current.weathercode)} ${Math.round(weather.current.temperature_2m)}°C — ${wmoToDescription(weather.current.weathercode)}`
    : 'Weerbericht laden…'

  const handleSuggest = async () => {
    if (!activity || !driveTime) return
    setError(null)
    setPhase('suggesting')
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'suggest', activity, driveTime, weather: weatherDesc }),
      })
      if (!res.ok) throw new Error(`Server: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuggestions(data.suggesties || [])
      setPhase('selectSuggestion')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.')
      setPhase('wizard')
    }
  }

  const handlePlan = async (ids: string[], activityOverride?: string, driveTimeOverride?: string) => {
    setError(null)
    setPhase('planning')
    const act = activityOverride ?? activity
    const dt = driveTimeOverride ?? driveTime
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'plan', activity: act, driveTime: dt, weather: weatherDesc, selectedIds: ids }),
      })
      if (!res.ok) throw new Error(`Server: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDayPlan(data)
      setPhase('plan')

      const today = new Date().toISOString().split('T')[0]
      await getSupabase().from('diary_entries').upsert(
        { date: today, plan_text: JSON.stringify(data) },
        { onConflict: 'date' }
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.')
      setPhase('selectSuggestion')
    }
  }

  const handleBasketPlan = async () => {
    if (basketIds.length === 0) return
    await handlePlan(basketIds, 'surprise', 'Max 2 uur')
  }

  const toggleBasket = (id: string) => {
    setBasketIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('dagplan_basket', JSON.stringify(next))
      return next
    })
  }

  const reset = () => {
    setPhase('wizard')
    setActivity(null)
    setDriveTime(null)
    setSuggestions([])
    setSelectedSuggestions([])
    setDayPlan(null)
    setError(null)
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Journal header */}
      <div className="mb-4">
        <div className="text-xl font-semibold" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>
          Notre Voyage
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{dateStr}</div>
      </div>

      {/* Weer */}
      <div
        className="rounded-2xl p-4 mb-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, oklch(76% 0.18 83), oklch(66% 0.17 58))' }}
      >
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
          {weather && (
            <div className="flex gap-3 mt-2">
              {weather.daily.temperature_2m_max.slice(0, 3).map((max, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {i === 0 ? 'Vnd' : i === 1 ? 'Mor' : 'Ovr'}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: 'white' }}>{Math.round(max)}°</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Basket banner */}
      {basketIds.length > 0 && phase === 'wizard' && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-3 border"
          style={{ background: 'oklch(92% 0.07 83)', borderColor: 'oklch(79% 0.16 83)' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'oklch(57% 0.14 40)' }}>shopping_bag</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">{basketIds.length} uitje{basketIds.length > 1 ? 's' : ''} geselecteerd</p>
            <p className="text-xs text-on-surface-variant">vanuit de uitjes-browser</p>
          </div>
          <button
            onClick={handleBasketPlan}
            className="rounded-full text-white text-xs font-bold px-3 py-1.5"
            style={{ background: 'oklch(57% 0.14 40)' }}
          >
            Maak plan
          </button>
        </div>
      )}

      {/* Wizard */}
      {phase === 'wizard' && (
        <div>
          <h2
            className="text-2xl mb-3 leading-tight"
            style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}
          >
            Wat willen jullie<br />vandaag doen?
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ACTIVITIES.map(a => {
              const isSel = activity === a.value
              return (
                <button
                  key={a.value}
                  onClick={() => setActivity(a.value)}
                  className="rounded-2xl p-4 flex flex-col items-start gap-2.5 text-left transition-all"
                  style={{
                    background: isSel ? a.bg : '#FAF7F0',
                    border: `2px solid ${isSel ? a.color : '#E4D9C8'}`,
                    boxShadow: isSel ? `0 2px 12px ${a.color}30` : '0 1px 4px rgba(44,35,22,0.07)',
                  }}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: a.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {a.icon}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: isSel ? a.color : '#2C2316' }}>
                    {a.label}
                  </span>
                  {isSel && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center self-end -mt-2"
                      style={{ background: a.color }}
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

          <div className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#A8937A' }}>
            Hoe ver mogen we rijden?
          </div>
          <div className="flex gap-2 mb-5">
            {DRIVE_TIMES.map(t => (
              <button
                key={t}
                onClick={() => setDriveTime(t)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all"
                style={{
                  background: driveTime === t ? 'oklch(57% 0.14 40)' : '#FAF7F0',
                  borderColor: driveTime === t ? 'oklch(57% 0.14 40)' : '#E4D9C8',
                  color: driveTime === t ? 'white' : '#6B5A3E',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleSuggest}
            disabled={!activity || !driveTime}
            className="w-full rounded-2xl py-4 text-white font-semibold text-base disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            style={{ background: 'oklch(57% 0.14 40)' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Maak ons dagplan
          </button>

          {/* Uitjes preview */}
          <div className="mt-8">
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#A8937A' }}>
              <span className="material-symbols-outlined text-sm" style={{ color: '#A8937A' }}>explore</span>
              Of kies zelf uit de uitjes
            </div>
            <div className="flex flex-col gap-3">
              {uitjes.slice(0, 4).map(u => (
                <UitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={toggleBasket} />
              ))}
              <a href="/uitjes" className="text-center text-sm font-semibold py-2" style={{ color: 'oklch(65% 0.10 218)' }}>
                Alle uitjes bekijken →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Suggesting loader */}
      {phase === 'suggesting' && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: 'oklch(57% 0.14 40)' }}>refresh</span>
          <p className="mt-4 font-semibold text-on-surface">Even nadenken…</p>
          <p className="text-sm text-on-surface-variant mt-1">Claude zoekt de beste uitjes voor jullie</p>
        </div>
      )}

      {/* Suggestion selection */}
      {phase === 'selectSuggestion' && (
        <div>
          <h2
            className="text-xl mb-1"
            style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
          >
            Kies wat jullie aanspreekt
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">Selecteer één of meerdere suggesties, dan maak ik het volledige plan.</p>
          <div className="flex flex-col gap-3 mb-5">
            {suggestions.map(s => (
              <button
                key={s.id}
                onClick={() =>
                  setSelectedSuggestions(prev =>
                    prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                  )
                }
                className="rounded-2xl border-2 p-4 text-left transition-all"
                style={{
                  background: selectedSuggestions.includes(s.id) ? 'oklch(93% 0.05 40)' : '#FAF7F0',
                  borderColor: selectedSuggestions.includes(s.id) ? 'oklch(57% 0.14 40)' : '#E4D9C8',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-on-surface">{s.naam}</p>
                  {selectedSuggestions.includes(s.id) && (
                    <span
                      className="material-symbols-outlined flex-shrink-0"
                      style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mt-1">{s.reden}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-2xl border-2 py-3 text-sm font-semibold text-on-surface"
              style={{ borderColor: '#E4D9C8' }}
            >
              ← Terug
            </button>
            <button
              onClick={() => handlePlan(selectedSuggestions)}
              disabled={selectedSuggestions.length === 0}
              className="flex-[2] rounded-2xl text-white font-semibold py-3 disabled:opacity-40"
              style={{ background: 'oklch(57% 0.14 40)' }}
            >
              Maak dagplan →
            </button>
          </div>
        </div>
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
        <div>
          {dayPlan.intro && (
            <p
              className="mb-4 text-base leading-relaxed"
              style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#6B5A3E' }}
            >
              {dayPlan.intro}
            </p>
          )}

          {/* Timeline */}
          <div className="relative mb-5">
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5" style={{ background: '#E4D9C8' }} />
            {dayPlan.stops.map((stop, i) => (
              <div key={i} className="relative flex gap-4 mb-4">
                <div
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10"
                  style={{ background: 'oklch(57% 0.14 40)' }}
                >
                  {i + 1}
                </div>
                <div
                  className="flex-1 rounded-2xl p-4 shadow-blue"
                  style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>{stop.time}</span>
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
            ))}
          </div>

          {/* Checklist */}
          {dayPlan.checklist && dayPlan.checklist.length > 0 && (
            <div
              className="rounded-2xl p-4 mb-4 border"
              style={{ background: 'oklch(92% 0.07 83)', borderColor: 'oklch(79% 0.16 83)' }}
            >
              <h3
                className="font-semibold mb-2 flex items-center gap-2"
                style={{ fontFamily: 'var(--font-hand)', fontSize: '17px', color: '#2C2316' }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: 'oklch(79% 0.16 83)' }}>checklist</span>
                Vergeet niet
              </h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...dayPlan.checklist, ...(CHECKLISTS[activity || 'surprise'] || [])])].map(item => (
                  <span
                    key={item}
                    className="rounded-full text-xs px-3 py-1 font-medium"
                    style={{ background: 'white', border: '1px solid #E4D9C8', color: '#6B5A3E' }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="w-full rounded-2xl border-2 py-3 text-sm font-semibold text-on-surface"
            style={{ borderColor: '#E4D9C8' }}
          >
            Nieuw plan maken
          </button>
        </div>
      )}
    </div>
  )
}

function UitjeCard({ uitje, inBasket, onToggle }: { uitje: Uitje; inBasket: boolean; onToggle: (id: string) => void }) {
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
