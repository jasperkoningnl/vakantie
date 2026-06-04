export function getWeatherInfo(code: number): { label: string; emoji: string } {
  const map: Record<number, { label: string; emoji: string }> = {
    0: { label: 'Heldere lucht', emoji: '☀️' },
    1: { label: 'Grotendeels helder', emoji: '🌤️' },
    2: { label: 'Deels bewolkt', emoji: '⛅' },
    3: { label: 'Bewolkt', emoji: '☁️' },
    45: { label: 'Mist', emoji: '🌫️' },
    48: { label: 'IJsmist', emoji: '🌫️' },
    51: { label: 'Lichte motregen', emoji: '🌦️' },
    53: { label: 'Motregen', emoji: '🌧️' },
    55: { label: 'Zware motregen', emoji: '🌧️' },
    61: { label: 'Lichte regen', emoji: '🌦️' },
    63: { label: 'Regen', emoji: '🌧️' },
    65: { label: 'Zware regen', emoji: '🌧️' },
    71: { label: 'Lichte sneeuw', emoji: '🌨️' },
    73: { label: 'Sneeuw', emoji: '❄️' },
    75: { label: 'Zware sneeuw', emoji: '❄️' },
    80: { label: 'Regenbuien', emoji: '🌦️' },
    81: { label: 'Buien', emoji: '🌧️' },
    82: { label: 'Zware buien', emoji: '⛈️' },
    95: { label: 'Onweer', emoji: '⛈️' },
    96: { label: 'Onweer met hagel', emoji: '⛈️' },
    99: { label: 'Zwaar onweer', emoji: '⛈️' },
  }
  return map[code] ?? { label: 'Onbekend', emoji: '🌡️' }
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...opts,
  })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
