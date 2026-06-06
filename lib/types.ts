export interface WeatherData {
  current: {
    temperature_2m: number
    weathercode: number
  }
  daily: {
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
    precipitation_probability_max: number[]
    time: string[]
  }
}

export interface DiaryEntry {
  id?: string
  date: string
  plan_text?: string
  actual_text?: string
  mood_emoji?: string
  photos?: PhotoMeta[]
  story_text?: string
  created_at?: string
}

export interface PhotoMeta {
  id: string
  baseUrl: string
  filename: string
  mediaMetadata?: {
    creationTime: string
    width: string
    height: string
  }
}

export interface SafeArrival {
  id?: string
  leg: string
  timestamp: string
  message?: string
}

export interface DayPlanStop {
  time: string
  name: string
  description: string
  tip?: string
  mapsUrl?: string
  coords?: [number, number]
  isTip?: boolean
  uitjeId?: string
}

export interface DayPlan {
  stops: DayPlanStop[]
  checklist: string[]
  intro?: string
}

export interface Suggestion {
  id: string
  naam: string
  reden: string
}

export function wmoToDescription(code: number): string {
  if (code === 0) return 'Helder'
  if (code <= 3) return 'Licht bewolkt'
  if (code <= 48) return 'Mist'
  if (code <= 57) return 'Motregen'
  if (code <= 67) return 'Regen'
  if (code <= 77) return 'Sneeuw'
  if (code <= 82) return 'Buien'
  if (code <= 99) return 'Onweer'
  return 'Onbekend'
}

export function wmoToEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌧️'
  if (code <= 99) return '⛈️'
  return '🌤️'
}
