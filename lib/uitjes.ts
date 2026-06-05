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
  marktDag?: string  // komma-gescheiden dag(en): 'woensdag', 'zaterdag', etc.
}

export const uitjes: Uitje[] = [
  { id: 'u1', type: 'entertainment', name: "Plan d'Eau des Chênes", desc: "Recreatiemeer met veilig zandstrandje, ideaal voor Lena.", drive: "15 min", coords: [44.385, 1.140], wiki: "https://nl.wikipedia.org/wiki/Montaigu-de-Quercy", gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'Eau+des+Chênes+Montaigu-de-Quercy" },
  { id: 'u2', type: 'entertainment', name: "Parc en Ciel", desc: "Natuurpark met klimparcours en zwemvijver.", drive: "45 min", coords: [44.628, 0.872], wiki: "https://en.wikipedia.org/wiki/Biron,_Dordogne", gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+en+Ciel+Biron" },
  { id: 'u6', type: 'entertainment', name: "La Forêt des Singes", desc: "Apenbos waar makaken vrij rondlopen, geweldig voor kleuters.", drive: "1u 20m", coords: [44.805, 1.623], wiki: "https://en.wikipedia.org/wiki/La_For%C3%AAt_des_Singes", site: "https://www.la-foret-des-singes.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=La+Forêt+des+Singes+Rocamadour" },
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
  // Marktdagen — verschijnen in 'Lekker eten' en 'Boodschappen' categorieën
  { id: 'markt-cahors', type: 'food', vegetarian: true, name: "Markt Cahors", desc: "Grote overdekte markt plus openluchtmarkt. Groenten, kaas, honing en lokale producten. Op woensdag en zaterdag in het hart van de stad.", drive: "45 min", coords: [44.447, 1.442], marktDag: 'woensdag,zaterdag', wiki: "https://nl.wikipedia.org/wiki/Cahors", gmaps: "https://www.google.com/maps/search/?api=1&query=marché+Cahors" },
  { id: 'markt-lauzerte', type: 'food', vegetarian: true, name: "Markt Lauzerte", desc: "Sfeervolle zaterdagsmarkt op het centrale plein van dit mooie bastide-dorpje. Goed te combineren met L'Estaminet.", drive: "25 min", coords: [44.256, 1.137], marktDag: 'zaterdag', wiki: "https://nl.wikipedia.org/wiki/Lauzerte", gmaps: "https://www.google.com/maps/search/?api=1&query=marché+Lauzerte" },
  { id: 'markt-montcuq', type: 'food', vegetarian: true, name: "Markt Montcuq", desc: "Gezellige zondagsmarkt in het sfeervol plein van Montcuq. Perfect te combineren met lunch bij Le Petit Rapporteur.", drive: "20 min", coords: [44.339, 1.208], marktDag: 'zondag', wiki: "https://nl.wikipedia.org/wiki/Montcuq", gmaps: "https://www.google.com/maps/search/?api=1&query=marché+Montcuq" },
  { id: 'markt-prayssac', type: 'shop', name: "Markt Prayssac", desc: "Kleine maar leuke vrijdagsmarkt, handig te combineren met boodschappen bij Carrefour verderop.", drive: "25 min", coords: [44.505, 1.187], marktDag: 'vrijdag', gmaps: "https://www.google.com/maps/search/?api=1&query=marché+Prayssac" },

  // NATUUR & WATER
  { id: 'u22', type: 'nature', name: "Plan d'eau de Saint-Sernin", desc: "Turkooisblauw meer bij Montcuq met zandig strandje, barbecue, picknickplek en speeltuin. De verfrissende plek van Quercy Blanc.", drive: "20 min", coords: [44.339, 1.208], gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'eau+Saint-Sernin+Montcuq" },
  { id: 'u23', type: 'nature', name: "Cascade d'Autoire", desc: "Waterval van 30 meter, bereikbaar via een makkelijke wandeling van een uurtje. Mooi ook voor Lena.", drive: "1u 40m", coords: [44.852, 1.817], wiki: "https://nl.wikipedia.org/wiki/Autoire", gmaps: "https://www.google.com/maps/search/?api=1&query=Cascade+Autoire+Lot" },

  // CULTUUR & DORPEN
  { id: 'u24', type: 'culture', name: "La Planète des Moulins", desc: "Interactief molenmuseum in Luzech. Maquettes in beweging, uitleg over wind- en watermolens. Leerzaam en leuk voor kinderen.", drive: "30 min", coords: [44.479, 1.287], gmaps: "https://www.google.com/maps/search/?api=1&query=Planète+des+Moulins+Luzech", site: "https://www.planetedesmoulins.org/" },
  { id: 'u25', type: 'culture', name: "Rocamadour", desc: "Spectaculair klifdorp, UNESCO-werelderfgoed. Indrukwekkend uitzicht. Wel 200 treden, geen buggy mogelijk.", drive: "1u 30m", coords: [44.799, 1.618], wiki: "https://nl.wikipedia.org/wiki/Rocamadour", gmaps: "https://www.google.com/maps/search/?api=1&query=Rocamadour" },
  { id: 'u26', type: 'culture', name: "Figeac — Musée Champollion", desc: "Museum over de geschiedenis van het schrift, in het geboortehuis van de ontcijferaar van de hiëroglyfen. Verrassend toegankelijk voor kinderen.", drive: "1u 30m", coords: [44.608, 2.032], wiki: "https://nl.wikipedia.org/wiki/Figeac", gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+Champollion+Figeac" },
  { id: 'u27', type: 'culture', name: "Château de Castelnau-Bretenoux", desc: "Imposant rood kasteel op een heuvel. Prachtig panorama over drie valleien. Goed te combineren met Autoire.", drive: "1u 40m", coords: [44.857, 1.844], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Castelnau-Bretenoux", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Castelnau-Bretenoux" },
  { id: 'u28', type: 'culture', name: "Lauzerte", desc: "Middeleeuws bastidedorp op een heuveltop. Eén van de mooiste dorpen van Frankrijk. Smalle steegjes, panoramisch uitzicht, gezellig plein.", drive: "25 min", coords: [44.256, 1.137], wiki: "https://nl.wikipedia.org/wiki/Lauzerte", gmaps: "https://www.google.com/maps/search/?api=1&query=Lauzerte" },

  // KINDEREN & DIEREN
  { id: 'u29', type: 'entertainment', name: "Ferme Pédagogique Saint-Martin", desc: "Boerderij op een heuvel met 360° uitzicht. Dieren voeren, groententuin, labyrint en buitenspellen. Ideaal voor Lena.", drive: "45 min", coords: [44.117, 1.153], site: "https://lafermesaintmartin.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Ferme+Pédagogique+Saint-Martin+Labarthe" },
  { id: 'u30', type: 'entertainment', name: "Au Clair de la Brune", desc: "Kaasboerderij bij Montcuq met bruine koeien. Proeven, koeien bekijken en leren over kaas maken.", drive: "20 min", coords: [44.339, 1.249], site: "https://www.auclair-delabrune.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Au+Clair+de+la+Brune+Montcuq" },
  { id: 'u31', type: 'entertainment', name: "Reptiland", desc: "Reptielenzoo bij Rocamadour. Slangen, hagedissen, schildpadden. Fascinerend voor nieuwsgierige kleuters.", drive: "1u 30m", coords: [44.818, 1.627], site: "https://www.reptiland.fr/", gmaps: "https://www.google.com/maps/search/?api=1&query=Reptiland+Martel+Lot" },
  { id: 'u32', type: 'entertainment', name: "Le Truffadou", desc: "Historisch stoomtreintje langs de kliffen van de Dordogne. 13 km heen en terug, 80 meter boven de rivier. Kinderen onder 4 gratis.", drive: "1u 45m", coords: [44.936, 1.605], wiki: "https://nl.wikipedia.org/wiki/Martel_(Lot)", gmaps: "https://www.google.com/maps/search/?api=1&query=Chemin+de+fer+touristique+Haut+Quercy+Martel" },

  // BAKKERTJES
  { id: 'u33', type: 'bakery', name: "Chez Mado", desc: "Ambachtelijke boulangerie-pâtisserie in Montcuq. Vers brood, croissants, quiches en pizza's. Alles zelfgemaakt.", drive: "20 min", coords: [44.337, 1.214], gmaps: "https://www.google.com/maps/search/?api=1&query=Chez+Mado+boulangerie+Montcuq" },
  { id: 'u34', type: 'bakery', name: "Maison Petersen", desc: "Relatief nieuwe bakker in Montcuq (2023). Artisanaal brood en gebak.", drive: "20 min", coords: [44.337, 1.210], gmaps: "https://www.google.com/maps/search/?api=1&query=Maison+Petersen+Montcuq" },
  { id: 'u35', type: 'bakery', name: "Pain et Chocolat", desc: "Bakkerij in Lauzerte. Goed brood, chocoladegebak.", drive: "25 min", coords: [44.256, 1.137], gmaps: "https://www.google.com/maps/search/?api=1&query=Pain+et+Chocolat+Lauzerte" },
  { id: 'u36', type: 'bakery', name: "Boulangerie Larroque", desc: "Traditionele dorpsbakker in de Rue des Tanneurs in Lauzerte.", drive: "25 min", coords: [44.255, 1.139], gmaps: "https://www.google.com/maps/search/?api=1&query=Boulangerie+Larroque+Lauzerte" },
  { id: 'u37', type: 'bakery', name: "Du Quercy Vert", desc: "Bakkerij in Montaigu-de-Quercy. Dichtbij Les Escaliers.", drive: "15 min", coords: [44.339, 1.018], gmaps: "https://www.google.com/maps/search/?api=1&query=Du+Quercy+Vert+Montaigu-de-Quercy" },

  // CHARTRES — CULTUUR & ENTERTAINMENT
  { id: 'u40', type: 'culture', name: "Maison Picassiette", desc: "Huis volledig bedekt met mozaïek van gebroken servies en glas. Bizar, kleurrijk en fascinerend voor kinderen.", drive: "10 min lopen", coords: [48.4530, 1.5030], wiki: "https://nl.wikipedia.org/wiki/Maison_Picassiette", gmaps: "https://www.google.com/maps/search/?api=1&query=Maison+Picassiette+Chartres" },
  { id: 'u41', type: 'culture', name: "Musée des Beaux-Arts Chartres", desc: "Klein museum in het voormalige bisschoppelijk paleis. Tuinen met mooi uitzicht op de achterkant van de kathedraal. Makkelijk met kinderen.", drive: "5 min lopen", coords: [48.4478, 1.4890], gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+des+Beaux-Arts+Chartres" },
  { id: 'u42', type: 'culture', name: "Château de Maintenon", desc: "Kasteel met tuinen ontworpen door Le Nôtre. Ruïnes van het aquaduct van Lodewijk XIV. 20 minuten rijden van Chartres.", drive: "20 min", coords: [48.5866, 1.5785], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Maintenon", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Maintenon" },
  { id: 'u43', type: 'entertainment', name: "L'Odyssée Chartres", desc: "Modern zwembad met glijbanen, buitenbad (zomer) en wellness. Perfect voor een regenachtige dag of als Lena zich wil uitleven.", drive: "10 min", coords: [48.4410, 1.5120], gmaps: "https://www.google.com/maps/search/?api=1&query=L'Odyssée+centre+aquatique+Chartres" },
  { id: 'u44', type: 'bakery', name: "David Lambert Chocolatier", desc: "Lokale chocolatier, beroemd om de 'Vitrail de Chartres' (meringue met praline). Een Chartrainse specialiteit.", drive: "5 min lopen", coords: [48.4470, 1.4880], gmaps: "https://www.google.com/maps/search/?api=1&query=David+Lambert+chocolatier+Chartres" },
]

export function getUitjeById(id: string): Uitje | undefined {
  return uitjes.find(u => u.id === id)
}
