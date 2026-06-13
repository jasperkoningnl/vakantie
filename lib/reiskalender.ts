import { getParisDateString } from './date-utils'

export type DagType = 'reisdag' | 'vakantie' | 'verblijf' | 'thuis'

export interface Reisdag {
  type: 'reisdag'
  label: string
  van: string
  naar: string
  route: string
}

export interface VakantieDay {
  type: 'vakantie'
  verblijf: string
  opmerking?: string
  coords: [number, number]
}

export interface VerblijfDay {
  type: 'verblijf'
  label: string
  verblijf: string
  coords: [number, number]
}

export type KalenderEntry = Reisdag | VakantieDay | VerblijfDay

// Eerste reisdag (heenreis). Alle kalenderdagen schuiven mee met deze datum;
// verschuift de vakantie, dan hoeft alleen deze constante aangepast te worden.
export const TRIP_START_DATE = '2026-06-12'

const KALENDER_DAGEN: KalenderEntry[] = [
  { type: 'reisdag', label: 'Heenreis dag 1', van: 'Amersfoort', naar: 'Atelier des Sens 89', route: 'Via Antwerpen, Reims, Auxerre' },
  { type: 'reisdag', label: 'Heenreis dag 2', van: 'Atelier des Sens 89', naar: 'Les Escaliers', route: 'Via Châteauroux, Cahors' },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Safaritent', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', opmerking: 'Verhuisdag naar Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'vakantie', verblijf: 'Gîte L', coords: [44.398, 1.119] },
  { type: 'reisdag', label: 'Terugreis dag 1', van: 'Les Escaliers', naar: 'Chartres', route: 'Via Limoges, Orléans' },
  { type: 'verblijf', label: 'Chartres', verblijf: 'Hotel Henri IV', coords: [48.447, 1.489] },
  { type: 'reisdag', label: 'Terugreis dag 3', van: 'Chartres', naar: 'Amersfoort', route: 'Via Amiens, Antwerpen' },
]

function addDaysToDateString(dateStr: string, days: number): string {
  const base = new Date(`${dateStr}T12:00:00Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

export const reiskalender: Record<string, KalenderEntry> = Object.fromEntries(
  KALENDER_DAGEN.map((entry, index) => [addDaysToDateString(TRIP_START_DATE, index), entry]),
)

/** Alle reisdatums (YYYY-MM-DD) in chronologische volgorde. */
export const tripDates: string[] = Object.keys(reiskalender)

export function getTodayEntry(): KalenderEntry | null {
  const today = getParisDateString()
  return reiskalender[today] ?? null
}

/** Coördinaten van de thuisbasis (Les Escaliers / Quercy). */
export const HOME_COORDS: [number, number] = [44.398, 1.119]

/** Verblijfplaats van vandaag; valt terug op de thuisbasis op reisdagen. */
export function getTodayBaseCoords(): [number, number] {
  const entry = getTodayEntry()
  if (entry && (entry.type === 'vakantie' || entry.type === 'verblijf')) return entry.coords
  return HOME_COORDS
}

/** Datum (YYYY-MM-DD) waarop de Chartres-etappe van de terugreis begint. */
const chartresStartDate = tripDates.find(date => {
  const entry = reiskalender[date]
  return entry.type === 'reisdag' && entry.naar.includes('Chartres')
})

/** True zodra de reis bij de Chartres-etappe is (27 juni e.v.); daarvóór niet relevant. */
export function isChartresPhase(): boolean {
  if (!chartresStartDate) return false
  return getParisDateString() >= chartresStartDate
}
