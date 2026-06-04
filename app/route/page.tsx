'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false })

const TANK_STOPS = [
  {
    leg: 'heen',
    name: 'Aire de Nemours',
    highway: 'A6 (E15), afrit 16 bij Nemours',
    desc: 'Ruim parkeerterrein met Total station, brasserie en speelveldje buiten. Precies halverwege Parijs en Sens.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Nemours+A6',
  },
  {
    leg: 'heen',
    name: 'Aire de Souillac',
    highway: 'A20, nabij Souillac (km 515)',
    desc: 'Mooie rustplek aan de Dordogne vallei. Total station, McDonald\'s én voldoende ruimte voor Lena. Nog 40 min tot Les Escaliers.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Souillac+A20',
  },
  {
    leg: 'terug',
    name: 'Aire de Magnac-Laval',
    highway: 'A20, tussen Limoges en Châteauroux (km 390)',
    desc: 'Rustig parkeerterrein met groenstroken. BP tankstation, snackbar en schaduwrijke picknickplaats.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+de+Magnac-Laval+A20',
  },
  {
    leg: 'terug',
    name: 'Aire de Thivars',
    highway: 'N10 / A11, vlak voor Chartres',
    desc: 'Laatste stop voor Chartres. Total station, boulangerie in het nabijgelegen dorp Thivars (300 m lopen). Perfect om de dag door te nemen.',
    gmaps: 'https://www.google.com/maps/search/?api=1&query=Aire+Thivars+N10+Chartres',
  },
]

const LEGS = [
  { date: '12 juni', label: 'Dag 1 (heen)', from: 'Amersfoort', to: 'Atelier des Sens 89', duration: 'ca. 6 uur', via: 'Via Antwerpen, Reims, Troyes, Auxerre', color: 'bg-tertiary/10 border-tertiary/20' },
  { date: '13 juni', label: 'Dag 2 (heen)', from: 'Atelier des Sens 89', to: 'Les Escaliers', duration: 'ca. 5,5 uur', via: 'Via Châteauroux en Cahors', color: 'bg-tertiary/10 border-tertiary/20' },
  { date: '27 juni', label: 'Dag 1 (terug)', from: 'Les Escaliers', to: 'Chartres', duration: 'ca. 5,5 uur', via: 'Via Limoges en Orléans', color: 'bg-primary/10 border-primary/20' },
  { date: '28-29 juni', label: 'Chartres', from: '', to: '', duration: '2 nachten', via: 'Kathedraal (UNESCO), Chartres en Lumières', color: 'bg-secondary/20 border-secondary/40' },
  { date: '29 juni', label: 'Dag 3 (terug)', from: 'Chartres', to: 'Amersfoort', duration: 'ca. 6 uur', via: 'Via Amiens en Antwerpen', color: 'bg-primary/10 border-primary/20' },
]

export default function RoutePage() {
  const [arrivalLeg, setArrivalLeg] = useState('')
  const [arrivalSent, setArrivalSent] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

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
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-on-surface mb-4">Route</h1>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-outline-variant shadow-blue mb-6 h-64">
        <RouteMap />
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <div className="w-6 h-0.5 bg-tertiary" />
          <span>Heenreis</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <div className="w-6 h-0.5 bg-primary border-dashed border" style={{ borderStyle: 'dashed' }} />
          <span>Terugreis</span>
        </div>
      </div>

      {/* Journey legs */}
      <section className="mb-6">
        <h2 className="font-bold text-on-surface mb-3">Reisplan</h2>
        <div className="flex flex-col gap-3">
          {LEGS.map((leg, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${leg.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant">{leg.date}</p>
                  <p className="font-bold text-on-surface">{leg.label}</p>
                  {leg.from && <p className="text-sm text-on-surface-variant">{leg.from} → {leg.to}</p>}
                  <p className="text-xs text-on-surface-variant mt-1">{leg.via}</p>
                </div>
                <span className="text-xs font-bold text-on-surface bg-white/60 rounded-full px-2 py-0.5">{leg.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verblijf */}
      <section className="mb-6">
        <h2 className="font-bold text-on-surface mb-3">Verblijf</h2>
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>holiday_village</span>
            <div>
              <h3 className="font-bold text-on-surface">Les Escaliers de La Combe</h3>
              <p className="text-xs text-on-surface-variant">Porte-du-Quercy · Eigenaren: Ilse & Coen</p>
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs"><span className="font-semibold">13–19 juni:</span> Safaritent</p>
                <p className="text-xs"><span className="font-semibold">20–27 juni:</span> Gîte L 🍄 (paddenstoelen-stapelbed voor Lena!)</p>
              </div>
              <a href="https://lesescaliers.com" target="_blank" rel="noopener noreferrer" className="text-xs text-tertiary font-semibold mt-2 block">
                lesescaliers.com →
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-tertiary/10 border border-tertiary/20 p-4 mt-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span>
            <div>
              <h3 className="font-bold text-on-surface">Atelier des Sens 89</h3>
              <p className="text-xs text-on-surface-variant">Bourgondië · 12–13 juni</p>
              <p className="text-xs text-on-surface-variant mt-1">Studio met keuken, zwembad, table d&apos;hôtes</p>
              <a href="https://atelierdessens89.fr" target="_blank" rel="noopener noreferrer" className="text-xs text-tertiary font-semibold mt-2 block">
                atelierdessens89.fr →
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-tertiary/10 border border-tertiary/20 p-4 mt-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span>
            <div>
              <h3 className="font-bold text-on-surface">Hotel Henri IV</h3>
              <p className="text-xs text-on-surface-variant">Chartres · 27–29 juni</p>
              <p className="text-xs text-on-surface-variant mt-1">Parkeergarage onder het hotel. Kathedraal & lichtshows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tankstops */}
      <section className="mb-6">
        <h2 className="font-bold text-on-surface mb-3">Tankstops</h2>
        {['heen', 'terug'].map(leg => (
          <div key={leg} className="mb-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">
              {leg === 'heen' ? 'Heenreis' : 'Terugreis'}
            </p>
            <div className="flex flex-col gap-2">
              {TANK_STOPS.filter(t => t.leg === leg).map(stop => (
                <div key={stop.name} className="rounded-2xl bg-secondary/10 border border-secondary/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-on-surface">{stop.name}</p>
                      <p className="text-xs text-on-surface-variant font-medium">{stop.highway}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{stop.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-secondary/80 text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>local_gas_station</span>
                  </div>
                  <a href={stop.gmaps} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-tertiary mt-2 block">
                    Maps →
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Auto */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-6 shadow-blue">
        <h2 className="font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          Auto
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-on-surface-variant">Auto</p>
            <p className="font-semibold">Honda CR-V</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Kleur</p>
            <p className="font-semibold">Donkerblauw metallic</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Kenteken</p>
            <p className="font-semibold font-mono">P-162-KB</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Verzekering</p>
            <p className="font-semibold">Allianz all-risk</p>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">Nul eigen risico · Honda Assistance Europese dekking</p>
      </section>

      {/* We zijn er! */}
      <section className="mb-8">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full rounded-full bg-primary text-white font-bold py-4 text-base flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
            We zijn er!
          </button>

          {showDropdown && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden z-10">
              {['Atelier des Sens', 'Les Escaliers', 'Chartres', 'Thuis'].map(leg => (
                <button
                  key={leg}
                  onClick={() => sendArrival(leg)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-surface border-b border-outline-variant last:border-0"
                >
                  {leg}
                </button>
              ))}
            </div>
          )}
        </div>

        {arrivalSent && (
          <div className="mt-3 rounded-2xl bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-sm font-semibold text-green-700">✓ Aankomst gemeld! De thuisblijvers zijn op de hoogte.</p>
          </div>
        )}
      </section>
    </div>
  )
}
