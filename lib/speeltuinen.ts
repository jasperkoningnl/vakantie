export interface Speeltuin {
  name: string
  coords: [number, number]
  gmaps: string
}

// Losse speeltuinen in de dorpskernen. Speelplekken die al als uitje bestaan
// (Plan d'eau des Chênes, Plan d'eau St-Sernin, Parc des Bords de l'Eure)
// staan hier bewust niet meer, om dubbele markers op de kaart te voorkomen.
export const speeltuinen: Speeltuin[] = [
  { name: "Aire de jeux Montcuq", coords: [44.337, 1.211], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Montcuq" },
  { name: "Aire de jeux Lauzerte", coords: [44.256, 1.137], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Lauzerte" },
  { name: "Aire de jeux Prayssac", coords: [44.505, 1.187], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Prayssac" },
  { name: "Aire de jeux Cahors centre", coords: [44.447, 1.442], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Cahors+centre" },
]
