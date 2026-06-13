import { getTodaysMarkten } from './marktdagen'

export type UitjeType = 'entertainment' | 'nature' | 'culture' | 'food' | 'shop' | 'bakery'

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
  lena?: boolean
  region?: string
}

export const uitjes: Uitje[] = [
  // ===== ENTERTAINMENT / KINDEREN =====
  { id: 'u2', type: 'entertainment', name: "Parc en Ciel", desc: "Natuurpark met klimparcours en zwemvijver. Klimparcours vanaf ca. 130cm.", drive: "45 min", coords: [44.595, 0.892], wiki: "https://en.wikipedia.org/wiki/Biron,_Dordogne", site: "https://www.parcenciel.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+en+Ciel+Lacapelle-Biron", lena: true },
  { id: 'u6', type: 'entertainment', name: "La Forêt des Singes", desc: "Apenbos waar makaken vrij rondlopen. Geweldig voor kleuters. Speelplaats aan het eind.", drive: "1u 20m", coords: [44.804, 1.633], wiki: "https://nl.wikipedia.org/wiki/Rocamadour", site: "https://www.la-foret-des-singes.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=La+Forêt+des+Singes+Rocamadour", lena: true },
  { id: 'u14', type: 'entertainment', name: "Animaparc", desc: "Dierenpark, dinobos én pretpark in één. Perfect voor jonge kinderen. Alleen weekend open.", drive: "1u 30m", coords: [43.787, 1.132], site: "https://www.animaparc.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Animaparc+Le+Burgaud", lena: true },
  { id: 'u29', type: 'entertainment', name: "Ferme Pédagogique Saint-Martin", desc: "Boerderij op een heuvel. Dieren voeren, groententuin, labyrint en buitenspellen. Reserveren aanbevolen.", drive: "50 min", coords: [44.195, 1.312], site: "https://lafermesaintmartin.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Ferme+Pédagogique+Saint-Martin+Labarthe", lena: true },
  { id: 'u30', type: 'entertainment', name: "Au Clair de la Brune", desc: "Kaasboerderij bij Montcuq. Bruine koeien bekijken, proeven, leren over kaas.", drive: "20 min", coords: [44.354, 1.202], site: "https://www.auclair-delabrune.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Au+Clair+de+la+Brune+Montcuq", lena: true },
  { id: 'u31', type: 'entertainment', name: "Reptiland", desc: "Reptielenzoo bij Martel. Slangen, hagedissen, schildpadden. Gesloten op maandag.", drive: "1u 40m", coords: [44.931, 1.617], site: "https://www.reptiland.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Reptiland+Martel", lena: true },
  { id: 'u32', type: 'entertainment', name: "Le Truffadou", desc: "Stoomtreintje langs kliffen van de Dordogne, 80m boven de rivier. 1 uur heen en terug. Onder 4 gratis.", drive: "1u 40m", coords: [44.934, 1.609], site: "https://www.trainduhautquercy.info/", gmaps: "https://www.google.com/maps/search/?api=1&query=Chemin+de+fer+touristique+Haut+Quercy+Martel", lena: true },

  // ===== CULTUUR =====
  { id: 'u3', type: 'culture', name: "Kasteel van Bonaguil", desc: "Indrukwekkende kasteelruïne in een groene vallei. Goed bewegwijzerd, info in het Engels.", drive: "25 min", coords: [44.538, 1.014], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Bonaguil", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Bonaguil" },
  { id: 'u4', type: 'culture', name: "Cahors", desc: "Historische stad met de beroemde brug Pont Valentré. Overdekte markt op wo en za.", drive: "40 min", coords: [44.449, 1.441], wiki: "https://nl.wikipedia.org/wiki/Cahors", gmaps: "https://www.google.com/maps/search/?api=1&query=Cahors+Pont+Valentré" },
  { id: 'u5', type: 'culture', name: "Saint-Cirq-Lapopie", desc: "Een van de mooiste middeleeuwse dorpjes van Frankrijk. Hoog boven het Lot-dal.", drive: "1u", coords: [44.465, 1.669], wiki: "https://nl.wikipedia.org/wiki/Saint-Cirq-Lapopie", gmaps: "https://www.google.com/maps/search/?api=1&query=Saint-Cirq-Lapopie" },
  { id: 'u16', type: 'culture', name: "Musée de l'Insolite", desc: "Eigenzinnig museum vol bizarre objecten, gemaakt door een excentrieke oude man. €4 entree.", drive: "1u 10m", coords: [44.522, 1.677], gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+de+l'Insolite+Orniac" },
  { id: 'u20', type: 'culture', name: "Grotte de Pech-Merle", desc: "Prehistorische grotschilderingen van 25.000 jaar oud. Echte kunst in een echte grot. Reserveren verplicht, max 700 bezoekers/dag.", drive: "1u 10m", coords: [44.508, 1.644], wiki: "https://nl.wikipedia.org/wiki/Pech_Merle", site: "https://pechmerle.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Grotte+du+Pech-Merle+Cabrerets" },
  { id: 'u21', type: 'culture', name: "Gouffre de Padirac", desc: "Ondergrondse rondvaart door een spectaculaire grot, 103 meter diep. Reserveren aanbevolen.", drive: "1u 30m", coords: [44.858, 1.750], wiki: "https://nl.wikipedia.org/wiki/Gouffre_de_Padirac", site: "https://www.gouffre-de-padirac.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Gouffre+de+Padirac" },
  { id: 'u24', type: 'culture', name: "La Planète des Moulins", desc: "Interactief molenmuseum in Luzech. Maquettes in beweging. Plan 2 uur. Gesloten in weekend.", drive: "35 min", coords: [44.479, 1.286], site: "https://www.planetedesmoulins.org/", gmaps: "https://www.google.com/maps/search/?api=1&query=Planète+des+Moulins+Luzech" },
  { id: 'u25', type: 'culture', name: "Rocamadour", desc: "Spectaculair klifdorp, UNESCO-erfgoed. Parkeer bovenaan, loop naar beneden. Geen buggy mogelijk (200+ treden).", drive: "1u 20m", coords: [44.799, 1.618], wiki: "https://nl.wikipedia.org/wiki/Rocamadour", gmaps: "https://www.google.com/maps/search/?api=1&query=Rocamadour" },
  { id: 'u26', type: 'culture', name: "Figeac — Musée Champollion", desc: "Museum over de geschiedenis van het schrift. Geboortehuis van de ontcijferaar van de hiëroglyfen. Gesloten op maandag.", drive: "1u 30m", coords: [44.610, 2.034], wiki: "https://nl.wikipedia.org/wiki/Figeac", gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+Champollion+Figeac" },
  { id: 'u27', type: 'culture', name: "Château de Castelnau-Bretenoux", desc: "Imposant rood kasteel op een heuvel. Panorama over drie valleien. Mooie meubels binnen.", drive: "1u 45m", coords: [44.898, 1.826], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Castelnau-Bretenoux", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Castelnau-Bretenoux" },
  { id: 'u28', type: 'culture', name: "Lauzerte", desc: "Middeleeuws bastidedorp op een heuveltop. Smalle steegjes, panoramisch uitzicht, gezellig plein.", drive: "20 min", coords: [44.257, 1.139], wiki: "https://nl.wikipedia.org/wiki/Lauzerte", gmaps: "https://www.google.com/maps/search/?api=1&query=Lauzerte" },

  // ===== NATUUR =====
  { id: 'u1', type: 'nature', name: "Plan d'Eau des Chênes", desc: "Recreatiemeer met zandig strandje, picknickplek en speeltuin. Ideaal voor Lena.", drive: "15 min", coords: [44.335, 1.034], wiki: "https://nl.wikipedia.org/wiki/Montaigu-de-Quercy", gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'Eau+des+Chênes+Montaigu-de-Quercy", lena: true },
  { id: 'u22', type: 'nature', name: "Plan d'eau de Saint-Sernin", desc: "Turkooisblauw meer bij Montcuq met strandje, barbecue, picknickplek en speeltuin.", drive: "20 min", coords: [44.339, 1.208], gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'eau+Saint-Sernin+Montcuq", lena: true },
  { id: 'u23', type: 'nature', name: "Cascade d'Autoire", desc: "Waterval van 30 meter. Makkelijke wandeling van een uur. Steil pad, goede schoenen nodig.", drive: "1u 40m", coords: [44.845, 1.810], wiki: "https://nl.wikipedia.org/wiki/Autoire", gmaps: "https://www.google.com/maps/search/?api=1&query=Cascade+Autoire+Lot", lena: true },
  { id: 'u54', type: 'nature', name: "Plan d'eau de Catus", desc: "Base de loisirs met zwemmeer, zandstrand, speeltuin en snackbar. In de zomer bewaakt zwemmen.", drive: "40 min", coords: [44.567, 1.328], gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'eau+de+Catus", lena: true },

  // ===== ETEN =====
  { id: 'u7', type: 'food', vegetarian: true, name: "Restaurant L'Etincelle", desc: "Restaurant op Place des Cornières in Lauzerte. Vegetarische opties. Gesloten ma en di.", drive: "20 min", coords: [44.257, 1.139], gmaps: "https://www.google.com/maps/search/?api=1&query=Restaurant+l'Etincelle+Lauzerte" },
  { id: 'u9', type: 'food', name: "Café du Centre Montcuq", desc: "Gezellig terras op het dorpsplein van Montcuq. Goed dagmenu. 4.5 sterren.", drive: "15 min", coords: [44.338, 1.210], gmaps: "https://www.google.com/maps/search/?api=1&query=Café+du+Centre+Montcuq" },
  { id: 'u45', type: 'food', vegetarian: true, name: "Auberge du Brelan", desc: "Sfeervolle auberge in een eikenbos bij Anthé. Houtgestookte keuken met compleet vegetarisch menu en glutenvrije opties. Mooi uitzicht. Gesloten ma, di en zo-avond.", drive: "25 min", coords: [44.403, 0.948], site: "https://www.aubergedubrelan.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Auberge+du+Brelan+Anthé" },
  { id: 'u46', type: 'food', name: "Le Midi", desc: "Dorpsrestaurant in het centrum van Montaigu-de-Quercy. Eenvoudige Franse keuken, vlakbij Les Escaliers.", drive: "10 min", coords: [44.339, 1.018], gmaps: "https://www.google.com/maps/search/?api=1&query=Restaurant+Le+Midi+Montaigu-de-Quercy" },
  { id: 'u47', type: 'food', name: "La Table du Belvédère", desc: "Restaurant met panoramaterras in het hooggelegen Lauzerte. Mooi uitzicht over het Quercy-landschap.", drive: "20 min", coords: [44.257, 1.140], gmaps: "https://www.google.com/maps/search/?api=1&query=La+Table+du+Belvédère+Lauzerte" },

  // ===== BOODSCHAPPEN =====
  { id: 'u11', type: 'shop', name: "Intermarché Montaigu", desc: "Supermarkt met tankstation (24/7). Dichtbij Les Escaliers.", drive: "10 min", coords: [44.337, 1.019], gmaps: "https://www.google.com/maps/search/?api=1&query=Intermarché+Montaigu-de-Quercy" },
  { id: 'u12', type: 'shop', name: "Carrefour Market Prayssac", desc: "Grote supermarkt, goed gesorteerd. Overdekte parkeerplaats.", drive: "30 min", coords: [44.506, 1.176], gmaps: "https://www.google.com/maps/search/?api=1&query=Carrefour+Market+Prayssac" },
  { id: 'u48', type: 'shop', name: "Carrefour Contact Montcuq", desc: "Supermarkt aan de rand van Montcuq (ZA Moulin de Pleysse). Handig voor de dagelijkse boodschappen.", drive: "15 min", coords: [44.346, 1.214], gmaps: "https://www.google.com/maps/search/?api=1&query=Carrefour+Contact+Montcuq" },
  { id: 'u49', type: 'shop', name: "Intermarché Lauzerte", desc: "Supermarkt met drive bij Lauzerte (Aulery). Ruime keuze.", drive: "20 min", coords: [44.255, 1.150], gmaps: "https://www.google.com/maps/search/?api=1&query=Intermarché+Lauzerte+Aulery" },
  { id: 'u50', type: 'shop', name: "E.Leclerc Cahors (Pradines)", desc: "Grote hypermarkt net buiten Cahors in Pradines. Het ruimste assortiment in de omgeving.", drive: "40 min", coords: [44.489, 1.402], gmaps: "https://www.google.com/maps/search/?api=1&query=E.Leclerc+Cahors+Pradines" },

  // ===== BAKKERTJES =====
  { id: 'u33', type: 'bakery', name: "Chez Mado", desc: "Ambachtelijke bakkerij in Montcuq. Vers brood, croissants, quiches en pizza's.", drive: "15 min", coords: [44.338, 1.209], gmaps: "https://www.google.com/maps/search/?api=1&query=Chez+Mado+boulangerie+Montcuq" },
  { id: 'u34', type: 'bakery', name: "Maison Petersen", desc: "Nieuwe bakker in Montcuq (sinds 2023). Artisanaal brood en gebak.", drive: "15 min", coords: [44.337, 1.210], gmaps: "https://www.google.com/maps/search/?api=1&query=Maison+Petersen+Montcuq" },
  { id: 'u35', type: 'bakery', name: "Pain et Chocolat", desc: "Bakkerij in Lauzerte.", drive: "20 min", coords: [44.256, 1.136], gmaps: "https://www.google.com/maps/search/?api=1&query=Pain+et+Chocolat+Lauzerte" },
  { id: 'u36', type: 'bakery', name: "Boulangerie Larroque", desc: "Traditionele dorpsbakker in de Rue des Tanneurs in Lauzerte.", drive: "20 min", coords: [44.255, 1.138], gmaps: "https://www.google.com/maps/search/?api=1&query=Boulangerie+Larroque+Lauzerte" },
  { id: 'u37', type: 'bakery', name: "Du Quercy Vert", desc: "Bakkerij in Montaigu-de-Quercy. Dichtbij Les Escaliers.", drive: "10 min", coords: [44.339, 1.018], gmaps: "https://www.google.com/maps/search/?api=1&query=Du+Quercy+Vert+Montaigu-de-Quercy" },

  // ===== CHARTRES (alleen tonen op 28 juni) =====
  { id: 'u17', type: 'culture', name: "Cathédrale de Chartres", desc: "Gotische kathedraal, UNESCO-werelderfgoed. Beroemde gebrandschilderde ramen. Gratis entree.", drive: "5 min lopen", coords: [48.448, 1.488], wiki: "https://nl.wikipedia.org/wiki/Kathedraal_van_Chartres", gmaps: "https://www.google.com/maps/search/?api=1&query=Cathédrale+de+Chartres", region: "chartres" },
  { id: 'u18', type: 'culture', name: "Chartres en Lumières", desc: "Avondlichtshows op historische gebouwen. Gratis, april t/m oktober, vanaf zonsondergang.", drive: "5 min lopen", coords: [48.447, 1.488], gmaps: "https://www.google.com/maps/search/?api=1&query=Chartres+en+Lumières", region: "chartres" },
  { id: 'u19', type: 'entertainment', name: "Parc des Bords de l'Eure", desc: "Park langs de rivier met speeltuin. Lekker voor Lena na een dag in de auto.", drive: "10 min lopen", coords: [48.443, 1.485], gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+des+Bords+de+l'Eure+Chartres", lena: true, region: "chartres" },
  { id: 'u40', type: 'culture', name: "Maison Picassiette", desc: "Huis volledig bedekt met mozaïek van gebroken servies. Bizar en fascinerend.", drive: "10 min lopen", coords: [48.453, 1.503], wiki: "https://nl.wikipedia.org/wiki/Maison_Picassiette", gmaps: "https://www.google.com/maps/search/?api=1&query=Maison+Picassiette+Chartres", region: "chartres" },
  { id: 'u42', type: 'culture', name: "Château de Maintenon", desc: "Kasteel met tuinen van Le Nôtre. Ruïnes van het aquaduct van Lodewijk XIV.", drive: "20 min", coords: [48.587, 1.579], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Maintenon", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Maintenon", region: "chartres" },
  { id: 'u43', type: 'entertainment', name: "L'Odyssée Chartres", desc: "Zwembad met glijbanen en buitenbad. Perfect voor een regenachtige dag.", drive: "10 min", coords: [48.441, 1.512], gmaps: "https://www.google.com/maps/search/?api=1&query=L'Odyssée+centre+aquatique+Chartres", region: "chartres" },
  { id: 'u44', type: 'bakery', name: "David Lambert Chocolatier", desc: "Lokale chocolatier. De 'Vitrail de Chartres' (meringue met praline) is de specialiteit.", drive: "5 min lopen", coords: [48.447, 1.489], gmaps: "https://www.google.com/maps/search/?api=1&query=David+Lambert+chocolatier+Chartres", region: "chartres" },
  { id: 'u51', type: 'culture', name: "Centre International du Vitrail", desc: "Het enige museum in Frankrijk gewijd aan glas-in-lood, 100 m van de kathedraal. Grootste collectie renaissance-glas-in-lood van het land.", drive: "5 min lopen", coords: [48.4485, 1.4878], site: "https://www.centre-vitrail.org/", gmaps: "https://www.google.com/maps/search/?api=1&query=Centre+International+du+Vitrail+Chartres", region: "chartres" },
  { id: 'u52', type: 'food', name: "Le Café Serpente", desc: "Sfeervolle brasserie recht tegenover de kathedraal. Klassieke Franse gerechten, populair bij locals.", drive: "5 min lopen", coords: [48.4470, 1.4885], gmaps: "https://www.google.com/maps/search/?api=1&query=Le+Café+Serpente+Chartres", region: "chartres" },
  { id: 'u53', type: 'food', name: "L'Esprit Gourmand", desc: "Verfijnde Franse keuken in een warm interieur, vlakbij de kathedraal in de oude stad.", drive: "5 min lopen", coords: [48.4465, 1.4892], gmaps: "https://www.google.com/maps/search/?api=1&query=L'Esprit+Gourmand+Chartres", region: "chartres" },
]

const MARKT_DRIVE: Record<string, string> = {
  'Cahors': '40 min',
  'Lauzerte': '20 min',
  'Montcuq': '15 min',
  'Prayssac': '30 min',
}

export function getTodayMarktdagen(): Uitje[] {
  return getTodaysMarkten().map(m => ({
    id: m.id,
    type: m.type as UitjeType,
    name: `Markt ${m.plaats}`,
    desc: m.desc,
    drive: MARKT_DRIVE[m.plaats] || '30 min',
    coords: m.coords,
    vegetarian: m.vegetarian,
    gmaps: m.gmaps,
  }))
}

export function getUitjeById(id: string): Uitje | undefined {
  return uitjes.find(u => u.id === id) ?? getTodayMarktdagen().find(u => u.id === id)
}
