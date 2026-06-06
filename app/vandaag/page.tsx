'use client'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession, signIn } from 'next-auth/react'

const DagRouteMap = dynamic(() => import('@/components/DagRouteMap'), { ssr: false })
import { WeatherData, wmoToDescription, wmoToEmoji, DayPlan, DayPlanStop, PhotoMeta } from '@/lib/types'
import { uitjes, Uitje, getTodayMarktdagen, getUitjeById } from '@/lib/uitjes'
import { reiskalender, Reisdag, VerblijfDay, KalenderEntry } from '@/lib/reiskalender'
import { getSupabase } from '@/lib/supabase'
import { getParisDateString, isAfterParisHour } from '@/lib/date-utils'

const HOME_COORDS: [number, number] = [44.398, 1.119]

const CATEGORIES = [
  { label: 'Iets voor Lena', icon: 'child_care',    value: 'lena',     color: 'oklch(79% 0.16 83)',  bg: 'oklch(92% 0.07 83)',  uitjeFilter: (u: Uitje) => !!u.lena },
  { label: 'Kasteel of dorp', icon: 'castle',        value: 'culture',  color: 'oklch(57% 0.14 40)',  bg: 'oklch(93% 0.05 40)',  uitjeFilter: (u: Uitje) => u.type === 'culture' },
  { label: 'Water of bos',    icon: 'forest',        value: 'nature',   color: 'oklch(58% 0.10 148)', bg: 'oklch(92% 0.05 148)', uitjeFilter: (u: Uitje) => u.type === 'entertainment' || u.type === 'nature' },
  { label: 'Lekker eten',     icon: 'restaurant',   value: 'food',     color: 'oklch(65% 0.09 298)', bg: 'oklch(92% 0.05 298)', uitjeFilter: (u: Uitje) => u.type === 'food' },
  { label: 'Boodschappen',    icon: 'shopping_cart', value: 'shop',     color: 'oklch(65% 0.10 218)', bg: 'oklch(92% 0.05 218)', uitjeFilter: (u: Uitje) => u.type === 'shop' },
  { label: 'Verras ons',      icon: 'auto_awesome',  value: 'surprise', color: 'oklch(68% 0.11 10)',  bg: 'oklch(93% 0.05 10)',  uitjeFilter: (u: Uitje) => u.type !== 'bakery' },
]

const MOODS = [
  { emoji: '😴', label: 'Moe' },
  { emoji: '🙂', label: 'Goed' },
  { emoji: '😄', label: 'Geweldig' },
  { emoji: '🥰', label: 'Zalig' },
  { emoji: '🤩', label: 'Episch' },
]

type Phase = 'select' | 'edit' | 'plan'

interface UserLocation { lat: number; lon: number }
interface Tussenstop { naam: string; beschrijving: string; gmaps: string }

function getTodayDateStr() { return getParisDateString() }
function getTomorrowDateStr() { return getParisDateString(1) }
function isAfter17Paris(): boolean { return isAfterParisHour(17) }

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLon = (b[1] - a[1]) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function getTodayBaseCoords(): [number, number] {
  const today = getParisDateString()
  const entry = reiskalender[today]
  if (entry && (entry.type === 'vakantie' || entry.type === 'verblijf')) return entry.coords
  return HOME_COORDS
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
  const stops = ids.map(id => getUitjeById(id)).filter(Boolean).map(u => `${u!.coords[0]},${u!.coords[1]}`)
  if (stops.length === 0) return `https://www.google.com/maps/search/?api=1&query=Les+Escaliers+Porte-du-Quercy`
  return `https://www.google.com/maps/dir/${base}/${stops.join('/')}/${base}`
}

function sortByRoute(stops: Uitje[], destinationId: string): Uitje[] {
  const dest = stops.find(u => u.id === destinationId)
  const others = stops.filter(u => u.id !== destinationId)
  if (!dest) return stops
  const rv: [number, number] = [dest.coords[0] - HOME_COORDS[0], dest.coords[1] - HOME_COORDS[1]]
  const lenSq = rv[0] ** 2 + rv[1] ** 2
  const proj = (u: Uitje): number => {
    const v = [u.coords[0] - HOME_COORDS[0], u.coords[1] - HOME_COORDS[1]]
    return lenSq > 0 ? (v[0] * rv[0] + v[1] * rv[1]) / lenSq : 0
  }
  // On-route stops first (home→destination order), off-route last (visit on return)
  const onRoute = others.filter(u => proj(u) >= -0.1).sort((a, b) => proj(a) - proj(b))
  const offRoute = others.filter(u => proj(u) < -0.1)
  return [...onRoute, dest, ...offRoute]
}

function getRouteInfo(stop: Uitje, destinationId: string): { proj: number; perpRatio: number } {
  const dest = getUitjeById(destinationId)
  if (!dest) return { proj: 0, perpRatio: 0 }
  const rv: [number, number] = [dest.coords[0] - HOME_COORDS[0], dest.coords[1] - HOME_COORDS[1]]
  const lenSq = rv[0] ** 2 + rv[1] ** 2
  if (lenSq === 0) return { proj: 0, perpRatio: 0 }
  const v = [stop.coords[0] - HOME_COORDS[0], stop.coords[1] - HOME_COORDS[1]]
  const proj = (v[0] * rv[0] + v[1] * rv[1]) / lenSq
  const perpSq = (v[0] ** 2 + v[1] ** 2) - proj * proj * lenSq
  const perpRatio = Math.sqrt(Math.max(0, perpSq) / lenSq)
  return { proj, perpRatio }
}

function getOffRouteLabel(stop: Uitje, destinationId: string | null): string | null {
  if (!destinationId || stop.id === destinationId) return null
  const { proj, perpRatio } = getRouteInfo(stop, destinationId)
  if (proj < -0.1) return 'Andere richting'
  if (perpRatio > 0.8) return 'Grote omweg'
  return null
}

function buildLocalPlan(ids: string[], destinationId: string | null): DayPlan {
  const stops = ids.map(id => getUitjeById(id)).filter(Boolean) as Uitje[]
  const sorted = destinationId ? sortByRoute(stops, destinationId) : stops
  const slots = ['9:30', '11:00', '12:30', '14:30', '16:00']
  const planStops: DayPlanStop[] = sorted.map((u, i) => ({
    time: slots[Math.min(i, slots.length - 1)],
    name: u.name,
    description: u.desc,
    mapsUrl: u.gmaps,
    coords: u.coords,
    isTip: false,
    uitjeId: u.id,
  }))
  return { stops: planStops, checklist: [] }
}

function estimateTravelMinutes(from: [number, number], to: [number, number]): number {
  const km = haversineKm(from, to)
  return Math.round(km)
}

function formatTravelTime(mins: number): string {
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `~${h}u ${m}m` : `~${h}u`
}

export default function VandaagPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [phase, setPhase] = useState<Phase>('select')
  const [mainDestinationId, setMainDestinationId] = useState<string | null>(null)
  const [basketIds, setBasketIds] = useState<string[]>([])
  const [activeCatTab, setActiveCatTab] = useState<string>(CATEGORIES[0].value)
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null)
  const [editPlan, setEditPlan] = useState<DayPlan | null>(null)
  const [addStopMode, setAddStopMode] = useState(false)
  const [basketSnapshot, setBasketSnapshot] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showTomorrowWizard, setShowTomorrowWizard] = useState(false)
  const [tomorrowBasketIds, setTomorrowBasketIds] = useState<string[]>([])
  const [tomorrowPlan, setTomorrowPlan] = useState<DayPlan | null>(null)
  const [tomorrowPlanning, setTomorrowPlanning] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [showSluitAf, setShowSluitAf] = useState(false)
  const [followedPlan, setFollowedPlan] = useState<boolean | null>(null)
  const [sluitActualText, setSluitActualText] = useState('')
  const [sluitMoodEmoji, setSluitMoodEmoji] = useState<string | null>(null)
  const [sluitSaving, setSluitSaving] = useState(false)
  const [sluitDone, setSluitDone] = useState(false)
  const [infoUitjeId, setInfoUitjeId] = useState<string | null>(null)
  const [previewDate, setPreviewDate] = useState<string | null>(null)
  const [showPreviewPicker, setShowPreviewPicker] = useState(false)

  const allUitjes = useMemo(() => [...uitjes, ...getTodayMarktdagen()], [])

  const today = getTodayDateStr()
  const tomorrow = getTomorrowDateStr()
  const todayEntry = reiskalender[today] ?? null
  const tomorrowEntry = reiskalender[tomorrow] ?? null
  const activeEntry = previewDate ? (reiskalender[previewDate] ?? null) : todayEntry
  const isReisdag = activeEntry?.type === 'reisdag'
  const after17 = isAfter17Paris()
  const showVertreklijst = new Date() < new Date('2025-06-13')

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.398&longitude=1.119&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3')
      .then(r => r.json()).then(setWeather).catch(() => {})

    const saved = localStorage.getItem('dagplan_basket')
    if (saved) setBasketIds(JSON.parse(saved))
    const savedDest = localStorage.getItem('dagplan_destination')
    if (savedDest) setMainDestinationId(savedDest)

    fetch('/api/diary')
      .then(r => r.json())
      .then((data: Array<{ date: string; plan_text?: string; actual_text?: string; mood_emoji?: string }>) => {
        const todayDiary = data.find(e => e.date === today)
        if (todayDiary?.plan_text) {
          try {
            const plan = typeof todayDiary.plan_text === 'string' && todayDiary.plan_text.startsWith('{')
              ? JSON.parse(todayDiary.plan_text) : null
            if (plan?.stops) { setDayPlan(plan); setPhase('plan') }
          } catch { /* geen plan */ }
        }
        if (todayDiary?.actual_text || todayDiary?.mood_emoji) setSluitDone(true)

        const tomorrowDiary = data.find(e => e.date === tomorrow)
        if (tomorrowDiary?.plan_text) {
          try {
            const plan = typeof tomorrowDiary.plan_text === 'string' && tomorrowDiary.plan_text.startsWith('{')
              ? JSON.parse(tomorrowDiary.plan_text) : null
            if (plan?.stops) setTomorrowPlan(plan)
          } catch { /* geen plan */ }
        }
      }).catch(() => {})

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 10000 }
      )
    }
  }, [])

  const setDestination = (id: string | null) => {
    setMainDestinationId(id)
    if (id) {
      localStorage.setItem('dagplan_destination', id)
      setBasketIds(prev => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        localStorage.setItem('dagplan_basket', JSON.stringify(next))
        return next
      })
    } else {
      localStorage.removeItem('dagplan_destination')
    }
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

  const handlePlan = async (forDate: string, ids: string[], destinationId: string | null = null) => {
    const plan = buildLocalPlan(ids, destinationId)
    if (forDate === today) {
      setEditPlan(plan)
      setPhase('edit')
    } else {
      setTomorrowPlanning(true)
      try {
        await getSupabase().from('diary_entries').upsert(
          { date: forDate, plan_text: JSON.stringify(plan) },
          { onConflict: 'date' }
        )
        setTomorrowPlan(plan)
      } catch { /* ignore */ }
      setTomorrowPlanning(false)
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

  const handleSluitAf = async (selectedPhotos: PhotoMeta[]) => {
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
          ...(selectedPhotos.length > 0 && { photos: selectedPhotos }),
        }),
      })
      setSluitDone(true)
      setShowSluitAf(false)
    } catch { /* ignore */ }
    setSluitSaving(false)
  }

  const reset = () => {
    setPhase('select')
    setBasketIds([])
    setMainDestinationId(null)
    setActiveCatTab(CATEGORIES[0].value)
    setDayPlan(null)
    setEditPlan(null)
    setAddStopMode(false)
    setBasketSnapshot([])
    setError(null)
    setShowSluitAf(false)
    localStorage.removeItem('dagplan_basket')
    localStorage.removeItem('dagplan_destination')
  }

  const handleAddStop = () => {
    setBasketSnapshot(basketIds)
    setAddStopMode(true)
    setActiveCatTab(CATEGORIES[0].value)
    setPhase('select')
  }

  const handleAddStopReturn = () => {
    const newIds = basketIds.filter(id => !basketSnapshot.includes(id))
    if (newIds.length > 0 && editPlan) {
      const allSlots = ['9:30', '11:00', '12:30', '14:30', '16:00', '17:00']
      const usedSlots = new Set(editPlan.stops.map(s => s.time))
      const freeSlots = allSlots.filter(s => !usedSlots.has(s))
      const newStops: DayPlanStop[] = newIds.map((id, i) => {
        const u = getUitjeById(id)
        return {
          time: freeSlots[i] ?? allSlots[allSlots.length - 1],
          name: u?.name ?? id,
          description: u?.desc ?? '',
          mapsUrl: u?.gmaps,
          coords: u?.coords,
          isTip: false,
          uitjeId: u?.id,
        }
      })
      setEditPlan({ ...editPlan, stops: [...editPlan.stops, ...newStops] })
    }
    setAddStopMode(false)
    setBasketSnapshot([])
    setPhase('edit')
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase])

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const rainWarning = getRainWarning(weather)

  return (
    <div className="px-4 pt-5 pb-28">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-xl font-semibold" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>
            Notre Voyage
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{dateStr}</div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowPreviewPicker(v => !v)}
            className="text-[10px] rounded-full px-2.5 py-1 mt-1"
            style={{ background: previewDate ? 'oklch(93% 0.05 40)' : '#F0E9DA', color: previewDate ? 'oklch(40% 0.12 40)' : '#A8937A', border: previewDate ? '1px solid oklch(57% 0.14 40 / 0.3)' : 'none' }}
          >
            🧪 Preview
          </button>
          {showPreviewPicker && (
            <div className="absolute right-0 top-9 z-40 rounded-2xl shadow-lg p-3" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8', minWidth: 220 }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8937A' }}>Preview reisdag</p>
              <div className="flex flex-col gap-1.5">
                {(Object.entries(reiskalender) as [string, KalenderEntry][]).filter(([, v]) => v.type === 'reisdag').map(([d, entry]) => (
                  <button
                    key={d}
                    onClick={() => { setPreviewDate(previewDate === d ? null : d); setShowPreviewPicker(false) }}
                    className="text-left rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{ background: previewDate === d ? 'oklch(93% 0.05 40)' : '#F5EFE3', color: previewDate === d ? 'oklch(40% 0.12 40)' : '#2C2316', border: previewDate === d ? '1px solid oklch(57% 0.14 40 / 0.3)' : '1px solid transparent' }}
                  >
                    {d} — {(entry as Reisdag).label}
                  </button>
                ))}
                {previewDate && (
                  <button
                    onClick={() => { setPreviewDate(null); setShowPreviewPicker(false) }}
                    className="rounded-xl px-3 py-2 text-xs font-semibold mt-1"
                    style={{ background: '#FEF2F2', color: '#EF4444' }}
                  >
                    ✕ Sluit preview
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <WeatherCard weather={weather} />

      {showVertreklijst && (
        <a href="/vertreklijst" className="flex items-center gap-3 rounded-2xl p-4 mb-4 shadow-blue" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)', textDecoration: 'none' }}>
          <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(40% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>checklist</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'oklch(30% 0.10 148)' }}>Vertreklijst nog niet compleet?</p>
            <p className="text-xs" style={{ color: 'oklch(40% 0.10 148)' }}>Check alles vóór de heenreis op 12 juni →</p>
          </div>
          <span className="material-symbols-outlined text-base" style={{ color: 'oklch(40% 0.10 148)' }}>chevron_right</span>
        </a>
      )}

      {rainWarning && phase === 'select' && (
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.3)' }}>
          <span className="material-symbols-outlined text-base mt-0.5" style={{ color: 'oklch(65% 0.10 218)' }}>water_drop</span>
          <p className="text-sm" style={{ color: '#2C2316' }}>{rainWarning}</p>
        </div>
      )}

      {activeEntry?.type === 'reisdag' && (
        <ReisDagView entry={activeEntry as Reisdag} userLocation={userLocation} />
      )}

      {activeEntry?.type === 'verblijf' && (
        <div className="rounded-2xl p-3 mb-4" style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>
            📍 {(activeEntry as VerblijfDay).verblijf} — {(activeEntry as VerblijfDay).label}
          </p>
        </div>
      )}

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

      {!isReisdag && (
        <>
          {phase === 'select' && (
            <SelectPhase
              activeCatTab={activeCatTab}
              setActiveCatTab={setActiveCatTab}
              basketIds={basketIds}
              mainDestinationId={mainDestinationId}
              onSetDestination={setDestination}
              onToggleBasket={toggleBasket}
              addStopMode={addStopMode}
              onBack={addStopMode ? handleAddStopReturn : undefined}
              onConfirm={addStopMode ? handleAddStopReturn : () => handlePlan(today, basketIds, mainDestinationId)}
              onReset={reset}
              onOpenInfo={setInfoUitjeId}
            />
          )}

          {phase === 'edit' && editPlan && (
            <EditPlanView
              plan={editPlan}
              onChange={setEditPlan}
              basketIds={basketIds}
              onConfirm={() => handleConfirmPlan(editPlan)}
              onAddStop={handleAddStop}
              onReset={reset}
              onOpenInfo={setInfoUitjeId}
            />
          )}

          {phase === 'plan' && dayPlan && (
            <>
              <DagplanView
                dayPlan={dayPlan}
                basketIds={basketIds}
                mainDestinationId={mainDestinationId}
                onAanpassen={() => { setEditPlan(dayPlan); setPhase('edit') }}
                onReset={reset}
                onSluitAf={() => setShowSluitAf(true)}
                sluitDone={sluitDone}
                onOpenInfo={setInfoUitjeId}
              />
              {showSluitAf && (
                <SluitDagAfModal
                  date={today}
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

      {infoUitjeId && (
        <UitjeInfoModal uitjeId={infoUitjeId} onClose={() => setInfoUitjeId(null)} />
      )}

      {after17 && !isReisdag && (phase === 'plan' || phase === 'select') && (
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
    'Atelier des Sens 89': { naam: 'Atelier des Sens 89', adres: 'Route du Moulin Neuf, 89270 Venoy', gmaps: 'https://www.google.com/maps/search/?api=1&query=Atelier+des+Sens+89+Venoy' },
    'Les Escaliers': { naam: 'Les Escaliers de La Combe', adres: 'La Combe, 82240 Porte-du-Quercy', gmaps: 'https://www.google.com/maps/search/?api=1&query=Les+Escaliers+Porte-du-Quercy' },
    'Chartres': { naam: 'Hotel Henri IV', adres: "31 Rue du Soleil d'Or, 28000 Chartres", gmaps: 'https://www.google.com/maps/search/?api=1&query=Hotel+Henri+IV+Chartres' },
    'Amersfoort': { naam: 'Thuis in Amersfoort', adres: 'Amersfoort', gmaps: 'https://www.google.com/maps/search/?api=1&query=Amersfoort' },
  }
  const overnachting = accommodations[entry.naar]

  const routeCoords: Record<string, string> = {
    'Amersfoort': '52.155,5.387',
    'Atelier des Sens 89': '47.861,3.562',
    'Les Escaliers': '44.398,1.119',
    'Chartres': '48.447,1.489',
  }
  const fromCoord = routeCoords[entry.van] || ''
  const toCoord = routeCoords[entry.naar] || ''
  const routeUrl = fromCoord && toCoord ? `https://www.google.com/maps/dir/${fromCoord}/${toCoord}` : ''
  const tussenstops = entry.route.replace('Via ', '').split(', ')

  const zoekTussenstop = async () => {
    if (!userLocation) return
    setTussenstopLoading(true)
    setTussenstop(null)
    try {
      const res = await fetch('/api/tussenstop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ van: entry.van, naar: entry.naar, route: entry.route, lat: userLocation.lat, lon: userLocation.lon }),
      })
      if (res.ok) setTussenstop(await res.json())
    } catch { /* ignore */ }
    setTussenstopLoading(false)
  }

  const quickActions = [
    { icon: '⛽', label: 'Tanken', query: 'station essence', color: 'oklch(79% 0.16 83)', bg: 'oklch(92% 0.07 83)' },
    { icon: '🍽️', label: 'Eten', query: 'restaurant', color: 'oklch(65% 0.09 298)', bg: 'oklch(92% 0.05 298)' },
    { icon: '🏘️', label: 'Dorpje', query: 'village', color: 'oklch(58% 0.10 148)', bg: 'oklch(92% 0.05 148)' },
  ]

  return (
    <div className="mb-5">
      {/* Dark travel hero */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(150deg, #2C2316, oklch(35% 0.10 40))', color: 'white' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(79% 0.16 83)', fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.label}</p>
        </div>
        <h2 className="text-2xl font-medium leading-tight mb-1" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic' }}>
          {entry.van} →<br/>{entry.naar}
        </h2>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.route} · ~8u rijden</p>
        {routeUrl && (
          <a href={routeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", color: 'oklch(79% 0.16 83)' }}>navigation</span>
            Start navigatie
          </a>
        )}
      </div>

      {/* GPS location */}
      {userLocation && (
        <div className="rounded-2xl p-3 mb-4 flex items-center gap-3" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}>
          <span className="material-symbols-outlined" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1", fontSize: 18 }}>my_location</span>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'oklch(35% 0.08 148)' }}>Huidige locatie</p>
            <p className="text-xs" style={{ color: 'oklch(45% 0.08 148)' }}>{userLocation.lat.toFixed(3)}°N, {userLocation.lon.toFixed(3)}°E · live</p>
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${userLocation.lat},${userLocation.lon}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(58% 0.10 148)' }}>Maps →</a>
        </div>
      )}

      {/* Quick actions */}
      {userLocation && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8937A' }}>Wat heb je nodig?</p>
          <div className="flex gap-2 mb-4">
            {quickActions.map(a => (
              <a key={a.query} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.query)}&near=${userLocation.lat},${userLocation.lon}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl py-3.5" style={{ background: a.bg, border: `1.5px solid ${a.color}30`, textDecoration: 'none' }}>
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-bold" style={{ color: a.color }}>{a.label}</span>
              </a>
            ))}
          </div>

          {/* Tussenstop suggestion — subtle link, not a big CTA */}
          <div className="flex items-center mb-4">
            <button onClick={zoekTussenstop} disabled={tussenstopLoading} className="flex items-center gap-1.5 text-xs font-semibold py-1 rounded-lg" style={{ color: '#A8937A' }}>
              {tussenstopLoading
                ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>refresh</span>Tussenstop zoeken…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>lightbulb</span>Stel tussenstop voor</>
              }
            </button>
          </div>

          {tussenstop && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'oklch(92% 0.07 83)', border: '1.5px solid oklch(79% 0.16 83 / 0.4)' }}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-sm" style={{ color: 'oklch(79% 0.16 83)', fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B5A3E' }}>Suggestie</span>
                  </div>
                  <p className="font-bold text-on-surface">{tussenstop.naam}</p>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{tussenstop.beschrijving}</p>
                  <a href={tussenstop.gmaps} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold" style={{ background: 'oklch(79% 0.16 83)', color: 'white', textDecoration: 'none' }}>
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: 13 }}>near_me</span>Navigeer
                  </a>
                </div>
                <button onClick={() => setTussenstop(null)} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.08)' }} aria-label="Sluit suggestie">
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6B5A3E' }}>close</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Route timeline */}
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Route van vandaag</p>
      <div className="relative mb-5" style={{ paddingLeft: 32 }}>
        <div className="absolute top-2 bottom-2 w-0.5 rounded-full" style={{ left: 11, background: '#E4D9C8' }} />
        {[entry.van, ...tussenstops, entry.naar].map((stop, i, arr) => {
          const isFirst = i === 0
          const isLast = i === arr.length - 1
          const dotColor = isFirst || isLast ? 'oklch(57% 0.14 40)' : '#A8937A'
          return (
            <div key={i} className="relative mb-4">
              <div className="absolute z-10" style={{ left: -21, top: 4, width: 12, height: 12, borderRadius: '50%', background: dotColor, border: `2px solid ${dotColor}` }} />
              <div className="rounded-xl px-3 py-2" style={{ background: isFirst || isLast ? 'oklch(93% 0.05 40)' : '#FAF7F0', border: `1px solid ${isFirst || isLast ? 'oklch(57% 0.14 40 / 0.3)' : '#E4D9C8'}` }}>
                <p className="text-sm font-semibold text-on-surface">{stop}</p>
                {i > 0 && i < arr.length - 1 && <p className="text-xs text-on-surface-variant">Tussenstop</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Accommodation */}
      {overnachting && (
        <div className="rounded-2xl p-4 shadow-blue" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'oklch(93% 0.05 40)' }}>
              <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>{entry.naar === 'Amersfoort' ? 'home' : 'hotel'}</span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#A8937A' }}>{entry.naar === 'Amersfoort' ? 'Bestemming' : 'Overnachting'}</p>
              <h3 className="font-bold text-on-surface mt-0.5">{overnachting.naam}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{overnachting.adres}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <a href={overnachting.gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: 'oklch(92% 0.05 218)', color: 'oklch(65% 0.10 218)', textDecoration: 'none' }}>
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: 13 }}>near_me</span>Navigeer
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Uitje card used inside SelectPhase
function UitjeSelectCard({
  uitje,
  inBasket,
  isDestination,
  hasDestination,
  mainDestinationId,
  onSetDestination,
  onToggleBasket,
  onOpenInfo,
  catColor,
}: {
  uitje: Uitje
  inBasket: boolean
  isDestination: boolean
  hasDestination: boolean
  mainDestinationId: string | null
  onSetDestination: (id: string | null) => void
  onToggleBasket: (id: string) => void
  onOpenInfo: (id: string) => void
  catColor: string
}) {
  const isMarktVandaag = uitje.id.startsWith('markt-')
  const offRouteLabel = hasDestination && !isDestination ? getOffRouteLabel(uitje, mainDestinationId) : null

  return (
    <div
      className="rounded-2xl p-5 shadow-blue"
      style={{
        background: isDestination ? 'oklch(93% 0.05 40)' : inBasket ? `${catColor}0D` : '#FAF7F0',
        border: `2px solid ${isDestination ? 'oklch(57% 0.14 40)' : inBasket ? catColor : '#E4D9C8'}`,
      }}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={() => onOpenInfo(uitje.id)}
          className="flex-1 text-left"
        >
          <h3 className="text-xl font-bold text-on-surface leading-tight">{uitje.name}</h3>
        </button>
        <button
          onClick={() => onOpenInfo(uitje.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: '#F0E9DA' }}
          aria-label="Meer info"
        >
          <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>info</span>
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>
          🚗 {uitje.drive}
        </span>
        {uitje.vegetarian && (
          <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'oklch(92% 0.05 148)', color: 'oklch(40% 0.10 148)' }}>
            🌿 Vegetarisch
          </span>
        )}
        {isMarktVandaag && (
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}>
            🛒 Markt vandaag!
          </span>
        )}
        {isDestination && (
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'oklch(57% 0.14 40)', color: 'white' }}>
            📍 Jouw bestemming
          </span>
        )}
        {offRouteLabel && (
          <span
            className="text-[10px] font-bold rounded-full px-2 py-0.5"
            style={{
              background: offRouteLabel === 'Andere richting' ? '#FEF2F2' : 'oklch(92% 0.07 83)',
              color: offRouteLabel === 'Andere richting' ? '#DC2626' : 'oklch(45% 0.14 40)',
            }}
          >
            {offRouteLabel === 'Andere richting' ? '↩' : '↗'} {offRouteLabel}
          </span>
        )}
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{uitje.desc}</p>

      {/* Action buttons */}
      {isDestination ? (
        // This IS the destination
        <button
          onClick={() => onSetDestination(null)}
          className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: 'oklch(57% 0.14 40)', color: 'white' }}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
          Bestemming — tik om te wijzigen
        </button>
      ) : !hasDestination ? (
        // No destination chosen yet — invite to set one
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSetDestination(uitje.id)}
            className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: catColor, color: 'white' }}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            Kies als bestemming
          </button>
          {inBasket ? (
            <button
              onClick={() => onToggleBasket(uitje.id)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: `${catColor}15`, color: catColor, border: `1.5px solid ${catColor}` }}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Toegevoegd als extra stop
            </button>
          ) : (
            <button
              onClick={() => onToggleBasket(uitje.id)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ background: '#F0E9DA', color: '#6B5A3E' }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Voeg toe als extra stop
            </button>
          )}
        </div>
      ) : (
        // Destination is set (but not this one)
        <button
          onClick={() => onToggleBasket(uitje.id)}
          className="w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={
            inBasket
              ? { background: catColor, color: 'white' }
              : { background: '#F0E9DA', color: catColor }
          }
        >
          {inBasket ? (
            <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>Geselecteerd</>
          ) : (
            <><span className="material-symbols-outlined text-base">add_circle</span>Voeg toe aan dag</>
          )}
        </button>
      )}
    </div>
  )
}

function SelectPhase({
  activeCatTab,
  setActiveCatTab,
  basketIds,
  mainDestinationId,
  onSetDestination,
  onToggleBasket,
  addStopMode,
  onBack,
  onConfirm,
  onReset,
  onOpenInfo,
}: {
  activeCatTab: string
  setActiveCatTab: (v: string) => void
  basketIds: string[]
  mainDestinationId: string | null
  onSetDestination: (id: string | null) => void
  onToggleBasket: (id: string) => void
  addStopMode: boolean
  onBack?: () => void
  onConfirm: () => void
  onReset?: () => void
  onOpenInfo: (id: string) => void
}) {
  const activeCat = CATEGORIES.find(c => c.value === activeCatTab) || CATEGORIES[0]
  const baseCoords = getTodayBaseCoords()
  const destination = mainDestinationId ? getUitjeById(mainDestinationId) : null

  const rawCatUitjes = [...uitjes, ...getTodayMarktdagen()]
    .filter(activeCat.uitjeFilter)
    .filter(u => haversineKm(u.coords, baseCoords) <= 150)

  // When destination is set: on-route items first (ascending proj), off-route last
  const catUitjes = mainDestinationId
    ? (() => {
        const dest = getUitjeById(mainDestinationId)
        if (!dest) return rawCatUitjes
        const rv: [number, number] = [dest.coords[0] - HOME_COORDS[0], dest.coords[1] - HOME_COORDS[1]]
        const lenSq = rv[0] ** 2 + rv[1] ** 2
        const proj = (u: Uitje): number => {
          const v = [u.coords[0] - HOME_COORDS[0], u.coords[1] - HOME_COORDS[1]]
          return lenSq > 0 ? (v[0] * rv[0] + v[1] * rv[1]) / lenSq : 0
        }
        const destInList = rawCatUitjes.find(u => u.id === mainDestinationId)
        const others = rawCatUitjes.filter(u => u.id !== mainDestinationId)
        const onRoute = others.filter(u => proj(u) >= -0.1).sort((a, b) => proj(a) - proj(b))
        const offRoute = others.filter(u => proj(u) < -0.1)
        return [...onRoute, ...(destInList ? [destInList] : []), ...offRoute]
      })()
    : rawCatUitjes

  const extraCount = basketIds.filter(id => id !== mainDestinationId).length

  return (
    <div>
      {addStopMode && onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: 'oklch(57% 0.14 40)' }}>
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Terug naar plan
        </button>
      )}

      {/* Destination pinned card — shows when a destination is selected */}
      {destination && !addStopMode && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{ background: 'oklch(93% 0.05 40)', border: '2px solid oklch(57% 0.14 40)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'oklch(57% 0.14 40)' }}>
            <span className="material-symbols-outlined text-xl" style={{ color: 'white', fontVariationSettings: "'FILL' 1" }}>flag</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>Bestemming</p>
            <p className="font-bold text-base text-on-surface leading-tight">{destination.name}</p>
          </div>
          <span className="text-[11px] font-semibold rounded-full px-2 py-1 flex-shrink-0" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>🚗 {destination.drive}</span>
          <button
            onClick={() => onSetDestination(null)}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.07)' }}
            aria-label="Bestemming wissen"
          >
            <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>close</span>
          </button>
        </div>
      )}

      {mainDestinationId && !addStopMode && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5" style={{ background: 'oklch(57% 0.14 40)', color: 'white' }}>Stap 2</span>
          <span className="text-[10px] font-semibold" style={{ color: '#A8937A' }}>Tussenstops toevoegen</span>
        </div>
      )}
      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>
        {addStopMode ? 'Extra stop toevoegen' : mainDestinationId ? 'Tussenstops kiezen' : 'Waar gaan jullie naartoe?'}
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">
        {addStopMode
          ? 'Kies een extra stop voor het plan.'
          : mainDestinationId
            ? `Stops op de route naar ${destination?.name ?? 'je bestemming'}`
            : 'Kies een bestemming — voeg dan tussenstops toe'
        }
      </p>

      {/* Category grid — 2×3, always fully visible */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {CATEGORIES.map(cat => {
          const todayMarkten = getTodayMarktdagen()
          const hasSelection = [...uitjes, ...todayMarkten].filter(cat.uitjeFilter).some(u => basketIds.includes(u.id) && u.id !== mainDestinationId)
          const hasMarkt = todayMarkten.filter(cat.uitjeFilter).length > 0
          const isActive = activeCatTab === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCatTab(cat.value)}
              className="relative rounded-2xl flex flex-col items-center gap-1.5 py-3 px-2 transition-all"
              style={{
                background: isActive ? `color-mix(in oklch, ${cat.color} 14%, white)` : '#FAF7F0',
                border: `2px solid ${isActive ? cat.color : '#E4D9C8'}`,
              }}
            >
              {hasMarkt && (
                <span className="absolute -top-1.5 -right-1.5 text-[7px] font-black px-1.5 py-0.5 rounded-lg z-10 leading-tight" style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}>MARKT!</span>
              )}
              {hasSelection && !hasMarkt && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: cat.color, color: 'white' }}>✓</span>
              )}
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: isActive ? cat.color : '#6B5A3E', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >{cat.icon}</span>
              <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: isActive ? cat.color : '#6B5A3E' }}>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Uitje cards */}
      <div className="flex flex-col gap-4 mb-5">
        {catUitjes.map(u => (
          <UitjeSelectCard
            key={u.id}
            uitje={u}
            inBasket={basketIds.includes(u.id)}
            isDestination={u.id === mainDestinationId}
            hasDestination={!!mainDestinationId}
            mainDestinationId={mainDestinationId}
            onSetDestination={onSetDestination}
            onToggleBasket={onToggleBasket}
            onOpenInfo={onOpenInfo}
            catColor={activeCat.color}
          />
        ))}
      </div>

      {/* Bottom buttons — sticky so they stay reachable in long lists */}
      {!addStopMode && mainDestinationId && (
        <div className="sticky bottom-24 pt-3" style={{ background: 'linear-gradient(to top, #F5EFE3 75%, transparent)' }}>
          <div className="flex flex-col gap-3 pb-4">
            <button
              onClick={onConfirm}
              className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2"
              style={{ background: 'oklch(57% 0.14 40)' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
              Maak dagplan
            </button>
            {onReset && (
              <button
                onClick={onReset}
                className="w-full rounded-2xl py-3 text-sm font-semibold"
                style={{ background: 'transparent', border: '2px solid #E4D9C8', color: '#A8937A' }}
              >
                Begin opnieuw
              </button>
            )}
          </div>
        </div>
      )}
      {addStopMode && (
        <div className="pb-4">
          <button
            onClick={onConfirm}
            className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2"
            style={{ background: 'oklch(57% 0.14 40)' }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Klaar — terug naar plan
          </button>
        </div>
      )}
    </div>
  )
}

function ConfirmPhase({
  basketIds,
  mainDestinationId,
  onConfirm,
  onBack,
  onReset,
  onOpenInfo,
}: {
  basketIds: string[]
  mainDestinationId: string | null
  onConfirm: (sortedIds: string[], destinationId: string | null) => void
  onBack: () => void
  onReset: () => void
  onOpenInfo: (id: string) => void
}) {
  const [destinationId, setDestinationId] = useState<string | null>(mainDestinationId)

  const allStops = basketIds.map(id => getUitjeById(id)).filter(Boolean) as Uitje[]
  const sortedStops = destinationId ? sortByRoute(allStops, destinationId) : allStops
  const sortedIds = sortedStops.map(u => u.id)
  const mapsUrl = buildGoogleMapsUrl(sortedIds)

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: 'oklch(57% 0.14 40)' }}>
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Stops aanpassen
      </button>

      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>Jouw dag</h2>
      <p className="text-xs text-on-surface-variant mb-4">
        {destinationId
          ? 'Stops zijn op route geordend. Tik op een andere stop om de bestemming te wijzigen.'
          : 'Tik op een stop om die als bestemming te kiezen — de andere stops worden dan op de route geordend.'
        }
      </p>

      {/* Route map */}
      {sortedStops.some(u => u.coords) && (
        <div
          className="rounded-2xl overflow-hidden mb-5 shadow-blue"
          style={{ height: 220, border: '1px solid #E4D9C8', isolation: 'isolate' }}
        >
          <DagRouteMap
            stops={sortedStops.map(u => ({
              name: u.name,
              coords: u.coords,
              isMainDest: u.id === destinationId,
            }))}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-3 px-1 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'oklch(92% 0.05 148)', border: '2px solid oklch(58% 0.10 148)' }}>🏠</div>
          <p className="text-sm font-semibold" style={{ color: 'oklch(40% 0.08 148)' }}>Les Escaliers des Combes (vertrek)</p>
        </div>

        {sortedStops.map((u, i) => {
          const isDest = u.id === destinationId
          const offRouteLabel = destinationId && !isDest ? getOffRouteLabel(u, destinationId) : null
          return (
            <button
              key={u.id}
              onClick={() => setDestinationId(prev => prev === u.id ? null : u.id)}
              className="rounded-2xl p-4 flex items-start gap-3 shadow-blue text-left w-full transition-all"
              style={{ background: isDest ? 'oklch(93% 0.05 40)' : '#FAF7F0', border: `2px solid ${isDest ? 'oklch(57% 0.14 40)' : '#E4D9C8'}` }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: isDest ? 'oklch(57% 0.14 40)' : '#E4D9C8', color: isDest ? 'white' : '#6B5A3E' }}>
                {isDest ? '📍' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <button onClick={e => { e.stopPropagation(); onOpenInfo(u.id) }} className="font-semibold text-on-surface text-left hover:underline">{u.name}</button>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-on-surface-variant">🚗 {u.drive}</span>
                  {u.id.startsWith('markt-') && <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5" style={{ background: 'oklch(79% 0.16 83)', color: 'white' }}>Markt!</span>}
                  {isDest && <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'oklch(57% 0.14 40)', color: 'white' }}>Bestemming</span>}
                  {offRouteLabel && (
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: offRouteLabel === 'Andere richting' ? '#FEF2F2' : 'oklch(92% 0.07 83)', color: offRouteLabel === 'Andere richting' ? '#DC2626' : 'oklch(45% 0.14 40)' }}>
                      {offRouteLabel === 'Andere richting' ? '↩' : '↗'} {offRouteLabel}
                    </span>
                  )}
                </div>
              </div>
              <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5" style={{ color: isDest ? 'oklch(57% 0.14 40)' : '#D4C4B0', fontVariationSettings: isDest ? "'FILL' 1" : "'FILL' 0" }}>flag</span>
            </button>
          )
        })}
        <div className="flex items-center gap-3 px-1 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'oklch(92% 0.05 148)', border: '2px solid oklch(58% 0.10 148)' }}>🏠</div>
          <p className="text-sm font-semibold" style={{ color: 'oklch(40% 0.08 148)' }}>Les Escaliers des Combes (thuiskomst)</p>
        </div>
      </div>

      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl p-3 mb-5 text-sm font-semibold" style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.3)', color: 'oklch(65% 0.10 218)' }}>
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
        Bekijk route alvast op kaart →
      </a>

      <div className="sticky bottom-24 pt-3" style={{ background: 'linear-gradient(to top, #F5EFE3 75%, transparent)' }}>
        <div className="flex flex-col gap-3 pb-4">
          <button onClick={() => onConfirm(sortedIds, destinationId)} className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2" style={{ background: 'oklch(57% 0.14 40)' }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
            Maak dagplan
          </button>
          <button onClick={onReset} className="w-full rounded-2xl py-3 text-sm font-semibold" style={{ background: 'transparent', border: '2px solid #E4D9C8', color: '#A8937A' }}>
            Opnieuw beginnen
          </button>
        </div>
      </div>
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
  onOpenInfo,
}: {
  plan: DayPlan
  onChange: (p: DayPlan) => void
  basketIds: string[]
  onConfirm: () => void
  onAddStop: () => void
  onReset: () => void
  onOpenInfo: (id: string) => void
}) {
  const moveStop = (i: number, dir: -1 | 1) => {
    const stops = [...plan.stops]
    const j = i + dir
    if (j < 0 || j >= stops.length) return
    ;[stops[i], stops[j]] = [stops[j], stops[i]]
    onChange({ ...plan, stops })
  }
  const removeStop = (i: number) => onChange({ ...plan, stops: plan.stops.filter((_, idx) => idx !== i) })

  return (
    <div>
      <h2 className="text-2xl mb-1 leading-tight" style={{ fontFamily: 'var(--font-hand)', color: '#2C2316' }}>Pas het plan aan</h2>
      <p className="text-xs text-on-surface-variant mb-4">Verwijder stops of pas de volgorde aan.</p>

      {/* Route map — key forces remount when stops change so markers stay in sync */}
      {plan.stops.some(s => s.coords) && (
        <div
          className="rounded-2xl overflow-hidden mb-5 shadow-blue"
          style={{ height: 220, border: '1px solid #E4D9C8', isolation: 'isolate' }}
        >
          <DagRouteMap
            key={plan.stops.map(s => s.name).join(',')}
            stops={plan.stops.map(s => ({
              name: s.name,
              coords: s.coords,
              isTip: s.isTip,
            }))}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 mb-5">
        {plan.stops.map((stop, i) => (
          <div key={i} className="rounded-2xl p-4 shadow-blue flex gap-3" style={{ background: stop.isTip ? 'oklch(95% 0.03 83)' : '#FAF7F0', border: `1px solid ${stop.isTip ? '#E4D9C8' : 'oklch(57% 0.14 40 / 0.2)'}`, opacity: stop.isTip ? 0.8 : 1 }}>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: '#F0E9DA' }}>
                <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>arrow_upward</span>
              </button>
              <button onClick={() => moveStop(i, 1)} disabled={i === plan.stops.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-30" style={{ background: '#F0E9DA' }}>
                <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>arrow_downward</span>
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 leading-none" style={{ background: stop.isTip ? '#A8937A' : 'oklch(57% 0.14 40)', color: 'white' }}>{i + 1}</span>
                {stop.isTip && <span className="text-[10px]" style={{ color: '#A8937A' }}>Tip onderweg</span>}
              </div>
              <button onClick={() => stop.uitjeId && onOpenInfo(stop.uitjeId)} className="font-semibold text-sm text-on-surface text-left">
                {stop.uitjeId ? <span className="hover:underline">{stop.name}</span> : stop.name}
              </button>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{stop.description}</p>
            </div>
            <button onClick={() => removeStop(i)} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#FEF2F2', color: '#EF4444' }}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>

      <button onClick={onAddStop} className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 mb-4" style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '2px dashed #E4D9C8' }}>
        <span className="material-symbols-outlined text-base">add</span>
        Voeg stop toe
      </button>

      <div className="sticky bottom-24 pt-3" style={{ background: 'linear-gradient(to top, #F5EFE3 75%, transparent)' }}>
        <div className="flex flex-col gap-3 pb-4">
          <button onClick={onConfirm} disabled={plan.stops.length === 0} className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'oklch(57% 0.14 40)' }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
            Bevestig als dagplan
          </button>
          <button onClick={onReset} className="w-full rounded-2xl py-3 text-sm font-semibold" style={{ background: 'transparent', border: '2px solid #E4D9C8', color: '#A8937A' }}>
            Opnieuw beginnen
          </button>
        </div>
      </div>
    </div>
  )
}

function DagplanView({
  dayPlan,
  basketIds,
  mainDestinationId,
  onAanpassen,
  onReset,
  onSluitAf,
  sluitDone,
  onOpenInfo,
}: {
  dayPlan: DayPlan
  basketIds: string[]
  mainDestinationId: string | null
  onAanpassen: () => void
  onReset: () => void
  onSluitAf: () => void
  sluitDone: boolean
  onOpenInfo: (id: string) => void
}) {
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60
  const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h + (m || 0) / 60 }
  const mainDestination = mainDestinationId ? getUitjeById(mainDestinationId) : null
  const baseCoords = getTodayBaseCoords()
  const totalStops = dayPlan.stops.length

  return (
    <div>
      {/* Hero destination card */}
      {mainDestination && (
        <div
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, oklch(50% 0.14 40), oklch(40% 0.12 35))' }}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Bestemming van vandaag</p>
          <h2 className="text-2xl font-medium leading-tight mb-2" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: 'white' }}>{mainDestination.name}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>🚗 {mainDestination.drive}</span>
            <a href={mainDestination.gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none' }}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", fontSize: 14 }}>near_me</span>
              Navigeer
            </a>
          </div>
        </div>
      )}

      {/* Plan actief badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: 'oklch(92% 0.05 148)', border: '1.5px solid oklch(58% 0.10 148 / 0.4)' }}>
          <span className="material-symbols-outlined text-sm" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1", fontSize: 14 }}>check_circle</span>
          <span className="text-xs font-bold" style={{ color: 'oklch(40% 0.10 148)' }}>Plan actief</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}>
          <span className="material-symbols-outlined text-sm" style={{ color: '#A8937A' }}>place</span>
          <span className="text-sm font-bold text-on-surface">{totalStops}</span>
          <span className="text-xs" style={{ color: '#A8937A' }}>stop{totalStops !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Route map */}
      {dayPlan.stops.some(s => s.coords) && (
        <div
          className="rounded-2xl overflow-hidden mb-4 shadow-blue"
          style={{ height: 220, border: '1px solid #E4D9C8', isolation: 'isolate' }}
        >
          <DagRouteMap
            stops={dayPlan.stops.map(s => ({
              name: s.name,
              coords: s.coords,
              isMainDest: s.uitjeId === mainDestinationId,
              isTip: s.isTip,
            }))}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Dagprogramma</div>
      <div className="relative mb-5" style={{ paddingLeft: 32 }}>
        <div className="absolute top-2 bottom-2 w-0.5 rounded-full" style={{ left: 12, background: '#E4D9C8' }} />

        {/* Vertrekpunt */}
        <div className="relative mb-2">
          <div className="absolute z-10" style={{ left: -22, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'oklch(58% 0.10 148)', border: '2.5px solid oklch(58% 0.10 148)' }} />
          <div className="rounded-2xl p-4" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.35)' }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: 'oklch(40% 0.08 148)' }}>🏠 Vertrek</p>
            <h3 className="font-bold text-sm" style={{ color: 'oklch(35% 0.08 148)' }}>Les Escaliers des Combes</h3>
          </div>
        </div>

        {dayPlan.stops.map((stop, i) => {
          const stopTime = parseTime(stop.time)
          const isNow = i < dayPlan.stops.length - 1
            ? currentHour >= stopTime && currentHour < parseTime(dayPlan.stops[i + 1].time)
            : currentHour >= stopTime
          const isTipStop = stop.isTip
          const hasInfo = !!stop.uitjeId
          const isMainDest = stop.uitjeId === mainDestinationId
          const prevCoords = i === 0 ? baseCoords : dayPlan.stops[i - 1].coords
          const travelMins = prevCoords && stop.coords ? estimateTravelMinutes(prevCoords, stop.coords) : null

          return (
            <div key={i}>
              <div className="relative mb-2">
                {/* Timeline dot */}
                <div
                  className="absolute z-10"
                  style={{
                    left: -22, top: 4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: isTipStop ? '#E4D9C8' : isNow ? 'oklch(79% 0.16 83)' : isMainDest ? 'oklch(57% 0.14 40)' : '#FAF7F0',
                    border: `2.5px solid ${isTipStop ? '#D4C4B0' : isNow ? 'oklch(79% 0.16 83)' : isMainDest ? 'oklch(57% 0.14 40)' : '#D4C4B0'}`,
                    boxShadow: isNow ? '0 0 0 4px oklch(79% 0.16 83 / 0.2)' : isMainDest ? '0 0 0 4px oklch(57% 0.14 40 / 0.2)' : 'none',
                  }}
                />
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: isTipStop ? 'oklch(96% 0.02 83)' : '#FAF7F0',
                    border: `1px solid ${isNow ? 'oklch(79% 0.16 83 / 0.5)' : isMainDest ? 'oklch(57% 0.14 40 / 0.3)' : '#E4D9C8'}`,
                    boxShadow: isNow ? '0 2px 12px oklch(79% 0.16 83 / 0.15)' : '0 1px 4px rgba(44,35,22,0.06)',
                    opacity: isTipStop ? 0.8 : 1,
                  }}
                >
                  {/* Travel time from previous stop, shown inside the card */}
                  {travelMins !== null && (
                    <div className="flex items-center gap-1 mb-2 pb-2" style={{ borderBottom: '1px solid #E4D9C8', opacity: 0.7 }}>
                      <span className="material-symbols-outlined" style={{ color: '#A8937A', fontSize: 13 }}>directions_car</span>
                      <span className="text-[11px] font-medium" style={{ color: '#A8937A' }}>{formatTravelTime(travelMins)} rijden</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    {isTipStop
                      ? <span className="text-[10px] font-semibold" style={{ color: '#A8937A' }}>💡 Tip</span>
                      : <span />
                    }
                    {hasInfo && (
                      <button onClick={() => onOpenInfo(stop.uitjeId!)} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F0E9DA' }} aria-label="Meer info">
                        <span className="material-symbols-outlined text-sm" style={{ color: '#6B5A3E' }}>info</span>
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: isMainDest ? 'oklch(57% 0.14 40)' : '#2C2316' }}>{stop.name}</h3>
                  {stop.description && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{stop.description}</p>}
                  {stop.tip && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'oklch(65% 0.10 218)' }}><span className="material-symbols-outlined text-xs">tips_and_updates</span>{stop.tip}</p>}
                  {stop.mapsUrl && (
                    <a href={stop.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: 13 }}>near_me</span>Navigeer
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Thuiskomst — travel time from last stop shown inside the card */}
        <div className="relative mb-4">
          <div className="absolute z-10" style={{ left: -22, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'oklch(58% 0.10 148)', border: '2.5px solid oklch(58% 0.10 148)' }} />
          <div className="rounded-2xl p-4" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.35)' }}>
            {dayPlan.stops.length > 0 && dayPlan.stops[dayPlan.stops.length - 1].coords && (() => {
              const lastCoords = dayPlan.stops[dayPlan.stops.length - 1].coords!
              const mins = estimateTravelMinutes(lastCoords, baseCoords)
              return (
                <div className="flex items-center gap-1 mb-2 pb-2" style={{ borderBottom: '1px solid oklch(58% 0.10 148 / 0.3)', opacity: 0.7 }}>
                  <span className="material-symbols-outlined" style={{ color: 'oklch(40% 0.08 148)', fontSize: 13 }}>directions_car</span>
                  <span className="text-[11px] font-medium" style={{ color: 'oklch(40% 0.08 148)' }}>{formatTravelTime(mins)} rijden</span>
                </div>
              )
            })()}
            <p className="text-xs font-bold mb-0.5" style={{ color: 'oklch(40% 0.08 148)' }}>🏠 Thuiskomst</p>
            <h3 className="font-bold text-sm" style={{ color: 'oklch(35% 0.08 148)' }}>Les Escaliers des Combes</h3>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <button
        onClick={onAanpassen}
        className="w-full rounded-2xl py-3.5 mb-2 text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: '#FAF7F0', border: '1.5px dashed #E4D9C8', color: '#6B5A3E' }}
      >
        <span className="material-symbols-outlined text-base">add_circle</span>
        Voeg stop toe / pas plan aan
      </button>

      <div className="flex gap-2 mb-4">
        <button onClick={onReset} className="flex-1 rounded-2xl py-2.5 text-xs font-semibold" style={{ border: '2px solid #E4D9C8', color: '#A8937A' }}>Opnieuw beginnen</button>
      </div>

      {sluitDone ? (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}>
          <span className="material-symbols-outlined" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-semibold" style={{ color: 'oklch(35% 0.08 148)' }}>Dag afgesloten — check het dagboek!</p>
          <a href="/dagboek" className="ml-auto text-xs font-semibold" style={{ color: 'oklch(58% 0.10 148)' }}>Dagboek →</a>
        </div>
      ) : (
        <button onClick={onSluitAf} className="w-full rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2" style={{ background: 'oklch(57% 0.14 40)', color: 'white', boxShadow: '0 4px 16px oklch(57% 0.14 40 / 0.35)' }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          Sluit dag af
        </button>
      )}
    </div>
  )
}

function UitjeInfoModal({ uitjeId, onClose }: { uitjeId: string; onClose: () => void }) {
  const uitje = getUitjeById(uitjeId)
  const [wikiExtract, setWikiExtract] = useState<string | null>(null)
  const [wikiLoading, setWikiLoading] = useState(false)

  useEffect(() => {
    setWikiExtract(null)
    if (!uitje?.wiki) return
    const match = uitje.wiki.match(/wikipedia\.org\/wiki\/(.+)$/)
    if (!match) return
    const title = match[1]
    const lang = uitje.wiki.includes('nl.wikipedia') ? 'nl' : 'en'
    setWikiLoading(true)
    fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.extract) setWikiExtract(data.extract) })
      .catch(() => {})
      .finally(() => setWikiLoading(false))
  }, [uitjeId])

  if (!uitje) return null

  const typeLabels: Record<string, string> = {
    culture: 'Cultuur & Dorpen', entertainment: 'Activiteiten', nature: 'Natuur',
    food: 'Eten & Drinken', shop: 'Winkelen', bakery: 'Bakker',
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(44,35,22,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl shadow-2xl overflow-y-auto" style={{ background: '#FAF7F0', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#D4C4B0' }} />
        </div>
        <div className="px-6 pb-10">
          <div className="flex items-start justify-between gap-3 mb-4 mt-2">
            <div className="flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>{typeLabels[uitje.type] ?? uitje.type}</span>
              <h2 className="text-2xl font-bold text-on-surface leading-tight mt-1" style={{ fontFamily: 'var(--font-hand)' }}>{uitje.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>🚗 {uitje.drive} vanuit Les Escaliers</span>
                {uitje.vegetarian && <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'oklch(92% 0.05 148)', color: 'oklch(40% 0.10 148)' }}>🌿 Vegetarisch</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F0E9DA', color: '#6B5A3E' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <p className="text-sm leading-relaxed text-on-surface mb-5">{uitje.desc}</p>

          {(wikiLoading || wikiExtract) && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>Wikipedia</span>
                {wikiLoading && <span className="material-symbols-outlined text-sm animate-spin" style={{ color: '#A8937A' }}>refresh</span>}
              </div>
              {wikiExtract && <p className="text-sm leading-relaxed text-on-surface">{wikiExtract}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {uitje.wiki && (
              <a href={uitje.wiki} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-sm" style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)' }}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                Lees meer op Wikipedia
                <span className="material-symbols-outlined text-base ml-auto">open_in_new</span>
              </a>
            )}
            {uitje.site && (
              <a href={uitje.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-sm" style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)' }}>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>language</span>
                Officiële website
                <span className="material-symbols-outlined text-base ml-auto">open_in_new</span>
              </a>
            )}
            <a href={uitje.gmaps} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-sm" style={{ background: 'oklch(92% 0.05 218)', color: 'oklch(65% 0.10 218)', border: '1px solid oklch(65% 0.10 218 / 0.2)' }}>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
              Navigeer in Google Maps
              <span className="material-symbols-outlined text-base ml-auto">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SluitDagAfModal({ date, followedPlan, setFollowedPlan, actualText, setActualText, moodEmoji, setMoodEmoji, saving, onSave, onClose }: {
  date: string; followedPlan: boolean | null; setFollowedPlan: (v: boolean) => void; actualText: string; setActualText: (v: string) => void
  moodEmoji: string | null; setMoodEmoji: (v: string) => void; saving: boolean; onSave: (photos: PhotoMeta[]) => void; onClose: () => void
}) {
  const { data: session } = useSession()
  const [story, setStory] = useState<string | null>(null)
  const [storyLoading, setStoryLoading] = useState(false)
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)

  useEffect(() => {
    if (!session?.accessToken) return
    setPhotosLoading(true)
    fetch(`/api/photos?date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPhotos(data)
          setSelectedPhotoIds(data.map((p: PhotoMeta) => p.id))
        }
      })
      .catch(() => {})
      .finally(() => setPhotosLoading(false))
  }, [session?.accessToken, date])

  const togglePhoto = (id: string) => {
    setSelectedPhotoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id))

  const generateStory = async () => {
    setStoryLoading(true)
    try {
      const res = await fetch('/api/diary-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, actual_text: actualText || 'We hebben een mooie dag gehad.', photos: selectedPhotos }),
      })
      if (res.ok) {
        const data = await res.json()
        setStory(data.story ?? data.content ?? null)
      }
    } catch { /* ignore */ }
    setStoryLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F5EFE3' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4" style={{ borderBottom: '1px solid #E4D9C8' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F0E9DA' }}>
          <span className="material-symbols-outlined text-lg" style={{ color: '#6B5A3E' }}>arrow_back</span>
        </button>
        <h3 className="text-xl font-semibold flex-1" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>Dag afsluiten</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-32">
        {/* Mood selector */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Stemming van de dag</p>
        <div className="flex gap-2 mb-5">
          {MOODS.map(m => (
            <button key={m.emoji} onClick={() => setMoodEmoji(m.emoji)} className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all"
              style={moodEmoji === m.emoji
                ? { background: 'oklch(92% 0.07 83)', border: '2px solid oklch(79% 0.16 83)', boxShadow: '0 2px 8px oklch(79% 0.16 83 / 0.3)' }
                : { background: '#FAF7F0', border: '2px solid transparent', boxShadow: '0 1px 4px rgba(44,35,22,0.06)' }}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[9px] font-semibold" style={{ color: moodEmoji === m.emoji ? '#6B5A3E' : '#A8937A' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Google Photos */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Foto's van vandaag</p>
        {!session?.accessToken ? (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'oklch(94% 0.04 75)', border: '1px solid oklch(57% 0.14 40 / 0.25)' }}>
            <span className="material-symbols-outlined text-xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>photo_library</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#2C2316' }}>Koppel Google Photos</p>
              <p className="text-xs text-on-surface-variant">Verbind je account om foto's van vandaag te zien.</p>
            </div>
            <button
              onClick={() => signIn('google', { callbackUrl: '/vandaag' }, { access_type: 'offline', prompt: 'consent' })}
              className="text-xs font-semibold rounded-full px-3 py-1.5 flex-shrink-0"
              style={{ background: 'oklch(57% 0.14 40)', color: 'white' }}
            >
              Verbinden
            </button>
          </div>
        ) : photosLoading ? (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-5 py-1">
            <span className="material-symbols-outlined text-base animate-spin">refresh</span>
            Foto's laden…
          </div>
        ) : photos.length === 0 ? (
          <p className="text-xs text-on-surface-variant mb-5">Geen foto's gevonden voor vandaag.</p>
        ) : (
          <div className="mb-5">
            <p className="text-xs text-on-surface-variant mb-2">{selectedPhotoIds.length}/{photos.length} geselecteerd</p>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map(p => {
                const isSelected = selectedPhotoIds.includes(p.id)
                return (
                  <button key={p.id} onClick={() => togglePhoto(p.id)} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={`${p.baseUrl}=w200-h200-c`} alt={p.filename} className="w-full h-full object-cover" style={{ opacity: isSelected ? 1 : 0.35 }} />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'oklch(57% 0.14 40)' }}>
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>check</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Followed plan? */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Hebben jullie het plan gevolgd?</p>
        <div className="flex gap-3 mb-4">
          {[{ val: true, label: '✓ Ja' }, { val: false, label: '✗ Nee, anders gelopen' }].map(opt => (
            <button key={String(opt.val)} onClick={() => setFollowedPlan(opt.val)} className="flex-1 rounded-2xl py-3 text-sm font-bold transition-all"
              style={followedPlan === opt.val
                ? { background: opt.val ? 'oklch(92% 0.05 148)' : 'oklch(93% 0.05 10)', color: opt.val ? 'oklch(40% 0.10 148)' : 'oklch(50% 0.11 10)', border: `2px solid ${opt.val ? 'oklch(58% 0.10 148)' : 'oklch(68% 0.11 10)'}` }
                : { background: '#FAF7F0', color: '#6B5A3E', border: '2px solid #E4D9C8' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {followedPlan === false && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#A8937A' }}>Wat hebben jullie gedaan?</p>
            <textarea value={actualText} onChange={e => setActualText(e.target.value)} placeholder="Schrijf kort wat er echt is gebeurd…" rows={4} className="w-full rounded-2xl p-4 text-sm resize-none focus:outline-none" style={{ background: '#FAF7F0', border: '1.5px solid #E4D9C8', color: '#2C2316', lineHeight: 1.5 }} />
          </div>
        )}

        {/* AI story */}
        {story ? (
          <div className="rounded-2xl p-5 mb-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, oklch(94% 0.04 75), oklch(96% 0.025 60))', border: '1px solid #E4D9C8' }}>
            <div className="absolute top-3 right-5 text-6xl leading-none" style={{ fontFamily: 'var(--font-journal)', color: 'oklch(57% 0.14 40)', opacity: 0.1 }}>"</div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm" style={{ color: 'oklch(79% 0.16 83)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A8937A' }}>Dagboekverhaal</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}>{story}</p>
            <p className="text-[9px] mt-3" style={{ color: '#A8937A' }}>Gegenereerd op basis van jouw aantekeningen</p>
          </div>
        ) : (
          <button onClick={generateStory} disabled={storyLoading} className="w-full rounded-2xl py-3.5 mb-4 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: '#F0E9DA', border: '1.5px dashed #E4D9C8', color: '#6B5A3E' }}>
            {storyLoading
              ? <><span className="material-symbols-outlined text-base animate-spin">refresh</span>Verhaal genereren…</>
              : <><span className="material-symbols-outlined text-base" style={{ color: 'oklch(79% 0.16 83)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Genereer dagboekverhaal</>
            }
          </button>
        )}
      </div>

      {/* Save button */}
      <div className="absolute bottom-0 inset-x-0 px-5 pb-10 pt-3" style={{ background: 'linear-gradient(to top, #F5EFE3 70%, transparent)' }}>
        <button onClick={() => onSave(selectedPhotos)} disabled={saving || followedPlan === null} className="w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'oklch(57% 0.14 40)', boxShadow: '0 4px 16px oklch(57% 0.14 40 / 0.35)' }}>
          {saving
            ? <><span className="material-symbols-outlined text-base animate-spin">refresh</span>Opslaan…</>
            : <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>Bewaar in dagboek</>
          }
        </button>
      </div>
    </div>
  )
}

function PlanMorgenSection({ tomorrowEntry, tomorrowPlan, basketIds, onToggleBasket, planning, onPlan, showWizard, onToggleWizard }: {
  tomorrowEntry: KalenderEntry | null; tomorrowPlan: DayPlan | null; basketIds: string[]
  onToggleBasket: (id: string) => void; planning: boolean; onPlan: () => void; showWizard: boolean; onToggleWizard: () => void
}) {
  const tomorrowIsReisdag = tomorrowEntry?.type === 'reisdag'
  return (
    <div className="mt-8 pt-6" style={{ borderTop: '2px dashed #E4D9C8' }}>
      <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}>Wat willen we morgen doen?</h3>
      {tomorrowIsReisdag && tomorrowEntry?.type === 'reisdag' && (
        <div className="rounded-2xl p-4" style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.2)' }}>
          <p className="font-semibold text-on-surface text-sm">🚗 Morgen is een reisdag</p>
          <p className="text-xs text-on-surface-variant mt-1">{(tomorrowEntry as Reisdag).van} → {(tomorrowEntry as Reisdag).naar} — {(tomorrowEntry as Reisdag).route}</p>
        </div>
      )}
      {!tomorrowIsReisdag && tomorrowPlan && (
        <div className="rounded-2xl p-4" style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}>
          <p className="text-sm font-semibold" style={{ color: 'oklch(40% 0.10 148)' }}>✓ Plan voor morgen staat al klaar!</p>
          <div className="mt-2">{tomorrowPlan.stops.slice(0, 3).map((s, i) => <p key={i} className="text-xs text-on-surface-variant">{s.time} — {s.name}</p>)}</div>
        </div>
      )}
      {!tomorrowIsReisdag && !tomorrowPlan && (
        <>
          <p className="text-sm text-on-surface-variant mb-4">Plan alvast de dag van morgen. Het staat klaar als jullie wakker worden.</p>
          <button onClick={onToggleWizard} className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2" style={{ background: '#F0E9DA', color: 'oklch(57% 0.14 40)', border: '2px solid #E4D9C8' }}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            {showWizard ? 'Sluit morgen-planner' : 'Plan morgen →'}
          </button>
          {showWizard && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>Kies uitjes voor morgen</p>
              <div className="flex flex-col gap-3 mb-4">
                {uitjes.filter(u => u.type !== 'bakery').slice(0, 6).map(u => (
                  <MiniUitjeCard key={u.id} uitje={u} inBasket={basketIds.includes(u.id)} onToggle={onToggleBasket} />
                ))}
              </div>
              {basketIds.length > 0 && (
                <button onClick={onPlan} disabled={planning} className="w-full rounded-2xl py-3 text-white font-semibold text-sm flex items-center justify-center gap-2" style={{ background: planning ? '#A8937A' : 'oklch(57% 0.14 40)' }}>
                  {planning ? <><span className="material-symbols-outlined text-sm animate-spin">refresh</span>Plan samenstellen…</> : <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Stel morgenplan samen ({basketIds.length} stop{basketIds.length > 1 ? 's' : ''})</>}
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
  const typeColors: Record<string, string> = { entertainment: 'oklch(79% 0.16 83)', culture: 'oklch(57% 0.14 40)', food: 'oklch(65% 0.09 298)', shop: 'oklch(65% 0.10 218)' }
  const typeIcons: Record<string, string> = { entertainment: 'attractions', culture: 'museum', food: 'restaurant', shop: 'shopping_cart' }
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
      <button onClick={() => onToggle(uitje.id)} className="rounded-full text-xs font-bold px-3 py-1.5 flex-shrink-0 transition-all" style={inBasket ? { background: 'oklch(57% 0.14 40)', color: 'white' } : { background: '#F0E9DA', color: '#6B5A3E' }}>
        {inBasket ? '✓' : '+'}
      </button>
    </div>
  )
}
