'use client'
import { useEffect, useState } from 'react'
import { WeatherData, wmoToDescription, wmoToEmoji, DayPlan } from '@/lib/types'
import { uitjes, Uitje } from '@/lib/uitjes'
import { marktdagen } from '@/lib/marktdagen'
import { reiskalender, Reisdag, KalenderEntry } from '@/lib/reiskalender'
import { getSupabase } from '@/lib/supabase'

const HOME_COORDS: [number, number] = [44.521, 1.150]

const CATEGORIES = [
  { label: 'Iets voor Lena', icon: 'child_care',    value: 'lena',     color: 'oklch(79% 0.16 83)',  bg: 'oklch(92% 0.07 83)',  uitjeFilter: (u: Uitje) => ['u1','u2','u6','u13','u14','u19'].includes(u.id) },
  { label: 'Kasteel of dorp', icon: 'castle',        value: 'culture',  color: 'oklch(57% 0.14 40)',  bg: 'oklch(93% 0.05 40)',  uitjeFilter: (u: Uitje) => u.type === 'culture' },
  { label: 'Water of bos',    icon: 'forest',        value: 'nature',   color: 'oklch(58% 0.10 148)', bg: 'oklch(92% 0.05 148)', uitjeFilter: (u: Uitje) => u.type === 'entertainment' && !u.marktDag },
  { label: 'Lekker eten',     icon: 'restaurant',   value: 'food',     color: 'oklch(65% 0.09 298)', bg: 'oklch(92% 0.05 298)', uitjeFilter: (u: Uitje) => u.type === 'food' },
  { label: 'Boodschappen',    icon: 'shopping_cart', value: 'shop',     color: 'oklch(65% 0.10 218)', bg: 'oklch(92% 0.05 218)', uitjeFilter: (u: Uitje) => u.type === 'shop' },
  { label: 'Verras ons',      icon: 'auto_awesome',  value: 'surprise', color: 'oklch(68% 0.11 10)',  bg: 'oklch(93% 0.05 10)',  uitjeFilter: (u: Uitje) => !u.marktDag },
]

const MOODS = [
  { emoji: '😴', label: 'Moe' },
  { emoji: '🙂', label: 'Goed' },
  { emoji: '😄', label: 'Geweldig' },
  { emoji: '🥰', label: 'Zalig' },
  { emoji: '🤩', label: 'Episch' },
]

type Phase = 'build' | 'select' | 'confirm' | 'planning' | 'edit' | 'plan'

interface UserLocation { lat: number; lon: number }
interface Tussenstop { naam: string; beschrijving: string; gmaps: string }

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0]
}

function getTomorrowDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getTodayMarkten() {
  const today = new Date().getDay()
  const dagNamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const todayNaam = dagNamen[today]
  return marktdagen.filter(m => m.dag === todayNaam)
}

function isTodayMarkt(uitje: Uitje): boolean {
  if (!uitje.marktDag) return false
  const today = new Date().getDay()
  const dagNamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const todayNaam = dagNamen[today]
  return uitje.marktDag.split(',').map(d => d.trim()).includes(todayNaam)
}

function isAfter17Paris(): boolean {
  const now = new Date()
  const parisHour = parseInt(now.toLocaleString('en-US', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false }))
  return parisHour >= 17
}

function getRainWarning(weather: WeatherData | null): string | null {
  if (!weather?.daily?.precipitation_probability_max) return null
  const tomorrowProb = weather.daily.precipitation_probability_max[1]
  if (tomorrowProb > 60) {
    return `Morgen wordt het nat (${tomorrowProb}% kans op regen) — misschien een goed moment voor Pech-Merle of het Musée de l'Insolite?`
  }
  return null
}

function buildGoogleMapsUrl(ids: string[]): string {
  const base = `${HOME_COORDS[0]},${HOME_COORDS[1]}`
  const stops = ids
    .map(id => uitjes.find(u => u.id === id))
    .filter(Boolean)
    .map(u => `${u!.coords[0]},${u!.coords[1]}`)
  if (stops.length === 0) return `https://www.google.com/maps/search/?api=1&query=Les+Escaliers+Porte-du-Quercy`
  return `https://www.google.com/maps/dir/${base}/${stops.join('/')}/${base}`
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
          ? JSON.parse(e.plan_text) : null
        if (plan?.stops) plan.stops.forEach((s: { name: string }) => names.push(s.name))
      } catch { /* ignore */ }
    })
    return names
  } catch { return [] }
}

export default function VandaagPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [phase, setPhase] = useState<Phase>('build')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [basketIds, setBasketIds] = useState<string[]>([])
  const [activeCatTab, setActiveCatTab] = useState<string>('')
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [editPlan, setEditPlan] = useState<DayPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTomorrowWizard, setShowTomorrowWizard] = useState(false)
  const [tomorrowBasketIds, setTomorrowBasketIds] = useState<string[]>([])
  const [tomorrowPlan, setTomorrowPlan] = useState<DayPlan | null>(null)
  const [tomorrowPlanning, setTomorrowPlanning] = useState(false)

  // Location
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  // Sluit dag af
  const [showSluitAf, setShowSluitAf] = useState(false)
  const [followedPlan, setFollowedPlan] = useState<boolean | null>(null)
  const [sluitActualText, setSluitActualText] = useState('')
  const [sluitMoodEmoji, setSluitMoodEmoji] = useState<string | null>(null)
  const [sluitSaving, setSluitSaving] = useState(false)
  const [sluitDone, setSluitDone] = useState(false)

  const today = getTodayDateStr()
  const tomorrow = getTomorrowDateStr()
  const todayEntry = reiskalender[today] ?? null
  const tomorrowEntry = reiskalender[tomorrow] ?? null
  const isReisdag = todayEntry?.type === 'reisdag'
  const vandaagMarkten = getTodayMarkten()
  const after17 = isAfter17Paris()

  const showVertreklijst = new Date() < new Date('2025-06-13')

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.521&longitude=1.150&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3')
      .then(r => r.json()).then(setWeather).catch(() => {})

    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))

    fetch('/api/diary')
      .then(r => r.json())
      .then((data: Array<{ date: string; plan_text?: string; actual_text?: string; mood_emoji?: string }>) => {
        const todayEntry = data.find(e => e.date === today)
        if (todayEntry?.plan_text) {
          try {
            const plan = typeof todayEntry.plan_text === 'string' && todayEntry.plan_text.startsWith('{')
              ? JSON.parse(todayEntry.plan_text) : null
            if (plan?.stops) { setDayPlan(plan); setPhase('plan') }
          } catch { /* geen plan */ }
        }
        // Restore "Sluit dag af" state if already filled in
        if (todayEntry?.actual_text || todayEntry?.mood_emoji) {
          setSluitDone(true)
        }

        const tomorrowEntry = data.find(e => e.date === tomorrow)
        if (tomorrowEntry?.plan_text) {
          try {
            const plan = typeof tomorrowEntry.plan_text === 'string' && tomorrowEntry.plan_text.startsWith('{')
              ? JSON.parse(tomorrowEntry.plan_text) : null
            if (plan?.stops) setTomorrowPlan(plan)
          } catch { /* geen plan */ }
        }
      }).catch(() => {})

    // Request geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => { /* permission denied or error */ },
        { enableHighAccuracy: false, timeout: 10000 }
      )
    }
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

  const toggleTomorrowBasket = (id: string) => {
    setTomorrowBasketIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const goToSelect = () => {
    setActiveCatTab(selectedCats[0] || '')
    setPhase('select')
  }

  const handlePlan = async (forDate: string, ids: string[]) => {
    setError(null)
    if (forDate === today) setPhase('planning')
    else setTomorrowPlanning(true)

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
          selectedIds: ids,
          visitedNames,
        }),
      })
      if (!res.ok) throw new Error(`Server: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (forDate === today) {
        // Go to edit phase — don't save yet, let user confirm
        setEditPlan(data)
        setPhase('edit')
      } else {
        // For tomorrow: save directly
        await getSupabase().from('diary_entries').upsert(
          { date: forDate, plan_text: JSON.stringify(data) },
          { onConflict: 'date' }
        )
        setTomorrowPlan(data)
        setTomorrowPlanning(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.')
      if (forDate === today) setPhase('confirm')
      else setTomorrowPlanning(false)
    }
  }

  const handleConfirmPlan = async (plan: DayPlan) => {
    try {
      await getSupabase().from('diary_entries').upsert(
        { date: today, plan_text: JSON.stringify(plan) },
        { onConflict: 'date' }
      )
      setDayPlan(plan)
      setEditPlan(null)
      setPhase('plan')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt.')
    }
  }

  const handleSluitAf = async () => {
    setSluitSaving(true)
    const actualText = followedPlan === false ? sluitActualText : 'We hebben het plan gevolgd.'
    try {
      await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          actual_text: actualText,
          mood_emoji: sluitMoodEmoji,
        }),
      })
      setSluitDone(true)
      setShowSluitAf(false)
    } catch { /* ignore */ }
    setSluitSaving(false)
  }

  const reset = () => {
    setPhase('build')
    setSelectedCats([])
    setBasketIds([])
    setDayPlan(null)
    setEditPlan(null)
    setError(null)
    setShowSluitAf(false)
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

      <WeatherCard weather={weather} />

      {/* Vertreklijst banner — vóór 13 juni */}
      {showVertreklijst && (
        <a
          href="/vertreklijst"
          className="flex items-center gap-3 rounded-2xl p-4 mb-4 shadow-blue"
          style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)', textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(40% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>
            checklist
          </span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'oklch(30% 0.10 148)' }}>Vertreklijst nog niet compleet?</p>
            <p className="text-xs" style={{ color: 'oklch(40% 0.10 148)' }}>Check alles vóór de heenreis op 12 juni →</p>
          </div>
          <span className="material-symbols-outlined text-base" style={{ color: 'oklch(40% 0.10 148)' }}>chevron_right</span>
        </a>
      )}

      {/* Regenmelding */}
      {rainWarning && phase === 'build' && (
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.3)' }}>
          <span className="material-symbols-outlined text-base mt-0.5" style={{ color: 'oklch(65% 0.10 218)' }}>water_drop</span>
          <p className="text-sm" style={{ color: '#2C2316' }}>{rainWarning}</p>
        </div>
      )}

      {/* Marktdag banner */}
      {vandaagMarkten.length > 0 && (phase === 'build' || phase === 'select') && (
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.4)' }}>
          <span className="text-xl">🛒</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Marktdag vandaag!</p>
            {vandaagMarkten.map((m, i) => (
              <p key={i} className="text-xs" style={{ color: '#6B5A3E' }}>{m.plaats} — {m.omschrijving}</p>
            ))}
          </div>
        </div>
      )}

      {/* Reisdag modus */}
      {todayEntry?.type === 'reisdag' && (
        <ReisDagView entry={todayEntry} userLocation={userLocation} />
      )}

      {/* Verblijf Chartres */}
      {todayEntry?.type === 'verblijf' && (
        <div className="rounded-2xl p-3 mb-4" style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>
            📍 {todayEntry.verblijf} — {todayEntry.label}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
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

      {/* Wizard — niet op reisdagen */}
      {!isReisdag && (
        <>
          {phase === 'build' && (
            <CategoryBuildPhase
              selectedCats={selectedCats}
              onToggleCat={toggleCat}
              onNext={goToSelect}
              basketIds={basketIds}
            />
          )}

          {phase === 'select' && (
            <SelectPhase
              selectedCats={selectedCats}
              activeCatTab={activeCatTab}
              setActiveCatTab={setActiveCatTab}
              basketIds={basketIds}
              onToggleBasket={toggleBasket}
              onBack={() => setPhase('build')}
              onConfirm={() => setPhase('confirm')}
            />
          )}

          {phase === 'confirm' && (
            <ConfirmPhase
              basketIds={basketIds}
              onConfirm={() => handlePlan(today, basketIds)}
              onBack={() => setPhase('select')}
              onReset={reset}
            />
          )}

          {phase === 'planning' && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl animate-spin" style={{ color: 'oklch(57% 0.14 40)' }}>refresh</span>
              <p className="mt-4 font-semibold text-on-surface">Dagplan samenstellen…</p>
              <p className="text-sm text-on-surface-variant mt-1">Even geduld, dit duurt 10–20 seconden</p>
            </div>
          )}

          {phase === 'edit' && editPlan && (
            <EditPlanView
              plan={editPlan}
              onChange={setEditPlan}
              basketIds={basketIds}
              onConfirm={() => handleConfirmPlan(editPlan)}
              onAddStop={() => setPhase('select')}
              onReset={reset}
            />
          )}

          {phase === 'plan' && dayPlan && (
            <>
              <DagplanView
                dayPlan={dayPlan}
                basketIds={basketIds}
                onAanpassen={() => { setEditPlan(dayPlan); setPhase('edit') }}
                onReset={reset}
                onSluitAf={() => setShowSluitAf(true)}
                sluitDone={sluitDone}
              />
              {showSluitAf && (
                <SluitDagAfModal
                  followedPlan={followedPlan}
                  setFollowedPlan={setFollowedPlan}
                  actualText={sluitActualText}
                  setActualText={setSluitActualText}
                  moodEmoji={sluitMoodEmoji}
                  setMoodEmoji={setSluitMoodEmoji}
                  saving={sluitSaving}
                  onSave={handleSluitAf}
                  onClose={() => setShowSluitAf(false)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Plan morgen — na 17:00, toon onderaan */}
      {after17 && !isReisdag && (phase === 'plan' || phase === 'build') && (
        <PlanMorgenSection
          tomorrowEntry={tomorrowEntry}
          tomorrowPlan={tomorrowPlan}
          basketIds={tomorrowBasketIds}
          onToggleBasket={toggleTomorrowBasket}
          planning={tomorrowPlanning}
          onPlan={() => handlePlan(tomorrow, tomorrowBasketIds)}
          showWizard={showTomorrowWizard}
          onToggleWizard={() => setShowTomorrowWizard(v => !v)}
        />
      )}
    </div>
  )
}

function WeatherCard({ weather }: { weather: WeatherData | null }) {
  const days = ['Vnd', 'Mor', 'Ovr']
  return (
    <div className="rounded-2xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, oklch(76% 0.18 83), oklch(66% 0.17 58))' }}>
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
        <div className="text-4xl">{weather ? wmoToEmoji(weather.current.weathercode) : '🌤️'}</div>
      </div>
      {weather && (
        <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          {weather.daily.temperature_2m_max.slice(0, 3).map((max, i) => (
            <div key={i} className="flex-1 rounded-xl py-2 flex flex-col items-center gap-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{days[i]}</p>
              <p className="text-lg">{wmoToEmoji(weather.daily.weathercode[i])}</p>
              <p className="text-xs font-bold" style={{ color: 'white' }}>{Math.round(max)}°</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(weather.daily.temperature_2m_min[i])}°</p>
              {weather.daily.precipitation_probability_max?.[i] > 20 && (
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>💧{weather.daily.precipitation_probability_max[i]}%</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReisDagView({ entry, userLocation }: { entry: Reisdag; userLocation: UserLocation | null }) {
  const [tussenstop, setTussenstop] = useState<Tussenstop | null>(null)
  const [tussenstopLoading, setTussenstopLoading] = useState(false)

  const accommodations: Record<string, { naam: string; adres: string; gmaps: string }> = {
    'Atelier des Sens 89': {
      naam: 'Atelier des Sens 89',
      adres: 'Route du Moulin Neuf, 89270 Venoy',
      gmaps: 'https://www.google.com/maps/search/?api=1&query=Atelier+des+Sens+89+Venoy',
    },
    'Les Escaliers': {
      naam: 'Les Escaliers de La Combe',
      adres: 'La Combe, 82240 Porte-du-Quercy',
      gmaps: 'https://www.google.com/maps/search/?api=1&query=Les+Escaliers+Porte-du-Quercy',
    },
    'Chartres': {
      naam: 'Hotel Henri IV',
      adres: "31 Rue du Soleil d'Or, 28000 Chartres",
      gmaps: 'https://www.google.com/maps/search/?api=1&query=Hotel+Henri+IV+Chartres',
    },
    'Amersfoort': {
      naam: 'Thuis in Amersfoort',
      adres: 'Amersfoort',
      gmaps: 'https://www.google.com/maps/search/?api=1&query=Amersfoort',
    },
  }
  const overnachting = accommodations[entry.naar]

  const routeCoords: Record<string, string> = {
    'Amersfoort': '52.155,5.387',
    'Atelier des Sens 89': '47.861,3.562',
    'Les Escaliers': '44.521,1.150',
    'Chartres': '48.447,1.489',
  }
  const fromCoord = routeCoords[entry.van] || ''
  const toCoord = routeCoords[entry.naar] || ''
  const routeUrl = fromCoord && toCoord
    ? `https://www.google.com/maps/dir/${fromCoord}/${toCoord}`
    : ''

  const tussenstops = entry.route.replace('Via ', '').split(', ')

  const zoekTussenstop = async () => {
    if (!userLocation) return
    setTussenstopLoading(true)
    setTussenstop(null)
    try {
      const res = await fetch('/api/tussenstop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          van: entry.van,
          naar: entry.naar,
          route: entry.route,
          lat: userLocation.lat,
          lon: userLocation.lon,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTussenstop(data)
      }
    } catch { /* ignore */ }
    setTussenstopLoading(false)
  }

  return (
    <div className="mb-5">
      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: 'linear-gradient(135deg, #2C2316, oklch(40% 0.12 40))', color: 'white' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {entry.label}
          </p>
        </div>
        <h2 className="text-2xl font-medium leading-tight mb-1" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic' }}>
          Reisdag
        </h2>
        <p className="text-lg font-semibold">{entry.van} → {entry.naar}</p>
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            Open route in Google Maps
          </a>
        )}
      </div>

      {/* Huidige locatie */}
      {userLocation && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-3"
          style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>my_location</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'oklch(35% 0.08 148)' }}>Huidige locatie</p>
            <p className="text-xs" style={{ color: 'oklch(45% 0.08 148)' }}>
              {userLocation.lat.toFixed(4)}°N, {userLocation.lon.toFixed(4)}°E
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${userLocation.lat},${userLocation.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold"
            style={{ color: 'oklch(58% 0.10 148)' }}
          >
            Maps →
          </a>
        </div>
      )}

      {/* Tussenstop zoeken */}
      {userLocation && (
        <div className="mb-5">
          <button
            onClick={zoekTussenstop}
            disabled={tussenstopLoading}
            className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mb-3"
            style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '2px solid #E4D9C8' }}
          >
            {tussenstopLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                Tussenstop zoeken…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>place</span>
                Tussenstop zoeken
              </>
            )}
          </button>
          {tussenstop && (
            <div
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid oklch(79% 0.16 83 / 0.4)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold rounded-full px-2 py-0.5" style={{ background: 'oklch(92% 0.07 83)', color: 'oklch(57% 0.14 40)' }}>
                  Suggestie
                </span>
              </div>
              <p className="font-semibold text-on-surface">{tussenstop.naam}</p>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{tussenstop.beschrijving}</p>
              <a
                href={tussenstop.gmaps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'oklch(65% 0.10 218)' }}
              >
                <span className="material-symbols-outlined text-sm">map</span>
                Navigeer →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tussenstops */}
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Route van vandaag
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {[entry.van, ...tussenstops, entry.naar].map((stop, i, arr) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: i === 0 || i === arr.length - 1 ? 'oklch(57% 0.14 40)' : '#A8937A' }}
            >
              {i === 0 ? '🏠' : i === arr.length - 1 ? '🏁' : i}
            </div>
            <div
              className="flex-1 rounded-xl px-3 py-2"
              style={{
                background: i === 0 || i === arr.length - 1 ? 'oklch(93% 0.05 40)' : '#FAF7F0',
                border: '1px solid #E4D9C8',
              }}
            >
              <p className="text-sm font-semibold text-on-surface">{stop}</p>
              {i > 0 && i < arr.length - 1 && (
                <p className="text-xs text-on-surface-variant">Tussenstop</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Overnachting */}
      {overnachting && (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
            {entry.naar === 'Amersfoort' ? 'Bestemming' : 'Overnachting'}
          </div>
          <div
            className="rounded-2xl p-4 shadow-blue"
            style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>
                {entry.naar === 'Amersfoort' ? 'home' : 'hotel'}
              </span>
              <div>
                <h3 className="font-semibold text-on-surface">{overnachting.naam}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{overnachting.adres}</p>
                <a
                  href={overnachting.gmaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold mt-2 block"
                  style={{ color: 'oklch(65% 0.10 218)' }}
                >
                  Google Maps →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CategoryBuildPhase({
  selectedCats,
  onToggleCat,
  onNext,
  basketIds,
}: {
  selectedCats: string[]
  onToggleCat: (v: string) => void
  onNext: () => void
  basketIds: string[]
}) {
  return (
    <div>
      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
        Wat willen jullie<br />vandaag doen?
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">Kies één of meerdere categorieën.</p>

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
              <span className="material-symbols-outlined text-2xl" style={{ color: cat.color, fontVariationSettings: isSel ? "'FILL' 1" : "'FILL' 0" }}>
                {cat.icon}
              </span>
              <span className="text-sm font-semibold" style={{ color: isSel ? cat.color : '#2C2316' }}>
                {cat.label}
              </span>
              {isSel && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center ml-auto flex-shrink-0" style={{ background: cat.color }}>
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedCats.length > 0 && (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-white font-semibold text-base flex items-center justify-center gap-2"
          style={{ background: 'oklch(57% 0.14 40)' }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          Bekijk uitjes →
        </button>
      )}

      {selectedCats.length === 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Of kies direct een uitje</p>
          <div className="flex flex-col gap-3">
            {uitjes.filter(u => !u.marktDag).slice(0, 5).map(u => (
              <MiniUitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={() => {}} />
            ))}
            <a href="/uitjes" className="text-center text-sm font-semibold py-2" style={{ color: 'oklch(65% 0.10 218)' }}>
              Alle uitjes bekijken →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function SelectPhase({
  selectedCats,
  activeCatTab,
  setActiveCatTab,
  basketIds,
  onToggleBasket,
  onBack,
  onConfirm,
}: {
  selectedCats: string[]
  activeCatTab: string
  setActiveCatTab: (v: string) => void
  basketIds: string[]
  onToggleBasket: (id: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const activeCat = CATEGORIES.find(c => c.value === activeCatTab) || CATEGORIES.find(c => c.value === selectedCats[0])!
  const catUitjes = uitjes.filter(activeCat.uitjeFilter)

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-semibold mb-4"
        style={{ color: 'oklch(57% 0.14 40)' }}
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Categorieën
      </button>

      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
        Kies uitjes
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">
        {basketIds.length === 0 ? 'Selecteer wat je vandaag wilt doen.' : `${basketIds.length} uitje${basketIds.length > 1 ? 's' : ''} geselecteerd.`}
      </p>

      {/* Categorie tabs */}
      {selectedCats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
          {selectedCats.map(val => {
            const cat = CATEGORIES.find(c => c.value === val)!
            const hasSelection = uitjes.filter(cat.uitjeFilter).some(u => basketIds.includes(u.id))
            const isActive = activeCatTab === val || (!activeCatTab && val === selectedCats[0])
            return (
              <button
                key={val}
                onClick={() => setActiveCatTab(val)}
                className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all"
                style={{
                  background: isActive ? cat.color : '#FAF7F0',
                  color: isActive ? 'white' : '#6B5A3E',
                  border: `2px solid ${isActive ? cat.color : '#E4D9C8'}`,
                }}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                {cat.label}
                {hasSelection && (
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: isActive ? 'rgba(255,255,255,0.3)' : cat.color, color: 'white' }}
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Uitje kaarten */}
      <div className="flex flex-col gap-4 mb-24">
        {catUitjes.map(u => {
          const inBasket = basketIds.includes(u.id)
          const isMarktVandaag = isTodayMarkt(u)
          return (
            <div
              key={u.id}
              className="rounded-2xl p-5 shadow-blue"
              style={{
                background: inBasket ? `${activeCat.color}0D` : '#FAF7F0',
                border: `2px solid ${inBasket ? activeCat.color : '#E4D9C8'}`,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-on-surface leading-tight">{u.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>
                      🚗 {u.drive}
                    </span>
                    {u.vegetarian && (
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'oklch(92% 0.05 148)', color: 'oklch(40% 0.10 148)' }}>
                        🌿 Vegetarisch
                      </span>
                    )}
                    {isMarktVandaag && (
                      <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}>
                        🛒 Markt vandaag!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{u.desc}</p>

              {(u.wiki || u.site || u.gmaps) && (
                <div className="flex gap-3 mb-4 flex-wrap">
                  {u.wiki && (
                    <a href={u.wiki} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>
                      Wikipedia →
                    </a>
                  )}
                  {u.site && (
                    <a href={u.site} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>
                      Website →
                    </a>
                  )}
                  <a href={u.gmaps} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                    Maps →
                  </a>
                </div>
              )}

              <button
                onClick={() => onToggleBasket(u.id)}
                className="w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={
                  inBasket
                    ? { background: activeCat.color, color: 'white' }
                    : { background: '#F0E9DA', color: activeCat.color }
                }
              >
                {inBasket ? (
                  <>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Geselecteerd
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Selecteer
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Fixed bottom — naar overzicht */}
      {basketIds.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 z-40">
          <div className="max-w-md mx-auto">
            <button
              onClick={onConfirm}
              className="w-full rounded-2xl py-4 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-xl"
              style={{ background: '#2C2316', boxShadow: '0 4px 20px rgba(44,35,22,0.35)' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              Naar overzicht ({basketIds.length} stop{basketIds.length > 1 ? 's' : ''}) →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmPhase({
  basketIds,
  onConfirm,
  onBack,
  onReset,
}: {
  basketIds: string[]
  onConfirm: () => void
  onBack: () => void
  onReset: () => void
}) {
  const selectedUitjes = basketIds.map(id => uitjes.find(u => u.id === id)).filter(Boolean) as Uitje[]
  const mapsUrl = buildGoogleMapsUrl(basketIds)

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: 'oklch(57% 0.14 40)' }}>
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Aanpassen
      </button>

      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
        Jouw dag
      </h2>
      <p className="text-xs text-on-surface-variant mb-5">
        Dit zijn de gekozen stops. Bevestig om een dagplan te genereren.
      </p>

      <div className="flex flex-col gap-3 mb-5">
        {selectedUitjes.map((u, i) => {
          const isMarktVandaag = isTodayMarkt(u)
          return (
            <div
              key={u.id}
              className="rounded-2xl p-4 flex items-start gap-3 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: 'oklch(57% 0.14 40)' }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface">{u.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-on-surface-variant">🚗 {u.drive}</span>
                  {u.vegetarian && <span className="text-xs text-on-surface-variant">🌿</span>}
                  {isMarktVandaag && (
                    <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}>
                      Markt!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-2xl p-3 mb-5 text-sm font-semibold"
        style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.3)', color: 'oklch(65% 0.10 218)' }}
      >
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
        Bekijk route alvast op kaart →
      </a>

      <button
        onClick={onConfirm}
        className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2 mb-3"
        style={{ background: 'oklch(57% 0.14 40)' }}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        Maak dagplan
      </button>

      <button
        onClick={onReset}
        className="w-full rounded-2xl py-3 text-sm font-semibold"
        style={{ background: 'transparent', border: '2px solid #E4D9C8', color: '#A8937A' }}
      >
        Opnieuw beginnen
      </button>
    </div>
  )
}

function EditPlanView({
  plan,
  onChange,
  basketIds,
  onConfirm,
  onAddStop,
  onReset,
}: {
  plan: DayPlan
  onChange: (p: DayPlan) => void
  basketIds: string[]
  onConfirm: () => void
  onAddStop: () => void
  onReset: () => void
}) {
  const moveStop = (i: number, dir: -1 | 1) => {
    const stops = [...plan.stops]
    const j = i + dir
    if (j < 0 || j >= stops.length) return
    ;[stops[i], stops[j]] = [stops[j], stops[i]]
    onChange({ ...plan, stops })
  }

  const removeStop = (i: number) => {
    const stops = plan.stops.filter((_, idx) => idx !== i)
    onChange({ ...plan, stops })
  }

  return (
    <div>
      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
        Pas het plan aan
      </h2>
      <p className="text-xs text-on-surface-variant mb-5">
        Verwijder stops of pas de volgorde aan. Bevestig daarna het plan.
      </p>

      <div className="flex flex-col gap-3 mb-5">
        {plan.stops.map((stop, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 shadow-blue flex gap-3"
            style={{
              background: stop.isTip ? 'oklch(95% 0.03 83)' : '#FAF7F0',
              border: `1px solid ${stop.isTip ? '#E4D9C8' : 'oklch(57% 0.14 40 / 0.2)'}`,
              opacity: stop.isTip ? 0.8 : 1,
            }}
          >
            {/* Reorder arrows */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => moveStop(i, -1)}
                disabled={i === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: '#F0E9DA' }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>arrow_upward</span>
              </button>
              <button
                onClick={() => moveStop(i, 1)}
                disabled={i === plan.stops.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ background: '#F0E9DA' }}
              >
                <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>arrow_downward</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>{stop.time}</span>
                {stop.isTip && <span className="text-[10px]" style={{ color: '#A8937A' }}>Tip onderweg</span>}
              </div>
              <p className="font-semibold text-sm text-on-surface">{stop.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{stop.description}</p>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeStop(i)}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#FEF2F2', color: '#EF4444' }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>

      {/* Voeg stop toe */}
      <button
        onClick={onAddStop}
        className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mb-4"
        style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '2px dashed #E4D9C8' }}
      >
        <span className="material-symbols-outlined text-base">add</span>
        Voeg stop toe
      </button>

      {/* Bevestig */}
      <button
        onClick={onConfirm}
        disabled={plan.stops.length === 0}
        className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
        style={{ background: 'oklch(57% 0.14 40)' }}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
        Bevestig als dagplan
      </button>

      <button
        onClick={onReset}
        className="w-full rounded-2xl py-3 text-sm font-semibold"
        style={{ background: 'transparent', border: '2px solid #E4D9C8', color: '#A8937A' }}
      >
        Opnieuw beginnen
      </button>
    </div>
  )
}

function DagplanView({
  dayPlan,
  basketIds,
  onAanpassen,
  onReset,
  onSluitAf,
  sluitDone,
}: {
  dayPlan: DayPlan
  basketIds: string[]
  onAanpassen: () => void
  onReset: () => void
  onSluitAf: () => void
  sluitDone: boolean
}) {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const mapsUrl = buildGoogleMapsUrl(basketIds)

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h + (m || 0) / 60
  }

  return (
    <div>
      {/* Google Maps multi-stop knop */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl py-4 text-white font-bold text-base mb-5 shadow-blue"
        style={{ background: 'oklch(57% 0.14 40)' }}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions</span>
        Open route in Google Maps
      </a>

      {/* Timeline */}
      <div className="relative mb-5">
        <div className="absolute left-[18px] top-0 bottom-0 w-0.5" style={{ background: '#E4D9C8' }} />
        {dayPlan.stops.map((stop, i) => {
          const stopTime = parseTime(stop.time)
          const isNow = i < dayPlan.stops.length - 1
            ? currentHour >= stopTime && currentHour < parseTime(dayPlan.stops[i + 1].time)
            : currentHour >= stopTime
          const isTipStop = stop.isTip

          return (
            <div key={i} className="relative flex gap-4 mb-4">
              <div
                className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 z-10"
                style={{
                  background: isTipStop ? '#A8937A' : isNow ? 'oklch(79% 0.16 83)' : 'oklch(57% 0.14 40)',
                }}
              >
                {isTipStop ? '💡' : isNow ? '▶' : i + 1}
              </div>
              <div
                className="flex-1 rounded-2xl p-4 shadow-blue"
                style={{
                  background: isTipStop ? 'oklch(95% 0.03 83)' : '#FAF7F0',
                  border: `1px solid ${isTipStop ? '#E4D9C8' : isNow ? 'oklch(79% 0.16 83)' : '#E4D9C8'}`,
                  boxShadow: isNow && !isTipStop ? '0 2px 12px oklch(79% 0.16 83 / 0.2)' : undefined,
                  opacity: isTipStop ? 0.85 : 1,
                }}
              >
                <span className="text-xs font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>{stop.time}</span>
                {isNow && !isTipStop && <span className="ml-2 text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: 'oklch(92% 0.07 83)', color: 'oklch(57% 0.14 40)' }}>Nu</span>}
                {isTipStop && <span className="ml-2 text-[10px] font-semibold" style={{ color: '#A8937A' }}>Tip onderweg</span>}
                <h3 className="font-semibold text-on-surface mt-0.5">{stop.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{stop.description}</p>
                {stop.tip && (
                  <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(65% 0.10 218)' }}>
                    <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                    {stop.tip}
                  </p>
                )}
                {stop.mapsUrl && (
                  <a href={stop.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                    <span className="material-symbols-outlined text-sm">map</span>
                    Navigeer
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actie-knoppen */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onAanpassen}
          className="flex-1 rounded-2xl border-2 py-3 text-sm font-semibold"
          style={{ borderColor: '#E4D9C8', color: 'oklch(57% 0.14 40)' }}
        >
          Pas plan aan
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-2xl border-2 py-3 text-sm font-semibold"
          style={{ borderColor: '#E4D9C8', color: '#A8937A' }}
        >
          Opnieuw beginnen
        </button>
      </div>

      {/* Sluit dag af */}
      {sluitDone ? (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold" style={{ color: 'oklch(35% 0.08 148)' }}>Dag afgesloten — check het dagboek!</p>
          <a href="/dagboek" className="ml-auto text-xs font-semibold" style={{ color: 'oklch(58% 0.10 148)' }}>Dagboek →</a>
        </div>
      ) : (
        <button
          onClick={onSluitAf}
          className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2"
          style={{ background: '#2C2316', color: 'white' }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>nightlight</span>
          Sluit dag af
        </button>
      )}
    </div>
  )
}

function SluitDagAfModal({
  followedPlan,
  setFollowedPlan,
  actualText,
  setActualText,
  moodEmoji,
  setMoodEmoji,
  saving,
  onSave,
  onClose,
}: {
  followedPlan: boolean | null
  setFollowedPlan: (v: boolean) => void
  actualText: string
  setActualText: (v: string) => void
  moodEmoji: string | null
  setMoodEmoji: (v: string) => void
  saving: boolean
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6" style={{ background: 'rgba(44,35,22,0.55)' }}>
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ background: '#FAF7F0' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
            Sluit de dag af
          </h3>
          <button onClick={onClose} style={{ color: '#A8937A' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Gevolgd plan? */}
        <p className="text-sm font-semibold text-on-surface mb-3">Hebben jullie het plan gevolgd?</p>
        <div className="flex gap-3 mb-4">
          {[{ val: true, label: 'Ja, grotendeels' }, { val: false, label: 'Nee, anders gegaan' }].map(opt => (
            <button
              key={String(opt.val)}
              onClick={() => setFollowedPlan(opt.val)}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold transition-all"
              style={
                followedPlan === opt.val
                  ? { background: 'oklch(57% 0.14 40)', color: 'white', border: '2px solid oklch(57% 0.14 40)' }
                  : { background: '#FAF7F0', color: '#6B5A3E', border: '2px solid #E4D9C8' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Vrije tekst als nee */}
        {followedPlan === false && (
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: '#A8937A' }}>
              Wat hebben jullie gedaan?
            </label>
            <textarea
              value={actualText}
              onChange={e => setActualText(e.target.value)}
              placeholder="Schrijf kort wat er echt is gebeurd…"
              rows={3}
              className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
              style={{ background: 'white', border: '1px solid #E4D9C8', color: '#2C2316' }}
            />
          </div>
        )}

        {/* Mood */}
        <p className="text-sm font-semibold text-on-surface mb-3">Hoe was de dag?</p>
        <div className="flex gap-2 mb-5">
          {MOODS.map(m => (
            <button
              key={m.emoji}
              onClick={() => setMoodEmoji(m.emoji)}
              className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all"
              style={
                moodEmoji === m.emoji
                  ? { background: 'oklch(92% 0.07 83)', border: '2px solid oklch(79% 0.16 83)', boxShadow: '0 2px 8px oklch(79% 0.16 83 / 0.3)' }
                  : { background: '#F0E9DA', border: '2px solid transparent' }
              }
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[9px] font-semibold" style={{ color: moodEmoji === m.emoji ? '#6B5A3E' : '#A8937A' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Opslaan */}
        <button
          onClick={onSave}
          disabled={saving || (followedPlan === null)}
          className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'oklch(57% 0.14 40)' }}
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">refresh</span>
              Opslaan…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
              Opslaan in dagboek
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function PlanMorgenSection({
  tomorrowEntry,
  tomorrowPlan,
  basketIds,
  onToggleBasket,
  planning,
  onPlan,
  showWizard,
  onToggleWizard,
}: {
  tomorrowEntry: KalenderEntry | null
  tomorrowPlan: DayPlan | null
  basketIds: string[]
  onToggleBasket: (id: string) => void
  planning: boolean
  onPlan: () => void
  showWizard: boolean
  onToggleWizard: () => void
}) {
  const tomorrowIsReisdag = tomorrowEntry?.type === 'reisdag'

  return (
    <div className="mt-8 pt-6" style={{ borderTop: '2px dashed #E4D9C8' }}>
      <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>
        Wat willen we morgen doen?
      </h3>

      {tomorrowIsReisdag && tomorrowEntry?.type === 'reisdag' && (
        <div className="rounded-2xl p-4" style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.2)' }}>
          <p className="font-semibold text-on-surface text-sm">🚗 Morgen is een reisdag</p>
          <p className="text-xs text-on-surface-variant mt-1">
            {(tomorrowEntry as Reisdag).van} → {(tomorrowEntry as Reisdag).naar} — {(tomorrowEntry as Reisdag).route}
          </p>
        </div>
      )}

      {!tomorrowIsReisdag && tomorrowPlan && (
        <div className="rounded-2xl p-4" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'oklch(40% 0.10 148)' }}>✓ Plan voor morgen staat al klaar!</p>
          <div className="mt-2">
            {tomorrowPlan.stops.slice(0, 3).map((s, i) => (
              <p key={i} className="text-xs text-on-surface-variant">{s.time} — {s.name}</p>
            ))}
          </div>
        </div>
      )}

      {!tomorrowIsReisdag && !tomorrowPlan && (
        <>
          <p className="text-sm text-on-surface-variant mb-4">Plan alvast de dag van morgen. Het staat klaar als jullie wakker worden.</p>
          <button
            onClick={onToggleWizard}
            className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '2px solid #E4D9C8' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            {showWizard ? 'Sluit morgen-planner' : 'Plan morgen →'}
          </button>

          {showWizard && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
                Kies uitjes voor morgen
              </p>
              <div className="flex flex-col gap-3 mb-4">
                {uitjes.filter(u => !u.marktDag).slice(0, 6).map(u => {
                  const inBasket = basketIds.includes(u.id)
                  return (
                    <MiniUitjeCard key={u.id} uitje={u} inBasket={inBasket} onToggle={onToggleBasket} />
                  )
                })}
              </div>
              {basketIds.length > 0 && (
                <button
                  onClick={onPlan}
                  disabled={planning}
                  className="w-full rounded-2xl py-3 text-white font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: planning ? '#A8937A' : 'oklch(57% 0.14 40)' }}
                >
                  {planning ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      Plan samenstellen…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      Stel morgenplan samen ({basketIds.length} stop{basketIds.length > 1 ? 's' : ''})
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MiniUitjeCard({ uitje, inBasket, onToggle }: { uitje: Uitje; inBasket: boolean; onToggle: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    entertainment: 'oklch(79% 0.16 83)',
    culture: 'oklch(57% 0.14 40)',
    food: 'oklch(65% 0.09 298)',
    shop: 'oklch(65% 0.10 218)',
  }
  const typeIcons: Record<string, string> = {
    entertainment: 'attractions',
    culture: 'museum',
    food: 'restaurant',
    shop: 'shopping_cart',
  }
  const c = typeColors[uitje.type] || 'oklch(57% 0.14 40)'

  return (
    <div className="rounded-2xl p-3 flex items-center gap-3 shadow-blue" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${c}20` }}>
        <span className="material-symbols-outlined" style={{ color: c, fontVariationSettings: "'FILL' 1" }}>{typeIcons[uitje.type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-on-surface truncate">{uitje.name}</p>
          <span className="text-xs rounded-full px-2 py-0.5 flex-shrink-0 font-medium" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>{uitje.drive}</span>
        </div>
        <p className="text-xs text-on-surface-variant truncate">{uitje.desc}</p>
      </div>
      <button
        onClick={() => onToggle(uitje.id)}
        className="rounded-full text-xs font-bold px-3 py-1.5 flex-shrink-0 transition-all"
        style={inBasket ? { background: 'oklch(57% 0.14 40)', color: 'white' } : { background: '#F0E9DA', color: '#6B5A3E' }}
      >
        {inBasket ? '✓' : '+'}
      </button>
    </div>
  )
}
