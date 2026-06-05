export interface Speeltuin {
  name: string
  coords: [number, number]
  gmaps: string
}

export const speeltuinen: Speeltuin[] = [
  { name: "Aire de jeux Montcuq", coords: [44.337, 1.211], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Montcuq" },
  { name: "Aire de jeux Plan d'eau des Chênes", coords: [44.385, 1.140], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Plan+d'eau+des+Ch%C3%AAnes+Montaigu" },
  { name: "Aire de jeux Plan d'eau St Sernin", coords: [44.339, 1.208], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+plan+d'eau+Saint-Sernin+Montcuq" },
  { name: "Aire de jeux Lauzerte", coords: [44.256, 1.137], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Lauzerte" },
  { name: "Aire de jeux Prayssac", coords: [44.505, 1.187], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Prayssac" },
  { name: "Aire de jeux Cahors centre", coords: [44.447, 1.442], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Cahors+centre" },
  { name: "Parc des Bords de l'Eure (Chartres)", coords: [48.4430, 1.4850], gmaps: "https://www.google.com/maps/search/?api=1&query=aire+de+jeux+Parc+des+Bords+de+l'Eure+Chartres" },
]
