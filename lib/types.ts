export interface DiaryEntry {
  id: string
  date: string
  plan_text: string | null
  actual_text: string | null
  created_at?: string
}

export interface StatusUpdate {
  id: string
  message: string
  type: 'arrived' | 'update'
  created_at: string
}

export interface WeatherCurrent {
  temperature_2m: number
  apparent_temperature: number
  weathercode: number
  windspeed_10m: number
  precipitation_probability: number
  relativehumidity_2m: number
}

export interface WeatherDaily {
  time: string[]
  weathercode: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
}

export interface WeatherResponse {
  current: WeatherCurrent
  daily: WeatherDaily
}
