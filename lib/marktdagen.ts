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

const DAG_NR: Record<string, number> = {
  zondag: 0, maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4, vrijdag: 5, zaterdag: 6,
}

export function getTodaysMarkten(): Marktdag[] {
  const today = new Date().getDay()
  return marktdagen.filter(m => DAG_NR[m.dag] === today)
}
