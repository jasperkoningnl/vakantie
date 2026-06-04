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
}

export interface VerblijfDay {
  type: 'verblijf'
  label: string
  verblijf: string
}

export type KalenderEntry = Reisdag | VakantieDay | VerblijfDay

export const reiskalender: Record<string, KalenderEntry> = {
  '2025-06-12': { type: 'reisdag', label: 'Heenreis dag 1', van: 'Amersfoort', naar: 'Atelier des Sens 89', route: 'Via Antwerpen, Reims, Auxerre' },
  '2025-06-13': { type: 'reisdag', label: 'Heenreis dag 2', van: 'Atelier des Sens 89', naar: 'Les Escaliers', route: 'Via Châteauroux, Cahors' },
  '2025-06-14': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-15': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-16': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-17': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-18': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-19': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-20': { type: 'vakantie', verblijf: 'Gîte L', opmerking: 'Verhuisdag naar Gîte L' },
  '2025-06-21': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-22': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-23': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-24': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-25': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-26': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-27': { type: 'reisdag', label: 'Terugreis dag 1', van: 'Les Escaliers', naar: 'Chartres', route: 'Via Limoges, Orléans' },
  '2025-06-28': { type: 'verblijf', label: 'Chartres', verblijf: 'Hotel Henri IV' },
  '2025-06-29': { type: 'reisdag', label: 'Terugreis dag 3', van: 'Chartres', naar: 'Amersfoort', route: 'Via Amiens, Antwerpen' },
}

export function getTodayEntry(): KalenderEntry | null {
  const today = new Date().toISOString().split('T')[0]
  return reiskalender[today] ?? null
}
