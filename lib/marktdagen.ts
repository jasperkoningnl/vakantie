import { getParisWeekdayName } from './date-utils'
import type { UitjeType } from './uitjes'

export interface Marktdag {
  id: string
  dag: string
  plaats: string
  type: UitjeType
  desc: string
  coords: [number, number]
  gmaps: string
  vegetarian?: boolean
}

export const marktdagen: Marktdag[] = [
  { id: 'markt-cahors-wo', dag: 'woensdag', plaats: 'Cahors', type: 'food', desc: 'Grote overdekte markt + openluchtmarkt. Groenten, kaas, lokale producten.', coords: [44.449, 1.441], gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors', vegetarian: true },
  { id: 'markt-cahors-za', dag: 'zaterdag', plaats: 'Cahors', type: 'food', desc: 'Nog grotere versie van de woensdagmarkt.', coords: [44.449, 1.441], gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors', vegetarian: true },
  { id: 'markt-lauzerte', dag: 'zaterdag', plaats: 'Lauzerte', type: 'food', desc: 'Sfeervolle dorpsmarkt op het centrale plein.', coords: [44.257, 1.139], gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Lauzerte', vegetarian: true },
  { id: 'markt-montcuq', dag: 'zondag', plaats: 'Montcuq', type: 'food', desc: 'Gezellige zondagsmarkt, goed te combineren met lunch.', coords: [44.338, 1.210], gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Montcuq', vegetarian: true },
  { id: 'markt-prayssac', dag: 'vrijdag', plaats: 'Prayssac', type: 'shop', desc: 'Kleine maar leuke markt, te combineren met Carrefour.', coords: [44.506, 1.176], gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Prayssac', vegetarian: true },
]

export function getTodaysMarkten(): Marktdag[] {
  const todayNaam = getParisWeekdayName()
  return marktdagen.filter(m => m.dag === todayNaam)
}
