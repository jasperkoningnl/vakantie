# Notre Voyage — Claude Code Instructies

## Eerste actie: repo schoonvegen en Next.js installeren

```bash
git rm -rf .
git commit -m "chore: schone lei"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
git add .
git commit -m "chore: fresh Next.js setup"
git push origin main
```

---

## Tech stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Supabase (dagboek, safe_arrival tabel)
- Anthropic API `claude-sonnet-4-20250514` (dagplanner)
- NextAuth.js met Google OAuth (Google Photos)
- Open-Meteo API (geen key nodig)
- Lucide React (iconen)
- Push naar main, geen feature branches
- Altijd complete bestanden, nooit placeholders
- Nooit het woord "robuust"
- Na elke commit: stel een GitHub commit message voor

## Environment variables (staan al in Vercel)

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
```

---

## Design system: Summer Pulse

Gebruik dit als Tailwind config theme extension:

```js
colors: {
  primary: "#FF6B6B",         // coral — knoppen, accenten
  secondary: "#FFD93D",       // vibrant yellow — highlights
  tertiary: "#4D96FF",        // sky blue — kaarten, maps, links
  background: "#FFFFFF",
  surface: "#F8FAFC",
  "on-surface": "#1E293B",
  "on-surface-variant": "#64748B",
  "outline-variant": "#E2E8F0",
}
borderRadius: {
  DEFAULT: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
}
```

**Font:** Plus Jakarta Sans (Google Fonts), alle gewichten 400–800. Geen Inter, geen Roboto.

**Knoppen:** pill-shaped (rounded-full), primary = coral achtergrond wit tekst, secondary = yellow met donkere tekst.

**Kaarten:** rounded-2xl, witte achtergrond, zachte schaduw `shadow-sm`, border `border-outline-variant`.

**Navigatie:** sticky top header met `backdrop-blur-md bg-white/80`. Bottom tab bar met glassmorphism (`backdrop-blur-md bg-white/70`).

**Chips/filters:** pill-shaped, active = primary kleur, inactief = surface met border.

**Kaartmarkers:** tertiary (blauw) voor routes, primary (coral) voor hoofdbestemming, secondary (geel) voor highlights.

**Schaduw:** zacht, blauw getint: `0px 12px 32px rgba(77, 150, 255, 0.1)`.

**Material Symbols Outlined** voor iconen (Google Fonts CDN).

---

## Supabase tabellen (al aangemaakt)

```sql
diary_entries: id, date (date unique), plan_text (text), actual_text (text), mood_emoji (text), photos (jsonb), created_at
safe_arrival: id, leg (text), timestamp (timestamptz), message (text)
```

---

## Navigatiestructuur

Bottom tab bar op alle tabs behalve `/voor-thuis`:

| Tab | Route | Icoon |
|-----|-------|-------|
| Vandaag | `/` | wb_sunny |
| Uitjes | `/uitjes` | explore |
| Dagboek | `/dagboek` | auto_stories |
| Medisch | `/medisch` | medical_services |
| Route | `/route` | route |

Aparte route zonder navigatie: `/voor-thuis`

---

## Tab 1: Vandaag (`/`)

### Weerfase
Haal automatisch het weer op via Open-Meteo voor coördinaten `44.521, 1.150` (Les Escaliers):

```
https://api.open-meteo.com/v1/forecast?latitude=44.521&longitude=1.150&current=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=Europe/Paris&forecast_days=3
```

Toon: temperatuur, weericoon (zon/bewolkt/regen op basis van WMO weathercode), korte omschrijving in het Nederlands.

### Wizard — twee stappen

**Stap 1: "Wat willen jullie vandaag?"**
6 grote selecteerbare kaarten in een 2×3 grid. Elke kaart heeft een groot illustratief icoon (Material Symbols, FILL=1) en een label. Geselecteerde kaart: coral border + coral achtergrondtint + checkmark.

| Kaart | Icoon |
|-------|-------|
| Iets voor Lena | child_care |
| Kasteel of dorp | castle |
| Water of bos | forest |
| Lekker eten | restaurant |
| Boodschappen | shopping_cart |
| Verras ons | auto_awesome |

**Stap 2: "Hoelang rijden?"**
3 pill-knoppen: `Max 30 min` / `Max 1 uur` / `Max 2 uur`. Geselecteerde knop: coral filled.

**CTA:** grote coral pill-knop "Maak dagplan →"

### Dagplan-resultaat

Na het aanmaken toont de pagina eerst een tussenscreen met **2–3 suggesties als selecteerbare kaarten** (naam, rijduur, korte omschrijving). Pas als de gebruiker er één (of meerdere) kiest, genereert Claude het volledige dagplan. Nooit automatisch één optie opleggen.

**Anthropic API call** — stuur naar `/api/plan`:

```typescript
// System prompt:
`Je bent een vriendelijke Franse reisplanner voor een Nederlands gezin: 
Jasper (48), Hilda en Lena (4 jaar). Ze verblijven bij Les Escaliers 
de La Combe in Porte-du-Quercy (44.521, 1.150). Ze eten vegetarisch. 
Je krijgt het huidige weer, de gewenste activiteit, de maximale rijduur, 
en een lijst van beschikbare uitjes. 

Geef EERST een JSON array van 2-3 suggesties in dit formaat:
{"suggesties": [{"id": "u3", "naam": "...", "reden": "..."}]}

Wacht dan op de keuze van de gebruiker. Als je de gekozen uitjes terugkrijgt, 
stel dan een dagprogramma samen met 2-3 stops, inclusief tijden, een leuke 
beschrijving per stop (vertel iets interessants, max 3 zinnen), een praktische 
tip, en een Google Maps URL naar de eerste stop. Geef ook aan of zwemspullen, 
zonnebrand of regenjas handig zijn. Schrijf warm en persoonlijk in het Nederlands.`
```

Stuur mee: weerbeschrijving, gekozen activiteitstype, maximale rijduur, volledige uitjes-dataset (zie DATA sectie).

**Dagplan weergave:** verticale tijdlijn met stops. Per stop: tijd, naam (bold), beschrijving, kleine Maps-chip. Onderaan: kleine kaartkaart (Leaflet of statische kaart) met genummerde markers voor de stops. Sla het plan op in Supabase (`diary_entries.plan_text` voor die datum).

**Checklistje:** automatisch gegenereerd op basis van activiteit:
- Zwemmen → zwemspullen, zonnebrand, handdoek
- Kasteel → comfortabele schoenen, waterfles, camera
- Natuur → wandelschoenen, insectenspray, zonnebrand
- Eten → portemonnee, reserveringsnummer
- Boodschappen → boodschappentas, lijst
- Altijd: telefoon opladen, Lena's snacks

**Vanuit uitjes-browser:** elke uitjeskaart heeft ook een "Voeg toe aan vandaag"-knop. Een persistente balk onderaan toont de selectie (zoals een winkelmandje) met een "Maak dagplan van selectie"-knop. Zo kan de gebruiker ook zelf een dag samenstellen zonder de wizard.

---

## Tab 2: Uitjes (`/uitjes`)

Bovenaan: `Lijst / Kaart` toggle (pill-knoppen).

**Lijstweergave:**
- Horizontaal scrollbare filterchips: Alles / Lena / Cultuur / Natuur / Eten / Boodschappen
- Verticale lijst van uitjeskaarten

**Kaartweergave:**
- Volledige kaart (Leaflet, terrain style) van de Lot-regio, gecentreerd op `[44.5, 1.2]`
- Gekleurde markers per categorie (coral = entertainment, tertiary = cultuur, yellow = eten, groen = shop)
- Geselecteerde marker toont popup-kaartje met naam, rijduur en "Voeg toe aan vandaag"-knop

**Uitjeskaart (lijstweergave):**
- Categorie-icoon in gekleurde cirkel
- Naam (bold), rijduur-badge rechtsboven
- Korte beschrijving (2 regels)
- 🌿 Vegetarisch label waar van toepassing
- Links: Maps | Wikipedia (indien beschikbaar) | Website (indien beschikbaar)
- TTS-knop (speaker icoon): leest beschrijving voor via Web Speech API, taal nl-NL
- "Voeg toe aan vandaag"-knop (coral, pill)

### Uitjes data

```typescript
const uitjes = [
  { id: 'u1', type: 'entertainment', name: "Plan d'Eau des Chênes", desc: "Recreatiemeer met veilig zandstrandje, ideaal voor Lena.", drive: "15 min", coords: [44.385, 1.140] as [number, number], wiki: "https://fr.wikipedia.org/wiki/Montaigu-de-Quercy", gmaps: "https://www.google.com/maps/search/?api=1&query=Plan+d'Eau+des+Chênes+Montaigu-de-Quercy" },
  { id: 'u2', type: 'entertainment', name: "Parc en Ciel", desc: "Natuurpark met klimparcours en zwemvijver.", drive: "45 min", coords: [44.628, 0.872] as [number, number], wiki: "https://fr.wikipedia.org/wiki/Biron_(Dordogne)", gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+en+Ciel+Biron" },
  { id: 'u6', type: 'entertainment', name: "La Forêt des Singes", desc: "Apenbos waar makaken vrij rondlopen, geweldig voor kleuters.", drive: "1u 20m", coords: [44.805, 1.623] as [number, number], wiki: "https://fr.wikipedia.org/wiki/La_For%C3%AAt_des_singes_(Rocamadour)", site: "https://www.la-foret-des-singes.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=La+Forêt+des+Singes+Rocamadour" },
  { id: 'u13', type: 'entertainment', name: "Walygator Sud-Ouest", desc: "Groot pretpark met kindergedeelte.", drive: "1u 15m", coords: [44.185, 0.575] as [number, number], site: "https://www.walygatorparc.com/sudouest/", gmaps: "https://www.google.com/maps/search/?api=1&query=Walygator+Sud-Ouest" },
  { id: 'u14', type: 'entertainment', name: "Animaparc Occitanie", desc: "Dierenpark, dinobos én pretpark in één. Perfect voor jonge kinderen.", drive: "1u 30m", coords: [43.738, 1.082] as [number, number], site: "https://www.animaparc.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Animaparc+Occitanie" },
  { id: 'u3', type: 'culture', name: "Kasteel van Bonaguil", desc: "Indrukwekkende kasteelruïne in een groene vallei.", drive: "25 min", coords: [44.538, 1.011] as [number, number], wiki: "https://nl.wikipedia.org/wiki/Kasteel_van_Bonaguil", gmaps: "https://www.google.com/maps/search/?api=1&query=Château+de+Bonaguil" },
  { id: 'u4', type: 'culture', name: "Cahors", desc: "Historische stad met de beroemde brug Pont Valentré.", drive: "45 min", coords: [44.447, 1.442] as [number, number], wiki: "https://nl.wikipedia.org/wiki/Cahors", gmaps: "https://www.google.com/maps/search/?api=1&query=Cahors" },
  { id: 'u5', type: 'culture', name: "Saint-Cirq-Lapopie", desc: "Een van de mooiste middeleeuwse dorpjes van Frankrijk.", drive: "1u 10m", coords: [44.464, 1.670] as [number, number], wiki: "https://nl.wikipedia.org/wiki/Saint-Cirq-Lapopie", gmaps: "https://www.google.com/maps/search/?api=1&query=Saint-Cirq-Lapopie" },
  { id: 'u16', type: 'culture', name: "Musée de l'Insolite", desc: "Eigenzinnig museum vol bizarre objecten in Cabrerets.", drive: "1u 10m", coords: [44.505, 1.654] as [number, number], gmaps: "https://www.google.com/maps/search/?api=1&query=Musée+de+l'Insolite+Cabrerets" },
  { id: 'u7', type: 'food', vegetarian: true, name: "L'Estaminet", desc: "Informeel eten aan een autovrij plein in Lauzerte. Vegetarische opties aanwezig.", drive: "25 min", coords: [44.256, 1.137] as [number, number], wiki: "https://nl.wikipedia.org/wiki/Lauzerte", gmaps: "https://www.google.com/maps/search/?api=1&query=L'Estaminet+Lauzerte" },
  { id: 'u8', type: 'food', vegetarian: true, name: "Le Petit Rapporteur", desc: "Ongedwongen sfeer in Montcuq, vegetariersvriendelijk.", drive: "20 min", coords: [44.339, 1.208] as [number, number], wiki: "https://nl.wikipedia.org/wiki/Montcuq", gmaps: "https://www.google.com/maps/search/?api=1&query=Le+Petit+Rapporteur+Montcuq", site: "https://www.lepetitrapporteur-montcuq.com/" },
  { id: 'u9', type: 'food', name: "Pizzeria La Dolce Vita", desc: "Makkelijk met kinderen in Montaigu-de-Quercy.", drive: "15 min", coords: [44.339, 1.018] as [number, number], gmaps: "https://www.google.com/maps/search/?api=1&query=Pizzeria+La+Dolce+Vita+Montaigu-de-Quercy" },
  { id: 'u10', type: 'food', name: "Le Café du Centre", desc: "Gezellig terras in Tournon-d'Agenais.", drive: "20 min", coords: [44.399, 0.995] as [number, number], gmaps: "https://www.google.com/maps/search/?api=1&query=Le+Café+du+Centre+Tournon-d'Agenais" },
  { id: 'u11', type: 'shop', name: "Intermarché Montaigu", desc: "Grote supermarkt, dichtbij.", drive: "15 min", coords: [44.341, 1.015] as [number, number], gmaps: "https://www.google.com/maps/search/?api=1&query=Intermarché+Montaigu-de-Quercy" },
  { id: 'u12', type: 'shop', name: "Carrefour Prayssac", desc: "Grote supermarkt in Prayssac.", drive: "25 min", coords: [44.505, 1.187] as [number, number], gmaps: "https://www.google.com/maps/search/?api=1&query=Carrefour+Prayssac" },
]
```

---

## Tab 3: Dagboek (`/dagboek`)

### Google Photos integratie
Via NextAuth Google OAuth, scope: `https://www.googleapis.com/auth/photoslibrary.readonly`

Bij eerste gebruik: OAuth-flow starten. Daarna: haal foto's op uit album "Notre Voyage 2025" via Google Photos Library API. Filter op datum (timestamp van foto). Toon max 6 thumbnails per dag als horizontale scrollbare strip.

### Dagboekkaart per dag
- Datum header (bold, grote serif-achtige stijl)
- Foto-thumbnailstrip (horizontaal scrollbaar)
- Twee tekstvelden:
  - "Plan was:" — automatisch gevuld vanuit Supabase `plan_text`
  - "We hebben eigenlijk:" — vrij invulbaar tekstveld, opslaan in `actual_text`
- Mood-selector: 5 grote klikbare emoji-knoppen `😎 🌧️ 😴 🎉 🤩`, geselecteerde heeft coral ring
- Knop "Maak er een verhaal van": POST naar `/api/diary-story`

### API route `/api/diary-story`
Stuur naar Anthropic API:
```
Schrijf een kort, warm dagboekverhaaltje (max 150 woorden) in de stijl van een 
persoonlijk reisdagboek. Schrijf in de eerste persoon meervoud ("we"). 
Basis: plan=[plan_text], wat er echt gebeurde=[actual_text], stemming=[mood_emoji], 
foto-omschrijvingen=[photo metadata]. Schrijf in het Nederlands, warm en persoonlijk.
```

Sla het resultaat op in Supabase. Toon als definitieve dagboektekst in een geel-getinte kaart.

---

## Tab 4: Medisch (`/medisch`)

### Sectie 1: Noodcontacten
Grote, duidelijke kaart. Drie grote knoppen naast elkaar voor bellen:

| | Nummer | Label |
|---|---|---|
| 🚑 | 112 | Alles |
| 🏥 | 15 | SAMU |
| 🔥 | 18 | Pompiers |

Daaronder twee kleinere kaartjes:
- **CHU Toulouse Purpan** — chirurgie maxillo-faciale: `05 61 77 74 76` — 1 Place du Docteur Joseph Baylac, 31300 Toulouse — ca. 1u30 van Les Escaliers
- **Meander Ziekenhuis Amersfoort** — behandelend specialist Drs. H.G.G.J. Vallen: `+31 33 850 5050`

### Sectie 2: Medische brief

Toon als printbare kaart:

```
LETTRE MÉDICALE D'INFORMATION URGENTE

Concernant : M. Jasper Koning
Date de naissance : 7 décembre 1976
Nationalité : Néerlandaise
Médecin traitant : Drs. H.G.G.J. Vallen, chirurgien maxillo-facial
Établissement : Meander Medisch Centrum, Maatweg 3, 3813 TZ Amersfoort, Pays-Bas
Téléphone : +31 33 850 5050

Objet : Patient présentant un kyste mandibulaire avec risque de fracture pathologique

Madame, Monsieur,

M. Koning est suivi pour un kyste osseux de la mandibule inférieure gauche. 
Ce kyste entraîne un amincissement significatif de la corticale osseuse 
mandibulaire gauche, rendant la mâchoire particulièrement fragilisée.

Il existe un risque réel de fracture pathologique de la mandibule. Toute 
douleur soudaine, gêne à l'ouverture buccale ou asymétrie de la mâchoire 
doit être considérée comme un signal d'alarme.

Traitement en cours : irrigation biquotidienne à l'eau claire. 
Aucune médication systémique.

Un orthopantomogramme récent est disponible sur demande.

En cas d'urgence : radiographie panoramique ou scanner de la mandibule, 
avis du service de chirurgie maxillo-faciale.

Secrétariat Meander : +31 33 850 5050
```

**TTS-knop** "Lees urgentiezin voor": leest via Web Speech API (lang: `fr-FR`):
> "Ce patient présente un kyste mandibulaire avec risque de fracture pathologique. Veuillez contacter le service de chirurgie maxillo-faciale en urgence."

**Printknop**: `window.print()`, alleen de brief in de printview (verberg navigatie via `@media print`).

---

## Tab 5: Route (`/route`)

### Grote kaart bovenaan
Leaflet kaart (terrain tiles) die de volledige route toont:
- Heenreis: Amersfoort → Sens/Auxerre → Les Escaliers (blauwe lijn)
- Terugreis: Les Escaliers → Chartres → Amersfoort (gestippelde oranje lijn)
- Markers voor: Amersfoort, Atelier des Sens 89, Les Escaliers, tankstops, Chartres

### Heenreis sectie (12–13 juni)
**Dag 1:** Amersfoort → Atelier des Sens 89, ca. 6 uur. Via Antwerpen, Reims, Troyes, Auxerre.

**Overnachting:** Atelier des Sens 89 — atelierdessens89.fr — Studio met keuken, zwembad, table d'hôtes.

**Dag 2:** Atelier des Sens 89 → Les Escaliers, ca. 5,5 uur. Via Châteauroux en Cahors.

### Verblijf sectie (13–27 juni)
- 13–19 juni: Safaritent
- 20–27 juni: Gîte L (paddenstoelen-stapelbed voor Lena!)
- Eigenaren: Ilse & Coen (Nederlandstalig)
- Website: lesescaliers.com | Coördinaten: 44.521, 1.150

### Terugreis sectie (27–29 juni)
**Dag 1:** Les Escaliers → Chartres, ca. 5,5 uur. Via Limoges en Orléans.

**Overnachting (2 nachten):** Hotel Henri IV Chartres — booking.com/hotel/fr/henri-iv-chartres — Parkeergarage onder het hotel.
Te zien: Kathedraal van Chartres (UNESCO), Chartres en Lumières (avondlichtshows).

**Dag 3:** Chartres → Amersfoort, ca. 6 uur. Via Amiens en Antwerpen.

### Tankstops sectie
Curated statische kaartjes (geen live data). Zoek zelf 2 geschikte stops op de heenreis (richting Auxerre/Châteauroux) en 2 op de terugreis (richting Limoges/Orléans). Selectiecriteria: tankstation + ruimte buiten voor Lena om te rennen + restaurant of boulangerie in de buurt. Elke kaartje: naam plek, snelweg/afslag, omschrijving waarom het een fijne stop is, Google Maps link.

### Auto
Honda CR-V, donkerblauw metallic, kenteken P-162-KB.
Verzekering: Allianz all-risk, nul eigen risico. Honda Assistance Europese dekking.

### "We zijn er!" knop
Dropdown: Atelier des Sens / Les Escaliers / Chartres / Thuis.
Bij klikken: schrijf naar Supabase `safe_arrival` tabel. Verschijnt automatisch op `/voor-thuis`.

---

## Route: `/voor-thuis`

Aparte pagina, geen navigatiebalk. Deelbaar als URL. Warm en geruststellend van toon.

**Header:** "Notre Voyage 🌻 — voor de thuisblijvers"

**Veilig aangekomen status:** lees de laatste entry uit Supabase `safe_arrival`. Toon als groene statusbadge: "✓ Aangekomen bij [leg] — [datum tijd]". Als nog geen entry: neutrale tekst "Nog onderweg — we laten het weten!".

**Route samenvatting:** visuele horizontale tijdlijn:
Amersfoort → Atelier des Sens (12 juni) → Les Escaliers (13–27 juni) → Chartres (27 juni) → Thuis (29 juni)

**Accommodaties:** drie kaartjes met adres + website:
1. Atelier des Sens 89 — Bourgondië — atelierdessens89.fr
2. Les Escaliers de La Combe — Porte-du-Quercy — lesescaliers.com — eigenaren Ilse & Coen
3. Hotel Henri IV — Chartres — Parkeergarage aanwezig

**Auto:**
Honda CR-V | Donkerblauw metallic | P-162-KB
Verzekering: Allianz all-risk | Honda Assistance Europa

**Telefoonnummers:** [INVULLEN DOOR JASPER VOOR DEPLOY — laat als placeholder in de code]

**Medische situatie Jasper (korte versie):**
Kaakkyste linksonder, fragiele kaak. Behandelend specialist: Drs. H.G.G.J. Vallen, Meander Amersfoort, +31 33 850 5050. Bij nood in Frankrijk: CHU Toulouse Purpan, chirurgie maxillo-faciale, 05 61 77 74 76.

**Noodcontacten Frankrijk:**
Drie grote knoppen: 🚑 112 / 🏥 15 / 🔥 18

---

## Conventies

- Altijd complete bestanden, nooit placeholders of "rest blijft hetzelfde"
- Push naar main, geen feature branches
- Geen comments in YAML of config-bestanden
- Gebruik nooit het woord "robuust"
- Na elke implementatie: stel een korte GitHub commit message voor
