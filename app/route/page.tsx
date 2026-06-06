'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const LegMap = dynamic(() => import('@/components/LegMap'), { ssr: false })

// Route-coördinaten per leg
const HEEN_ROUTE: [number, number][] = [
  [52.155, 5.387],
  [51.22, 4.40],
  [49.259, 4.031],
  [48.856, 2.352],
  [47.798, 3.567],
  [47.077, 2.983],
  [46.562, 2.008],
  [45.148, 1.532],
  [44.398, 1.119],
]

const TERUG_ROUTE: [number, number][] = [
  [44.398, 1.119],
  [45.833, 1.261],
  [46.557, 1.980],
  [47.906, 1.904],
  [48.457, 1.490],
  [51.22, 4.40],
  [52.155, 5.387],
]

const HEEN_MARKERS = [
  { coords: [52.155, 5.387] as [number, number], label: 'Amersfoort', color: '#1E293B' },
  { coords: [47.861, 3.562] as [number, number], label: 'Atelier des Sens', color: '#4D96FF' },
  { coords: [44.398, 1.119] as [number, number], label: 'Les Escaliers', color: '#FF6B6B' },
]

const TERUG_MARKERS = [
  { coords: [44.398, 1.119] as [number, number], label: 'Les Escaliers', color: '#FF6B6B' },
  { coords: [48.447, 1.489] as [number, number], label: 'Chartres', color: '#4D96FF' },
  { coords: [52.155, 5.387] as [number, number], label: 'Amersfoort', color: '#1E293B' },
]

const TANK_STOPS = [
  {
    leg: 'heen',
    name: 'Aire de Nemours',
    highway: 'A6 (E15), afrit 16 bij Nemours',
    desc: 'Ruim parkeerterrein met Total station, brasserie en speelveldje buiten. Precies halverwege Parijs en Sens.',
    lena: 'Speelveldje aanwezig buiten de brasserie.',
    eetTip: 'Brasserie ter plaatse.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Nemours+A6',
  },
  {
    leg: 'heen',
    name: 'Aire de Souillac',
    highway: 'A20, nabij Souillac (km 515)',
    desc: "Mooie rustplek aan de Dordogne vallei. Total station, McDonald's én voldoende ruimte voor Lena. Nog 40 min tot Les Escaliers.",
    lena: "Ruim grasveld, McDonald's heeft speelhoek.",
    eetTip: "McDonald's of terras bij het tankstation.",
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Souillac+A20',
  },
  {
    leg: 'terug',
    name: 'Aire de Magnac-Laval',
    highway: 'A20, tussen Limoges en Châteauroux (km 390)',
    desc: 'Rustig parkeerterrein met groenstroken. BP tankstation, snackbar en schaduwrijke picknickplaats.',
    lena: 'Schaduwrijke picknickplaats met ruimte om te rennen.',
    eetTip: 'Snackbar of eigen picknick op de grasvlakte.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Magnac-Laval+A20',
  },
  {
    leg: 'terug',
    name: 'Aire de Thivars',
    highway: 'N10 / A11, vlak voor Chartres',
    desc: 'Laatste stop voor Chartres. Total station, boulangerie in het nabijgelegen dorp Thivars (300 m lopen). Perfect om de dag door te nemen.',
    lena: 'Groenstrook naast parkeerterrein.',
    eetTip: 'Boulangerie Thivars op 300 m lopen — vers brood en croissants.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+Thivars+N10+Chartres',
  },
]

export default function RoutePage() {
  const [arrivalLeg, setArrivalLeg] = useState('')
  const [arrivalSent, setArrivalSent] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<'heen' | 'terug'>('heen')

  const sendArrival = async (leg: string) => {
    await fetch('/api/safe-arrival', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leg }),
    })
    setArrivalSent(true)
    setShowDropdown(false)
  }

  return (
    <div className="px-4 pt-5 pb-28">
      <h1
        className="text-3xl font-medium mb-4"
        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
      >
        Route
      </h1>

      {/* Vertreklijst banner */}
      <a
        href="/vertreklijst"
        className="flex items-center gap-3 rounded-2xl p-4 mb-5 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8', textDecoration: 'none' }}
      >
        <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>
          checklist
        </span>
        <div className="flex-1">
          <p className="font-semibold text-on-surface text-sm">Vertreklijst</p>
          <p className="text-xs text-on-surface-variant">Check alles vóór de heenreis →</p>
        </div>
        <span className="material-symbols-outlined text-base" style={{ color: '#A8937A' }}>chevron_right</span>
      </a>

      {/* Tabs Heen / Terug */}
      <div
        className="flex rounded-2xl overflow-hidden p-1 mb-5"
        style={{ background: '#F0E9DA' }}
      >
        {([
          { value: 'heen',  label: 'Heenreis',  emoji: '🚗' },
          { value: 'terug', label: 'Terugreis', emoji: '🏠' },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            style={
              activeTab === t.value
                ? { background: '#FAF7F0', color: '#2C2316', boxShadow: '0 1px 3px rgba(44,35,22,0.1)' }
                : { color: '#A8937A' }
            }
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'heen' && (
        <HeenreisSection tankStops={TANK_STOPS.filter(t => t.leg === 'heen')} />
      )}

      {activeTab === 'terug' && (
        <TerugreisSection tankStops={TANK_STOPS.filter(t => t.leg === 'terug')} />
      )}

      {/* Verblijf Les Escaliers */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Verblijf
        </div>
        <div
          className="rounded-2xl p-4 shadow-blue"
          style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>
              holiday_village
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Les Escaliers de La Combe</h3>
              <p className="text-xs text-on-surface-variant">Porte-du-Quercy · Eigenaren: Ilse & Coen</p>
              <p className="text-xs text-on-surface-variant mt-1">La Combe, 82240 Porte-du-Quercy, France</p>
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs"><span className="font-semibold">13–19 juni:</span> Safaritent</p>
                <p className="text-xs"><span className="font-semibold">20–27 juni:</span> Gîte L 🍄 (paddenstoelen-stapelbed voor Lena!)</p>
              </div>
              <div className="flex gap-3 mt-2 flex-wrap">
                <a href="https://lesescaliers.com" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                  lesescaliers.com →
                </a>
                <a href="https://www.google.com/maps/search/?api=1&query=Les+Escaliers+de+La+Combe+Porte-du-Quercy" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                  Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* We zijn er! */}
      <section className="mb-8">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full rounded-2xl text-white font-semibold py-4 text-base flex items-center justify-center gap-2"
            style={{ background: 'oklch(57% 0.14 40)' }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
            We zijn er!
          </button>

          {showDropdown && (
            <div
              className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl overflow-hidden z-10"
              style={{ background: 'white', border: '1px solid #E4D9C8', boxShadow: '0 8px 24px rgba(44,35,22,0.15)' }}
            >
              {['Atelier des Sens', 'Les Escaliers', 'Chartres', 'Thuis'].map(leg => (
                <button
                  key={leg}
                  onClick={() => sendArrival(leg)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-surface transition-colors"
                  style={{ borderBottom: '1px solid #E4D9C8' }}
                >
                  {leg}
                </button>
              ))}
            </div>
          )}
        </div>

        {arrivalSent && (
          <div
            className="mt-3 rounded-2xl p-3 text-center"
            style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'oklch(40% 0.10 148)' }}>
              ✓ Aankomst gemeld! De thuisblijvers zijn op de hoogte.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function HeenreisSection({ tankStops }: { tankStops: typeof TANK_STOPS }) {
  return (
    <div className="mb-6">
      {/* Kaart heenreis */}
      <div
        className="rounded-2xl overflow-hidden shadow-blue mb-4 h-52"
        style={{ border: '1px solid #E4D9C8' }}
      >
        <LegMap
          route={HEEN_ROUTE}
          markers={HEEN_MARKERS}
          color="#4D96FF"
        />
      </div>

      {/* Etappes */}
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Etappes heenreis
      </div>
      <div className="flex flex-col gap-3 mb-5">
        <EtappeCard
          date="12 juni"
          label="Dag 1 — Amersfoort → Atelier des Sens"
          from="Amersfoort"
          to="Atelier des Sens 89"
          duration="ca. 6 uur"
          via="Via Antwerpen, Reims, Troyes, Auxerre"
          color="oklch(65% 0.10 218)"
          mapsUrl="https://www.google.com/maps/dir/Amersfoort/Venoy+89270+France"
        />
        <EtappeCard
          date="13 juni"
          label="Dag 2 — Atelier des Sens → Les Escaliers"
          from="Atelier des Sens 89"
          to="Les Escaliers"
          duration="ca. 5,5 uur"
          via="Via Châteauroux en Cahors"
          color="oklch(65% 0.10 218)"
          mapsUrl="https://www.google.com/maps/dir/Venoy+89270+France/Porte-du-Quercy+82240+France"
        />
      </div>

      {/* Overnachting heenreis */}
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Overnachting (12 juni)
      </div>
      <div
        className="rounded-2xl p-4 mb-5 shadow-blue"
        style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.2)' }}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>hotel</span>
          <div className="flex-1">
            <h3 className="font-semibold text-on-surface">Atelier des Sens 89</h3>
            <p className="text-xs text-on-surface-variant">Route du Moulin Neuf, 89270 Venoy, France</p>
            <p className="text-xs text-on-surface-variant mt-1">Studio met keuken · zwembad · table d&apos;hôtes</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <a href="https://atelierdessens89.fr" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                atelierdessens89.fr →
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=Atelier+des+Sens+89+Venoy" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tankstops heenreis */}
      <TankStopsSection stops={tankStops} />
    </div>
  )
}

function TerugreisSection({ tankStops }: { tankStops: typeof TANK_STOPS }) {
  return (
    <div className="mb-6">
      {/* Kaart terugreis */}
      <div
        className="rounded-2xl overflow-hidden shadow-blue mb-4 h-52"
        style={{ border: '1px solid #E4D9C8' }}
      >
        <LegMap
          route={TERUG_ROUTE}
          markers={TERUG_MARKERS}
          color="oklch(57% 0.14 40)"
          dashed
        />
      </div>

      {/* Etappes */}
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Etappes terugreis
      </div>
      <div className="flex flex-col gap-3 mb-5">
        <EtappeCard
          date="27 juni"
          label="Dag 1 — Les Escaliers → Chartres"
          from="Les Escaliers"
          to="Chartres"
          duration="ca. 5,5 uur"
          via="Via Limoges en Orléans"
          color="oklch(57% 0.14 40)"
          mapsUrl="https://www.google.com/maps/dir/Porte-du-Quercy+82240+France/Chartres+28000+France"
        />
        <EtappeCard
          date="28-29 juni"
          label="Chartres — 2 nachten"
          from=""
          to=""
          duration="2 nachten"
          via="Kathedraal (UNESCO) · Chartres en Lumières"
          color="oklch(79% 0.16 83)"
          isStop
        />
        <EtappeCard
          date="29 juni"
          label="Dag 3 — Chartres → Amersfoort"
          from="Chartres"
          to="Amersfoort"
          duration="ca. 6 uur"
          via="Via Amiens en Antwerpen"
          color="oklch(57% 0.14 40)"
          mapsUrl="https://www.google.com/maps/dir/Chartres+28000+France/Amersfoort+Nederland"
        />
      </div>

      {/* Overnachting terugreis */}
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Overnachting (27–29 juni)
      </div>
      <div
        className="rounded-2xl p-4 mb-5 shadow-blue"
        style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.2)' }}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>hotel</span>
          <div className="flex-1">
            <h3 className="font-semibold text-on-surface">Hotel Henri IV</h3>
            <p className="text-xs text-on-surface-variant">31 Rue du Soleil d&apos;Or, 28000 Chartres, France</p>
            <p className="text-xs text-on-surface-variant mt-1">Parkeergarage onder het hotel · kathedraal op loopafstand</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <a href="https://www.google.com/maps/search/?api=1&query=Hotel+Henri+IV+Chartres" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>
                Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tankstops terugreis */}
      <TankStopsSection stops={tankStops} />
    </div>
  )
}

function EtappeCard({
  date, label, from, to, duration, via, color, mapsUrl, isStop,
}: {
  date: string; label: string; from: string; to: string
  duration: string; via: string; color: string
  mapsUrl?: string; isStop?: boolean
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: isStop ? 'oklch(92% 0.07 83)' : 'oklch(92% 0.05 218)',
        borderColor: `${color}40`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#A8937A' }}>{date}</p>
          <p className="font-semibold text-on-surface text-sm">{label}</p>
          {from && (
            <p className="text-xs text-on-surface-variant mt-0.5">{from} → {to}</p>
          )}
          <p className="text-xs text-on-surface-variant mt-1">{via}</p>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold mt-1.5 inline-flex items-center gap-1"
              style={{ color: 'oklch(65% 0.10 218)' }}
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Route op kaart
            </a>
          )}
        </div>
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#6B5A3E' }}
        >
          {duration}
        </span>
      </div>
    </div>
  )
}

function TankStopsSection({ stops }: { stops: typeof TANK_STOPS }) {
  return (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
        Tankstops
      </div>
      <div className="flex flex-col gap-3 mb-5">
        {stops.map(stop => (
          <div
            key={stop.name}
            className="rounded-2xl p-3"
            style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.3)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm text-on-surface">{stop.name}</p>
                <p className="text-xs text-on-surface-variant font-medium">{stop.highway}</p>
                <p className="text-xs text-on-surface-variant mt-1">{stop.desc}</p>
              </div>
              <span
                className="material-symbols-outlined text-xl flex-shrink-0"
                style={{ color: 'oklch(79% 0.16 83)', fontVariationSettings: "'FILL' 1" }}
              >
                local_gas_station
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#6B5A3E' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>child_care</span>
                {stop.lena}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs mt-1" style={{ color: '#6B5A3E' }}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              {stop.eetTip}
            </div>
            <a
              href={stop.gmaps}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold mt-2 block"
              style={{ color: 'oklch(65% 0.10 218)' }}
            >
              Maps →
            </a>
          </div>
        ))}
      </div>
    </>
  )
}
