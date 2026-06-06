import { getParisWeekdayName } from './date-utils'

export interface Marktdag {
  dag: string
  plaats: string
  omschrijving: string
  gmaps: string
}

export const marktdagen: Marktdag[] = [
  { dag: 'woensdag', plaats: 'Cahors', omschrijving: 'Grote overdekte markt + openluchtmarkt, groenten, kaas, lokale producten.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors' },
  { dag: 'zaterdag', plaats: 'Cahors', omschrijving: 'Nog grotere versie van de woensdagmarkt.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors' },
  { dag: 'zaterdag', plaats: 'Lauzerte', omschrijving: 'Sfeervolle dorpsmarkt op het centrale plein.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Lauzerte' },
  { dag: 'zondag', plaats: 'Montcuq', omschrijving: 'Gezellige zondagsmarkt, goed te combineren met lunch.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Montcuq' },
  { dag: 'vrijdag', plaats: 'Prayssac', omschrijving: 'Kleine maar leuke markt, te combineren met boodschappen bij Carrefour.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Prayssac' },
]

export function getTodaysMarkten(): Marktdag[] {
  const todayNaam = getParisWeekdayName()
  return marktdagen.filter(m => m.dag === todayNaam)
}
