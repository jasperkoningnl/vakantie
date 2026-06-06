export const PARIS_TIME_ZONE = 'Europe/Paris'

export type ParisWeekdayName =
  | 'zondag'
  | 'maandag'
  | 'dinsdag'
  | 'woensdag'
  | 'donderdag'
  | 'vrijdag'
  | 'zaterdag'

function getParisDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find(part => part.type === 'year')?.value)
  const month = Number(parts.find(part => part.type === 'month')?.value)
  const day = Number(parts.find(part => part.type === 'day')?.value)

  return { year, month, day }
}

export function getParisDateString(dayOffset = 0, date = new Date()): string {
  const { year, month, day } = getParisDateParts(date)
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + dayOffset, 12))
  const shifted = getParisDateParts(shiftedDate)

  return [
    shifted.year,
    String(shifted.month).padStart(2, '0'),
    String(shifted.day).padStart(2, '0'),
  ].join('-')
}

export function getParisWeekdayName(date = new Date()): ParisWeekdayName {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: PARIS_TIME_ZONE,
    weekday: 'long',
  }).format(date).toLowerCase() as ParisWeekdayName
}

export function isAfterParisHour(hour: number, date = new Date()): boolean {
  const hourPart = new Intl.DateTimeFormat('en-GB', {
    timeZone: PARIS_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).find(part => part.type === 'hour')?.value

  return Number(hourPart) >= hour
}
