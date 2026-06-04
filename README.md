# Zomervakantie 2026 vakantiehub

Een private, mobiele React/Vite reisgenoot voor de familievakantie naar **Les Escaliers de La Combe** in juni 2026. De app bundelt vandaagadvies, weer, verblijf, route, kaart, praktische plekken, thuisfrontinformatie, medische noodsamenvatting en checklists.

## Starten

```bash
npm install
npm run dev
```

Voor een productiebuild:

```bash
npm run build
```

## Inhoud aanpassen

Alle reisinhoud staat als getypte data in `src/data`:

- `trip.ts` — algemene reisgegevens, hoofdverblijf en verblijfssplit.
- `route.ts` — heenreis, terugreis, overnachtingen en TODO-velden.
- `places.ts` — kaartplekken, uitjes, restaurants, praktische en medische TODO-plekken.
- `medical.ts` — casual PIN, medische samenvatting en Franse brief.
- `checklists.ts` — checklistgroepen en standaarditems.
- `archive.ts` — oude vakantievergelijking als onopvallend archief.

Pagina's en componenten lezen deze data in; vermijd hardcoded reisinhoud in page components.

## Afbeeldingen toevoegen

Plaats lokale beelden in `public`:

- Auto: `public/images/car-honda-crv.jpg` → gebruikt als `/images/car-honda-crv.jpg`.
- Kaak-röntgenfoto: `public/medical/kaak-rontgen.jpg` → gebruikt als `/medical/kaak-rontgen.jpg`.

Als de bestanden ontbreken, blijft de app bruikbaar en toont/verbergt hij de afbeelding netjes.

## Medische PIN instellen

De medische pagina gebruikt alleen een casual PIN-gate om toevallig meekijken te beperken. Dit is **geen echte beveiliging** en vervangt geen login of encryptie.

Wijzig de PIN in:

```ts
// src/data/medical.ts
export const medicalPin = '2026';
```

## Weer

De Vandaag-pagina haalt weer op via Open-Meteo voor Les Escaliers:

- latitude `44.521`
- longitude `1.150`
- timezone `Europe/Paris`

De advieslogica staat in `src/utils/weather.ts`.

## Checklists

Checkliststatus wordt alleen lokaal opgeslagen in de browser via LocalStorage. Er is geen database, account of synchronisatie.

## Deployen

Elke statische host voor Vite werkt, bijvoorbeeld Netlify, Vercel, GitHub Pages of een eigen webserver:

1. Run `npm run build`.
2. Upload de map `dist`.
3. Controleer of de host SPA fallback naar `index.html` ondersteunt voor React Router routes.
4. Voeg de privébeelden toe vóór het deployen als ze mee moeten.

## Privacy

- Er staan geen privételefoonnummers van Jasper/Hilda in de broncode.
- Publieke accommodatie- en bedrijfscontactgegevens zijn opgenomen.
- Medische informatie staat alleen achter de casual PIN en niet op de homepage, behalve via de noodknop naar de medische pagina.
