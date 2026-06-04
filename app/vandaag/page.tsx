'use client'
import { useEffect, useState, useCallback } from 'react'
import { WeatherData, wmoToDescription, wmoToEmoji, Suggestion, DayPlan } from '@/lib/types'
import { uitjes, Uitje } from '@/lib/uitjes'
import { getSupabase } from '@/lib/supabase'

const ACTIVITIES = [
  { label: 'Iets voor Lena', icon: 'child_care', value: 'entertainment' },
  { label: 'Kasteel of dorp', icon: 'castle', value: 'culture' },
  { label: 'Water of bos', icon: 'forest', value: 'nature' },
  { label: 'Lekker eten', icon: 'restaurant', value: 'food' },
  { label: 'Boodschappen', icon: 'shopping_cart', value: 'shop' },
  { label: 'Verras ons', icon: 'auto_awesome', value: 'surprise' },
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

  const handleSuggest = useCallback(async () => {
    if (!activity || !driveTime) return
    setPhase('suggesting')
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'suggest', activity, driveTime, weather: weatherDesc }),
      })
      const data = await res.json()
      setSuggestions(data.suggesties || [])
      setPhase('selectSuggestion')
    } catch {
      setPhase('wizard')
    }
  }, [activity, driveTime, weatherDesc])

  const handlePlan = useCallback(async (ids: string[]) => {
    setPhase('planning')
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 'plan', activity, driveTime, weather: weatherDesc, selectedIds: ids }),
      })
      const data = await res.json()
      setDayPlan(data)
      setPhase('plan')

      const today = new Date().toISOString().split('T')[0]
      await getSupabase().from('diary_entries').upsert(
        { date: today, plan_text: JSON.stringify(data) },
        { onConflict: 'date' }
      )
    } catch {
      setPhase('selectSuggestion')
    }
  }, [activity, driveTime, weatherDesc])

  const handleBasketPlan = useCallback(async () => {
    if (basketIds.length === 0) return
    setActivity('surprise')
    setDriveTime('Max 2 uur')
    await handlePlan(basketIds)
  }, [basketIds, handlePlan])

  const toggleBasket = (id: string) => {
    setBasketIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('dagplan_basket', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface">Vandaag</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Weer */}
      <div className="rounded-2xl bg-tertiary/10 border border-tertiary/20 p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{weather ? wmoToEmoji(weather.current.weathercode) : '🌤️'}</span>
          <div>
            <p className="font-bold text-on-surface text-lg">
              {weather ? `${Math.round(weather.current.temperature_2m)}°C` : '—'}
            </p>
            <p className="text-sm text-on-surface-variant">
              {weather ? wmoToDescription(weather.current.weathercode) : 'Laden…'}
            </p>
          </div>
          {weather && (
            <div className="ml-auto flex gap-2">
              {weather.daily.temperature_2m_max.slice(0, 3).map((max, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-on-surface-variant">
                    {i === 0 ? 'Vnd' : i === 1 ? 'Mor' : 'Ovr'}
                  </p>
                  <p className="text-xs font-semibold">{Math.round(max)}°</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Basket banner */}
      {basketIds.length > 0 && phase === 'wizard' && (
        <div className="rounded-2xl bg-secondary/20 border border-secondary/40 p-3 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface">shopping_bag</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{basketIds.length} uitje{basketIds.length > 1 ? 's' : ''} geselecteerd</p>
            <p className="text-xs text-on-surface-variant">vanuit de uitjes-browser</p>
          </div>
          <button
            onClick={handleBasketPlan}
            className="rounded-full bg-primary text-white text-xs font-bold px-3 py-1.5"
          >
            Maak plan
          </button>
        </div>
      )}

      {/* Wizard */}
      {phase === 'wizard' && (
        <div>
          <h2 className="font-bold text-on-surface mb-3">Wat willen jullie vandaag?</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ACTIVITIES.map(a => (
              <button
                key={a.value}
                onClick={() => setActivity(a.value)}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                  activity === a.value
                    ? 'border-primary bg-primary/10'
                    : 'border-outline-variant bg-surface'
                }`}
              >
                {activity === a.value && (
                  <span className="material-symbols-outlined text-primary text-sm self-end -mb-5 -mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
                <span
                  className={`material-symbols-outlined text-4xl ${activity === a.value ? 'text-primary' : 'text-on-surface-variant'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {a.icon}
                </span>
                <span className={`text-sm font-semibold text-center ${activity === a.value ? 'text-primary' : 'text-on-surface'}`}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>

          <h2 className="font-bold text-on-surface mb-3">Hoelang rijden?</h2>
          <div className="flex gap-2 mb-6">
            {DRIVE_TIMES.map(t => (
              <button
                key={t}
                onClick={() => setDriveTime(t)}
                className={`flex-1 rounded-full py-2 text-sm font-bold border-2 transition-all ${
                  driveTime === t
                    ? 'bg-primary border-primary text-white'
                    : 'bg-surface border-outline-variant text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleSuggest}
            disabled={!activity || !driveTime}
            className="w-full rounded-full bg-primary text-white font-bold py-4 text-base disabled:opacity-40 transition-opacity"
          >
            Maak dagplan →
          </button>
        </div>
      )}

      {/* Suggesting loader */}
      {phase === 'suggesting' && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          <p className="mt-4 text-on-surface-variant font-medium">Even nadenken…</p>
        </div>
      )}

      {/* Suggestion selection */}
      {phase === 'selectSuggestion' && (
        <div>
          <h2 className="font-bold text-on-surface mb-1">Kies een suggestie</h2>
          <p className="text-sm text-on-surface-variant mb-4">Selecteer wat jullie aantrekt, dan maak ik het volledige plan.</p>
          <div className="flex flex-col gap-3 mb-6">
            {suggestions.map(s => (
              <button
                key={s.id}
                onClick={() =>
                  setSelectedSuggestions(prev =>
                    prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                  )
                }
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  selectedSuggestions.includes(s.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-outline-variant bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-on-surface">{s.naam}</p>
                  {selectedSuggestions.includes(s.id) && (
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mt-1">{s.reden}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('wizard')}
              className="flex-1 rounded-full border-2 border-outline-variant py-3 text-sm font-bold text-on-surface"
            >
              ← Terug
            </button>
            <button
              onClick={() => handlePlan(selectedSuggestions)}
              disabled={selectedSuggestions.length === 0}
              className="flex-[2] rounded-full bg-primary text-white font-bold py-3 disabled:opacity-40"
            >
              Maak dagplan →
            </button>
          </div>
        </div>
      )}

      {/* Planning loader */}
      {phase === 'planning' && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          <p className="mt-4 text-on-surface-variant font-medium">Dagplan samenstellen…</p>
        </div>
      )}

      {/* Day plan */}
      {phase === 'plan' && dayPlan && (
        <div>
          {dayPlan.intro && (
            <p className="text-on-surface-variant mb-4 italic">{dayPlan.intro}</p>
          )}

          {/* Timeline */}
          <div className="relative mb-6">
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-outline-variant" />
            {dayPlan.stops.map((stop, i) => (
              <div key={i} className="relative flex gap-4 mb-5">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10">
                  {i + 1}
                </div>
                <div className="flex-1 rounded-2xl bg-surface border border-outline-variant p-4 shadow-blue">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary">{stop.time}</span>
                  </div>
                  <h3 className="font-bold text-on-surface">{stop.name}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{stop.description}</p>
                  {stop.tip && (
                    <p className="text-xs text-tertiary mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                      {stop.tip}
                    </p>
                  )}
                  {stop.mapsUrl && (
                    <a
                      href={stop.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-tertiary"
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
            <div className="rounded-2xl bg-secondary/20 border border-secondary/40 p-4 mb-4">
              <h3 className="font-bold text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">checklist</span>
                Vergeet niet
              </h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...dayPlan.checklist, ...( CHECKLISTS[activity || 'surprise'] || [])])].map(item => (
                  <span key={item} className="rounded-full bg-white border border-outline-variant text-xs px-3 py-1 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setPhase('wizard')
              setActivity(null)
              setDriveTime(null)
              setSuggestions([])
              setSelectedSuggestions([])
              setDayPlan(null)
            }}
            className="w-full rounded-full border-2 border-outline-variant py-3 text-sm font-bold text-on-surface"
          >
            Nieuw plan maken
          </button>
        </div>
      )}

      {/* Uitjes basket section at bottom */}
      {phase === 'wizard' && (
        <div className="mt-8">
          <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-on-surface-variant">explore</span>
            Of kies zelf uit de uitjes
          </h2>
          <div className="flex flex-col gap-3">
            {uitjes.slice(0, 4).map(u => (
              <UitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={toggleBasket} />
            ))}
            <a href="/uitjes" className="text-center text-sm text-tertiary font-semibold py-2">
              Alle uitjes bekijken →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function UitjeCard({ uitje, inBasket, onToggle }: { uitje: Uitje; inBasket: boolean; onToggle: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    entertainment: 'text-primary',
    culture: 'text-tertiary',
    food: 'text-secondary',
    shop: 'text-green-600',
  }
  const typeIcons: Record<string, string> = {
    entertainment: 'attractions',
    culture: 'museum',
    food: 'restaurant',
    shop: 'shopping_cart',
  }

  return (
    <div className="rounded-2xl bg-surface border border-outline-variant p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full bg-surface flex items-center justify-center ${typeColors[uitje.type]}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {typeIcons[uitje.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-on-surface truncate">{uitje.name}</p>
          <span className="text-xs text-on-surface-variant bg-outline-variant/50 rounded-full px-2 py-0.5 flex-shrink-0">{uitje.drive}</span>
        </div>
        <p className="text-xs text-on-surface-variant truncate">{uitje.desc}</p>
      </div>
      <button
        onClick={() => onToggle(uitje.id)}
        className={`rounded-full text-xs font-bold px-3 py-1.5 flex-shrink-0 transition-all ${
          inBasket ? 'bg-primary text-white' : 'bg-outline-variant/50 text-on-surface'
        }`}
      >
        {inBasket ? '✓' : '+'}
      </button>
    </div>
  )
}
