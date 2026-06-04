# INSTRUCTIONS_UPDATE.md — Aanvullingen op INSTRUCTIONS.md

Lees en verwerk deze aanvullingen bovenop de bestaande codebase. Dit zijn uitbreidingen en verbeteringen op wat er al staat. Niet opnieuw beginnen, niet schoonvegen. Voeg toe, pas aan, verbeter.

---

## 1. PWA en offline modus

Maak de app een Progressive Web App. Voeg een service worker toe die de volgende pagina's en data offline beschikbaar maakt:

- `/medisch` (volledige pagina inclusief brief en noodcontacten)
- `/route` (volledige pagina inclusief tankstops en accommodaties)
- `/voor-thuis`
- Alle opgeslagen dagplannen uit Supabase (cache na ophalen)
- De uitjes-dataset (statisch, altijd beschikbaar)

Voeg een `manifest.json` toe met:
- name: "Notre Voyage"
- short_name: "Voyage"
- theme_color: passend bij Summer Pulse
- display: "standalone"
- iconen in 192×192 en 512×512

De medische brief en noodcontacten moeten altijd werken, ook zonder bereik. Dit is de hoogste prioriteit van de hele app.

---

## 2. Locatiebewustzijn

Vraag bij eerste gebruik toestemming voor de Geolocation API (`navigator.geolocation`). Sla de positie op in React state (niet in Supabase). Gebruik de locatie voor:

- Op reisdagen: toon de dichtstbijzijnde tankstop of tussenstop op basis van huidige positie
- Op vakantiedagen: bereken actuele rijafstand naar uitjes (in plaats van statische "25 min")
- Op de Vandaag-pagina: toon een klein kaartje met de huidige positie

Als de gebruiker geen toestemming geeft of er geen bereik is: val terug op de statische data.

---

## 3. Slimme reisdagen

De Vandaag-pagina moet weten welke dag het is en zich aanpassen. Definieer een reiskalender:

```typescript
const reiskalender = {
  '2025-06-12': { type: 'reisdag', label: 'Heenreis dag 1', van: 'Amersfoort', naar: 'Atelier des Sens 89', route: 'Via Antwerpen, Reims, Auxerre' },
  '2025-06-13': { type: 'reisdag', label: 'Heenreis dag 2', van: 'Atelier des Sens 89', naar: 'Les Escaliers', route: 'Via Châteauroux, Cahors' },
  '2025-06-14': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-15': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-16': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-17': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-18': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-19': { type: 'vakantie', verblijf: 'Safaritent' },
  '2025-06-20': { type: 'vakantie', verblijf: 'Gîte L', opmerking: 'Verhuisdag naar Gîte L' },
  '2025-06-21': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-22': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-23': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-24': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-25': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-26': { type: 'vakantie', verblijf: 'Gîte L' },
  '2025-06-27': { type: 'reisdag', label: 'Terugreis dag 1', van: 'Les Escaliers', naar: 'Chartres', route: 'Via Limoges, Orléans' },
  '2025-06-28': { type: 'verblijf', label: 'Chartres', verblijf: 'Hotel Henri IV' },
  '2025-06-29': { type: 'reisdag', label: 'Terugreis dag 3', van: 'Chartres', naar: 'Amersfoort', route: 'Via Amiens, Antwerpen' },
}
```

**Op reisdagen** vervangt de Vandaag-pagina de wizard door een reismodus:

- Grote kaart met de route van vandaag (van → naar)
- Markers voor de geplande tankstops langs deze route
- Als locatie beschikbaar: toon huidige positie op de kaart
- "Tussenstop zoeken": knop die Claude vraagt om een suggestie op basis van de huidige locatie. System prompt:

```
Je bent een reisassistent. Het gezin rijdt vandaag van [van] naar [naar] via [route]. 
Hun huidige locatie is [lat, lon]. Stel een tussenstop voor: een dorpje waar ze 
even van de snelweg af kunnen, Lena kan rondrennen, en ze ergens kunnen lunchen 
of een koffie drinken. Geef naam, korte omschrijving, en Google Maps link. 
Denk aan dorpspleinen, boulangeries, parken. Schrijf in het Nederlands.
```

- Onderaan: de routekaart uit de Route-tab voor deze specifieke dag
- Geen wizard, geen uitjeskeuze op reisdagen

**Op verblijfsdagen in Chartres (28 juni):** toon een aangepaste wizard met Chartres-specifieke suggesties. Voeg toe aan uitjes-data:

```typescript
{ id: 'u17', type: 'culture', name: "Cathédrale de Chartres", desc: "Gotische kathedraal, UNESCO-werelderfgoed. Beroemde gebrandschilderde ramen.", drive: "5 min lopen", coords: [48.4478, 1.4877], wiki: "https://nl.wikipedia.org/wiki/Kathedraal_van_Chartres", gmaps: "https://www.google.com/maps/search/?api=1&query=Cathédrale+de+Chartres" },
{ id: 'u18', type: 'culture', name: "Chartres en Lumières", desc: "Avondlichtshows op historische gebouwen. Gratis, spectaculair. Start bij zonsondergang.", drive: "5 min lopen", coords: [48.4470, 1.4880], gmaps: "https://www.google.com/maps/search/?api=1&query=Chartres+en+Lumières" },
{ id: 'u19', type: 'entertainment', name: "Parc des Bords de l'Eure", desc: "Mooi park langs de rivier, speeltuin aanwezig. Lekker voor Lena na een dag in de auto.", drive: "10 min lopen", coords: [48.4430, 1.4850], gmaps: "https://www.google.com/maps/search/?api=1&query=Parc+des+Bords+de+l'Eure+Chartres" },
```

---

## 4. Grottes toevoegen aan uitjes-data

Voeg toe aan de uitjes-array:

```typescript
{ id: 'u20', type: 'culture', name: "Grotte de Pech-Merle", desc: "Prehistorische grotschilderingen van 25.000 jaar oud. Echte kunst in een echte grot, indrukwekkend voor alle leeftijden.", drive: "1u 10m", coords: [44.508, 1.638], wiki: "https://nl.wikipedia.org/wiki/Pech_Merle", site: "https://pechmerle.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Grotte+du+Pech-Merle" },
{ id: 'u21', type: 'culture', name: "Gouffre de Padirac", desc: "Ondergrondse rondvaart door een spectaculaire grot, 103 meter diep. Avontuurlijk voor kleuters.", drive: "1u 30m", coords: [44.858, 1.748], wiki: "https://nl.wikipedia.org/wiki/Gouffre_de_Padirac", site: "https://www.gouffre-de-padirac.com/", gmaps: "https://www.google.com/maps/search/?api=1&query=Gouffre+de+Padirac" },
```

---

## 5. Les Escaliers als thuisbasis op de kaart

Op de uitjes-kaart (Leaflet): toon Les Escaliers altijd als vaste thuisbasis-marker op `[44.521, 1.150]`. Gebruik een ander icoon dan de uitjesmarkers (huisje, of een grotere marker met een ander kleur). Label: "Les Escaliers — thuisbasis". Deze marker is niet klikbaar als uitje, maar altijd zichtbaar als referentiepunt. Trek vanuit deze marker een stippellijn of cirkel die de rijafstanden aangeeft (30 min, 1 uur, 2 uur) als subtiele overlay.

---

## 6. Marktdagen

Voeg een marktdagen-dataset toe. De dagplanner moet deze meewegen: als het de juiste dag is en de gebruiker kiest "Eten" of "Boodschappen", moet de markt als eerste suggestie verschijnen.

```typescript
const marktdagen = [
  { dag: 'woensdag', plaats: 'Cahors', omschrijving: 'Grote overdekte markt + openluchtmarkt, groenten, kaas, lokale producten.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors' },
  { dag: 'zaterdag', plaats: 'Cahors', omschrijving: 'Nog grotere versie van de woensdagmarkt.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Cahors' },
  { dag: 'zaterdag', plaats: 'Lauzerte', omschrijving: 'Sfeervolle dorpsmarkt op het centrale plein.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Lauzerte' },
  { dag: 'zondag', plaats: 'Montcuq', omschrijving: 'Gezellige zondagsmarkt, goed te combineren met lunch.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Montcuq' },
  { dag: 'vrijdag', plaats: 'Prayssac', omschrijving: 'Kleine maar leuke markt, te combineren met boodschappen bij Carrefour.', gmaps: 'https://www.google.com/maps/search/?api=1&query=marché+Prayssac' },
]
```

Voeg de marktdagen toe aan het system prompt van de dagplanner:
```
Je weet ook welke markten er op welke dag zijn: [marktdagen]. Als het vandaag 
een marktdag is en de gebruiker zoekt eten of boodschappen, stel de markt dan 
als eerste optie voor.
```

---

## 7. Lena's dagritme in de AI-prompt

Voeg toe aan het dagplanner system prompt:

```
Houd rekening met Lena's dagritme. Ze is 4 jaar oud. De ochtend (9:00-12:00) 
is het actieve venster: plan dan de buitenactiviteit of het avontuur. Rond 12:30 
lunchen. Tussen 13:00 en 15:00 is een rustig moment (autorit = slaapje in de 
auto). Vanaf 15:00 een tweede kort venster voor een kalme activiteit. Plan de 
langste autorit rond 13:30 als dat kan. Eindig de dag niet te laat: uiterlijk 
17:30 terug bij Les Escaliers.
```

---

## 8. "Al bezocht" tracking

Houd in Supabase bij welke uitjes al gedaan zijn (via de opgeslagen dagplannen in diary_entries). Wanneer de dagplanner suggesties genereert, filter uitjes die al in eerdere plan_text entries voorkomen. Voeg toe aan het system prompt:

```
De volgende uitjes zijn al bezocht en hoef je niet meer voor te stellen: [lijst].
```

In de uitjes-browser: toon bezochte uitjes met een subtiel "✓ Bezocht" label en lagere visuele prioriteit (lichtere opacity), maar verberg ze niet volledig.

---

## 9. Meerdaagse weersvoorspelling

Gebruik de Open-Meteo `daily` forecast (staat al in de API-call) om een 3-daagse voorspelling te tonen op de Vandaag-pagina. Drie kleine kaartjes naast elkaar onder het huidige weer: vandaag, morgen, overmorgen.

Als morgen regen verwacht wordt (precipitation_probability > 60%), toon een proactieve hint:
"Morgen wordt het nat — misschien een goed moment voor Pech-Merle of het Musée de l'Insolite?"

---

## 10. Vertreklijst

Nieuwe route: `/vertreklijst` (of als modal/sectie binnen de Route-tab). Toon alleen vóór de heenreis (t/m 12 juni) prominent op de homepage.

Statische checklist met categorieën:

**Documenten:** paspoorten, rijbewijs, EHIC-kaart (Europese zorgpas), kopie röntgenfoto (papier + telefoon), autoverzekeringspapieren KWA/Allianz, reserveringsbevestigingen

**Auto (check bij Bart):** gevarendriehoek (verplicht in Frankrijk), reflecterende hesjes (verplicht in Frankrijk, minimaal 1 per inzittende), bandenspanning, olie, ruitenwisservloeistof

**Lena:** knuffels en slaapspullen, zwemluier/zwemspullen, buggy, lievelingsboekjes, snacks voor onderweg

**Praktisch:** telefoonopladers + autolader, zonnebrand, EHBO-setje, contant geld, boodschappentas, zwemspullen

**Digitaal:** app offline beschikbaar gemaakt, Google Photos album "Notre Voyage 2025" aangemaakt, thuisblijvers-URL gedeeld

Checkboxen met lokale state (localStorage is prima hier, hoeft niet te syncen). Voortgangsbalk bovenaan.

---

## 11. Franse zinnen met TTS

Nieuwe sectie binnen de Medisch-tab (of als aparte sub-tab). Praktische Franse zinnen met per zin een TTS-knop (Web Speech API, lang: `fr-FR`):

```typescript
const zinnen = [
  { nl: "Wij zijn vegetariër", fr: "Nous sommes végétariens" },
  { nl: "Heeft u iets zonder vlees?", fr: "Avez-vous quelque chose sans viande ?" },
  { nl: "De rekening alstublieft", fr: "L'addition, s'il vous plaît" },
  { nl: "Waar is de dichtstbijzijnde apotheek?", fr: "Où est la pharmacie la plus proche ?" },
  { nl: "Mijn man heeft een probleem met zijn kaak", fr: "Mon mari a un problème à la mâchoire" },
  { nl: "We hebben dringend een dokter nodig", fr: "Nous avons besoin d'un médecin de toute urgence" },
  { nl: "Heeft u een kinderstoel?", fr: "Avez-vous une chaise haute ?" },
  { nl: "Waar zijn de toiletten?", fr: "Où sont les toilettes ?" },
  { nl: "Wij hebben een reservering", fr: "Nous avons une réservation" },
  { nl: "Kunt u ons helpen?", fr: "Pouvez-vous nous aider ?" },
  { nl: "Spreekt u Engels?", fr: "Parlez-vous anglais ?" },
  { nl: "Hoeveel kost dit?", fr: "Combien ça coûte ?" },
  { nl: "We zijn verdwaald", fr: "Nous sommes perdus" },
  { nl: "Is er een speeltuin in de buurt?", fr: "Y a-t-il une aire de jeux à proximité ?" },
]
```

Toon als twee-koloms kaartjes: Nederlands links, Frans rechts, speaker-icoon naast de Franse tekst.

---

## 12. Terugblik / reisverhaal

Nieuwe knop op de Dagboek-pagina, alleen zichtbaar na minimaal 3 dagboekentries: "Maak ons reisverhaal".

POST naar `/api/reisverhaal`. Stuur alle diary_entries naar Anthropic API:

```
Je krijgt alle dagboekentries van een gezinsvakantie in Zuid-Frankrijk. 
Schrijf hier een warm, persoonlijk reisverhaal van, alsof het in een 
mooi reisboek staat. Gebruik de eerste persoon meervoud ("we"). 
Begin met een sfeervolle inleiding over de reis ernaartoe, eindig met 
een reflectie op de vakantie. Verwerk de dagelijkse verhalen, de stemmingen 
en de plekken die bezocht zijn. Maak het max 1500 woorden. Schrijf in het Nederlands.
```

Toon het resultaat als een mooie, scrollbare pagina met de foto's ertussen. Printbaar via `window.print()`.

---

## 13. Wizard wordt dagbouwer (vervangt de wizard-flow uit INSTRUCTIONS.md)

De oude wizard met één activiteitskeuze en een automatisch gegenereerd dagplan verdwijnt. In plaats daarvan komt een dagbouwer waarmee de gebruiker zelf een dag samenstelt uit meerdere activiteiten.

### Flow

**Stap 1: Weer + multi-select**

Bovenaan het huidige weer (automatisch opgehaald). Daaronder de vraag: "Wat willen jullie vandaag?"

De 6 activiteitknoppen zijn nu multi-select. Je kunt er meerdere aantikken. Bijv. kasteel + eten + boodschappen. Of: iets voor Lena + natuur + eten. Geselecteerde knoppen krijgen een coral achtergrondtint.

Geen rijduur-vraag meer in deze stap. Dat wordt per activiteit duidelijk uit de uitjeskaarten.

**Stap 2: Per gekozen categorie een uitjes-selectie**

Voor elke aangetikte categorie toont de app de bijpassende uitjes als horizontaal scrollbare kaarten. Bijv.:

- *Kasteel:* Bonaguil (25 min) | Saint-Cirq-Lapopie (1u10) | ...
- *Eten:* L'Estaminet (25 min) | Le Petit Rapporteur (20 min) | ...
- *Boodschappen:* Intermarché (15 min) | Carrefour Prayssac (25 min)

De gebruiker tikt per categorie de specifieke plek aan. Meerdere per categorie mag.

Als het een marktdag is: toon de markt als eerste kaart bij "Eten" en "Boodschappen" met een "Markt vandaag!"-badge.

**Stap 3: Dagplan genereren**

Onderaan verschijnt een persistente balk met alle gekozen plekken (als kleine chips) en een knop "Maak dagplan".

Bij klikken: stuur de gekozen plekken naar de Anthropic API. System prompt:

```
Je bent een praktische reisplanner. Het gezin (Jasper 48, Hilda, Lena 4 jaar) 
verblijft bij Les Escaliers (44.521, 1.150). Ze eten vegetarisch. 
Het weer vandaag: [weer].

Ze willen vandaag het volgende doen: [lijst van gekozen plekken met coördinaten].

Maak een logische route en tijdschema. Houd rekening met Lena's ritme: 
actief venster 9:00-12:00, lunch 12:30, rustig moment/autorit 13:00-15:00, 
kort tweede venster 15:00-17:00, uiterlijk 17:30 terug.

Geef per stop: tijd, naam, 1 zin met iets interessants over de plek (geen 
generieke intro's of afsluitteksten), en een Google Maps link.

Plan de langste rit rond 13:30 als dat kan. Eindig met de totale rijtijd.

Schrijf alleen het programma, geen inleidingen of afsluitteksten.
Schrijf in het Nederlands.
```

**Stap 4: Bevestigen en aanpassen**

Het dagplan verschijnt als bewerkbare tijdlijn. De gebruiker kan:
- Een stop verwijderen (swipe of kruisje)
- Een stop toevoegen (knop "Voeg stop toe" opent de uitjes-selectie opnieuw)
- De volgorde aanpassen (drag & drop of pijltjes)

Knop "Bevestig als dagplan". Na bevestiging:
- Het plan wordt opgeslagen in Supabase (diary_entries.plan_text voor die datum)
- De wizard verdwijnt en de Vandaag-pagina toont het bevestigde dagplan als actieve kaart
- De tijdlijn toont welke stop "nu" is op basis van de tijd

**Tijdens de dag**

De bevestigde Vandaag-pagina toont het dagplan als compacte tijdlijn. Per stop een Maps-knop. Knop "Pas plan aan" brengt de bewerkbare view terug.

**Einde van de dag**

Knop "Sluit dag af" onderaan het dagplan. Opent een kort formulier:
- "Hebben jullie het plan gevolgd?" — Ja / Nee, we hebben iets anders gedaan
- Bij "Nee": vrij tekstveld "Wat hebben jullie gedaan?"
- Mood-emoji keuze
- Knop "Opslaan in dagboek"

Dit schrijft naar Supabase (diary_entries: actual_text en mood_emoji) en de dag verschijnt in de Dagboek-tab.

### Wat verdwijnt

- De oude eenstaps wizard met één activiteitskeuze
- De automatische checklist (zwemspullen, zonnebrand etc.)
- Generieke intro- en afsluitteksten van Claude in het dagplan
- De tussenscreen met "2-3 suggesties als selecteerbare kaarten" uit INSTRUCTIONS.md

### Vanuit de uitjes-browser

De "Voeg toe aan vandaag"-knop op uitjeskaarten blijft. Die voegt het uitje toe aan dezelfde persistente balk als de dagbouwer. Zo kun je ook vanuit de browse-view een dag samenstellen.

