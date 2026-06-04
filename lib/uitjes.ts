export type UitjeType = 'entertainment' | 'culture' | 'food' | 'shop'

export interface Uitje {
  id: string
  type: UitjeType
  name: string
  desc: string
  drive: string
  coords: [number, number]
  vegetarian?: boolean
  wiki?: string
  site?: string
  gmaps: string
}

export const uitjes: Uitje[] = [
  { id: 'u1', type: 'entertainment', name: "Plan d'Eau des Chênes", desc: "Recreatiemeer met veilig zandstrandje, ideaal voor Lena.", drive: "15 min", coords: [44.385, 1.140], wiki: "https://fr.wikipedia.org/wiki/Montaigu-de-Quercy", gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'Eau+des+Chênes+Montaigu-de-Quercy" },
  { id: 'u2', type: 'entertainment', name: "Parc en Ciel", desc: "Natuurpark met klimparcours en zwemvijver.", drive: "45 min", coords: [44.628, 0.872], wiki: "https://fr.wikipedia.org/wiki/Biron_(Dordogne)", gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+en+Ciel+Biron" },
  { id: 'u6', type: 'entertainment', name: "La Forêt des Singes", desc: "Apenbos waar makaken vrij rondlopen, geweldig voor kleuters.", drive: "1u 20m", coords: [44.805, 1.623], wiki: "https://fr.wikipedia.org/wiki/La_For%C3%AAt_des_singes_(Rocamadour)", site: "https://www.la-foret-des-singes.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=La+Forêt+des+Singes+Rocamadour" },
  { id: 'u13', type: 'entertainment', name: "Walygator Sud-Ouest", desc: "Groot pretpark met kindergedeelte.", drive: "1u 15m", coords: [44.185, 0.575], site: "https://www.walygatorparc.com/sudouest/", gmaps: "https://www.google.com/maps/search/?api=1&query=Walygator+Sud-Ouest" },
  { id: 'u14', type: 'entertainment', name: "Animaparc Occitanie", desc: "Dierenpark, dinobos én pretpark in één. Perfect voor jonge kinderen.", drive: "1u 30m", coords: [43.738, 1.082], site: "https://www.animaparc.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Animaparc+Occitanie" },
  { id: 'u3', type: 'culture', name: "Kasteel van Bonaguil", desc: "Indrukwekkende kasteelruïne in een groene vallei.", drive: "25 min", coords: [44.538, 1.011], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Bonaguil", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Bonaguil" },
  { id: 'u4', type: 'culture', name: "Cahors", desc: "Historische stad met de beroemde brug Pont Valentré.", drive: "45 min", coords: [44.447, 1.442], wiki: "https://nl.wikipedia.org/wiki/Cahors", gmaps: "https://www.google.com/maps/search/?api=1&query=Cahors" },
  { id: 'u5', type: 'culture', name: "Saint-Cirq-Lapopie", desc: "Een van de mooiste middeleeuwse dorpjes van Frankrijk.", drive: "1u 10m", coords: [44.464, 1.670], wiki: "https://nl.wikipedia.org/wiki/Saint-Cirq-Lapopie", gmaps: "https://www.google.com/maps/search/?api=1&query=Saint-Cirq-Lapopie" },
  { id: 'u16', type: 'culture', name: "Musée de l'Insolite", desc: "Eigenzinnig museum vol bizarre objecten in Cabrerets.", drive: "1u 10m", coords: [44.505, 1.654], gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+de+l'Insolite+Cabrerets" },
  { id: 'u20', type: 'culture', name: "Grotte de Pech-Merle", desc: "Prehistorische grotschilderingen van 25.000 jaar oud. Echte kunst in een echte grot, indrukwekkend voor alle leeftijden.", drive: "1u 10m", coords: [44.508, 1.638], wiki: "https://nl.wikipedia.org/wiki/Pech_Merle", site: "https://pechmerle.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Grotte+du+Pech-Merle" },
  { id: 'u21', type: 'culture', name: "Gouffre de Padirac", desc: "Ondergrondse rondvaart door een spectaculaire grot, 103 meter diep. Avontuurlijk voor kleuters.", drive: "1u 30m", coords: [44.858, 1.748], wiki: "https://nl.wikipedia.org/wiki/Gouffre_de_Padirac", site: "https://www.gouffre-de-padirac.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Gouffre+de+Padirac" },
  { id: 'u17', type: 'culture', name: "Cathédrale de Chartres", desc: "Gotische kathedraal, UNESCO-werelderfgoed. Beroemde gebrandschilderde ramen.", drive: "5 min lopen", coords: [48.4478, 1.4877], wiki: "https://nl.wikipedia.org/wiki/Kathedraal_van_Chartres", gmaps: "https://www.google.com/maps/search/?api=1&query=Cathédrale+de+Chartres" },
  { id: 'u18', type: 'culture', name: "Chartres en Lumières", desc: "Avondlichtshows op historische gebouwen. Gratis, spectaculair. Start bij zonsondergang.", drive: "5 min lopen", coords: [48.4470, 1.4880], gmaps: "https://www.google.com/maps/search/?api=1&query=Chartres+en+Lumières" },
  { id: 'u19', type: 'entertainment', name: "Parc des Bords de l'Eure", desc: "Mooi park langs de rivier, speeltuin aanwezig. Lekker voor Lena na een dag in de auto.", drive: "10 min lopen", coords: [48.4430, 1.4850], gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+des+Bords+de+l'Eure+Chartres" },
  { id: 'u7', type: 'food', vegetarian: true, name: "L'Estaminet", desc: "Informeel eten aan een autovrij plein in Lauzerte. Vegetarische opties aanwezig.", drive: "25 min", coords: [44.256, 1.137], wiki: "https://nl.wikipedia.org/wiki/Lauzerte", gmaps: "https://www.google.com/maps/search/?api=1&query=L'Estaminet+Lauzerte" },
  { id: 'u8', type: 'food', vegetarian: true, name: "Le Petit Rapporteur", desc: "Ongedwongen sfeer in Montcuq, vegetariersvriendelijk.", drive: "20 min", coords: [44.339, 1.208], wiki: "https://nl.wikipedia.org/wiki/Montcuq", gmaps: "https://www.google.com/maps/search/?api=1&query=Le+Petit+Rapporteur+Montcuq", site: "https://www.lepetitrapporteur-montcuq.com/" },
  { id: 'u9', type: 'food', name: "Pizzeria La Dolce Vita", desc: "Makkelijk met kinderen in Montaigu-de-Quercy.", drive: "15 min", coords: [44.339, 1.018], gmaps: "https://www.google.com/maps/search/?api=1&query=Pizzeria+La+Dolce+Vita+Montaigu-de-Quercy" },
  { id: 'u10', type: 'food', name: "Le Café du Centre", desc: "Gezellig terras in Tournon-d'Agenais.", drive: "20 min", coords: [44.399, 0.995], gmaps: "https://www.google.com/maps/search/?api=1&query=Le+Café+du+Centre+Tournon-d'Agenais" },
  { id: 'u11', type: 'shop', name: "Intermarché Montaigu", desc: "Grote supermarkt, dichtbij.", drive: "15 min", coords: [44.341, 1.015], gmaps: "https://www.google.com/maps/search/?api=1&query=Intermarché+Montaigu-de-Quercy" },
  { id: 'u12', type: 'shop', name: "Carrefour Prayssac", desc: "Grote supermarkt in Prayssac.", drive: "25 min", coords: [44.505, 1.187], gmaps: "https://www.google.com/maps/search/?api=1&query=Carrefour+Prayssac" },
]

export function getUitjeById(id: string): Uitje | undefined {
  return uitjes.find(u => u.id === id)
}
