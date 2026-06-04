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
  { date: '12 juni', label: 'Dag 1 (heen)', from: 'Amersfoort', to: 'Atelier des Sens 89', duration: 'ca. 6 uur', via: 'Via Antwerpen, Reims, Troyes, Auxerre', type: 'heen' },
  { date: '13 juni', label: 'Dag 2 (heen)', from: 'Atelier des Sens 89', to: 'Les Escaliers', duration: 'ca. 5,5 uur', via: 'Via Châteauroux en Cahors', type: 'heen' },
  { date: '27 juni', label: 'Dag 1 (terug)', from: 'Les Escaliers', to: 'Chartres', duration: 'ca. 5,5 uur', via: 'Via Limoges en Orléans', type: 'terug' },
  { date: '28-29 juni', label: 'Chartres', from: '', to: '', duration: '2 nachten', via: 'Kathedraal (UNESCO), Chartres en Lumières', type: 'stop' },
  { date: '29 juni', label: 'Dag 3 (terug)', from: 'Chartres', to: 'Amersfoort', duration: 'ca. 6 uur', via: 'Via Amiens en Antwerpen', type: 'terug' },
]

const LEG_STYLES: Record<string, { bg: string; border: string }> = {
  heen:  { bg: 'oklch(92% 0.05 218)', border: 'oklch(65% 0.10 218)' },
  terug: { bg: 'oklch(93% 0.05 40)',  border: 'oklch(57% 0.14 40)' },
  stop:  { bg: 'oklch(92% 0.07 83)',  border: 'oklch(79% 0.16 83)' },
}

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
    <div className="px-4 pt-5">
      <h1
        className="text-3xl font-medium mb-4"
        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
      >
        Route
      </h1>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden shadow-blue mb-4 h-64"
        style={{ border: '1px solid #E4D9C8' }}
      >
        <RouteMap />
      </div>

      {/* Legend */}
      <div className="flex gap-5 mb-5">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <div className="w-6 h-0.5" style={{ background: 'oklch(65% 0.10 218)' }} />
          <span>Heenreis</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <div
            className="w-6 h-0.5"
            style={{ background: 'oklch(57% 0.14 40)', borderTop: '2px dashed oklch(57% 0.14 40)' }}
          />
          <span>Terugreis</span>
        </div>
      </div>

      {/* Journey legs */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Reisplan
        </div>
        <div className="flex flex-col gap-3">
          {LEGS.map((leg, i) => {
            const s = LEG_STYLES[leg.type]
            return (
              <div
                key={i}
                className="rounded-2xl border p-4"
                style={{ background: s.bg, borderColor: `${s.border}40` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#A8937A' }}>
                      {leg.date}
                    </p>
                    <p className="font-semibold text-on-surface">{leg.label}</p>
                    {leg.from && (
                      <p className="text-sm text-on-surface-variant">{leg.from} → {leg.to}</p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-1">{leg.via}</p>
                  </div>
                  <span
                    className="text-xs font-semibold rounded-full px-2 py-0.5"
                    style={{ background: 'rgba(255,255,255,0.7)', color: '#6B5A3E' }}
                  >
                    {leg.duration}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Verblijf */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Verblijf
        </div>
        <div
          className="rounded-2xl p-4 mb-3"
          style={{ background: 'oklch(93% 0.05 40)', border: '1px solid oklch(57% 0.14 40 / 0.2)' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>
              holiday_village
            </span>
            <div>
              <h3 className="font-semibold text-on-surface">Les Escaliers de La Combe</h3>
              <p className="text-xs text-on-surface-variant">Porte-du-Quercy · Eigenaren: Ilse & Coen</p>
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs"><span className="font-semibold">13–19 juni:</span> Safaritent</p>
                <p className="text-xs"><span className="font-semibold">20–27 juni:</span> Gîte L 🍄 (paddenstoelen-stapelbed voor Lena!)</p>
              </div>
              <a
                href="https://lesescaliers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold mt-2 block"
                style={{ color: 'oklch(65% 0.10 218)' }}
              >
                lesescaliers.com →
              </a>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-3"
          style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.2)' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>hotel</span>
            <div>
              <h3 className="font-semibold text-on-surface">Atelier des Sens 89</h3>
              <p className="text-xs text-on-surface-variant">Bourgondië · 12–13 juni</p>
              <p className="text-xs text-on-surface-variant mt-1">Studio met keuken, zwembad, table d&apos;hôtes</p>
              <a
                href="https://atelierdessens89.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold mt-2 block"
                style={{ color: 'oklch(65% 0.10 218)' }}
              >
                atelierdessens89.fr →
              </a>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.2)' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>hotel</span>
            <div>
              <h3 className="font-semibold text-on-surface">Hotel Henri IV</h3>
              <p className="text-xs text-on-surface-variant">Chartres · 27–29 juni</p>
              <p className="text-xs text-on-surface-variant mt-1">Parkeergarage onder het hotel. Kathedraal & lichtshows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tankstops */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Tankstops
        </div>
        {(['heen', 'terug'] as const).map(leg => (
          <div key={leg} className="mb-3">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              {leg === 'heen' ? 'Heenreis' : 'Terugreis'}
            </p>
            <div className="flex flex-col gap-2">
              {TANK_STOPS.filter(t => t.leg === leg).map(stop => (
                <div
                  key={stop.name}
                  className="rounded-2xl p-3"
                  style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.3)' }}
                >
                  <div className="flex items-start justify-between gap-2">
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
          </div>
        ))}
      </section>

      {/* Auto */}
      <section
        className="rounded-2xl p-4 mb-6 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
          Auto
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
