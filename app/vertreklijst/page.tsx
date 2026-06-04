'use client'
import { useState, useEffect } from 'react'

interface CheckItem {
  id: string
  label: string
}

interface CheckCategory {
  title: string
  icon: string
  items: CheckItem[]
}

const CHECKLIST: CheckCategory[] = [
  {
    title: 'Documenten',
    icon: 'description',
    items: [
      { id: 'doc1', label: 'Paspoorten' },
      { id: 'doc2', label: 'Rijbewijs' },
      { id: 'doc3', label: 'EHIC-kaart (Europese zorgpas)' },
      { id: 'doc4', label: 'Kopie röntgenfoto (papier + telefoon)' },
      { id: 'doc5', label: 'Autoverzekeringspapieren KWA/Allianz' },
      { id: 'doc6', label: 'Reserveringsbevestigingen' },
    ],
  },
  {
    title: 'Auto (check bij Bart)',
    icon: 'directions_car',
    items: [
      { id: 'auto1', label: 'Gevarendriehoek (verplicht in Frankrijk)' },
      { id: 'auto2', label: 'Reflecterende hesjes (verplicht, 1 per inzittende)' },
      { id: 'auto3', label: 'Bandenspanning' },
      { id: 'auto4', label: 'Olie' },
      { id: 'auto5', label: 'Ruitenwisservloeistof' },
    ],
  },
  {
    title: 'Lena',
    icon: 'child_care',
    items: [
      { id: 'lena1', label: 'Knuffels en slaapspullen' },
      { id: 'lena2', label: 'Zwemluier / zwemspullen' },
      { id: 'lena3', label: 'Buggy' },
      { id: 'lena4', label: 'Lievelingsboekjes' },
      { id: 'lena5', label: 'Snacks voor onderweg' },
    ],
  },
  {
    title: 'Praktisch',
    icon: 'backpack',
    items: [
      { id: 'pr1', label: 'Telefoonopladers + autolader' },
      { id: 'pr2', label: 'Zonnebrand' },
      { id: 'pr3', label: 'EHBO-setje' },
      { id: 'pr4', label: 'Contant geld' },
      { id: 'pr5', label: 'Boodschappentas' },
      { id: 'pr6', label: 'Zwemspullen' },
    ],
  },
  {
    title: 'Digitaal',
    icon: 'phone_iphone',
    items: [
      { id: 'dig1', label: 'App offline beschikbaar gemaakt' },
      { id: 'dig2', label: 'Google Photos album aangemaakt' },
      { id: 'dig3', label: "Thuisblijvers-URL gedeeld" },
    ],
  },
]

const ALL_IDS = CHECKLIST.flatMap(c => c.items.map(i => i.id))
const STORAGE_KEY = 'vertreklijst_checked'

export default function VertreklijstPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setChecked(new Set(JSON.parse(saved)))
  }, [])

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const progress = Math.round((checked.size / ALL_IDS.length) * 100)
  const allDone = checked.size === ALL_IDS.length

  return (
    <div className="px-4 pt-5 pb-10">
      <h1
        className="text-3xl font-medium mb-1"
        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
      >
        Vertreklijst
      </h1>
      <p className="text-sm text-on-surface-variant mb-5">Alles klaar voor de heenreis?</p>

      {/* Voortgangsbalk */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: allDone ? 'oklch(92% 0.05 148)' : '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-on-surface">
            {allDone ? '🎉 Alles is geregeld!' : `${checked.size} van ${ALL_IDS.length} items afgevinkt`}
          </p>
          <p className="text-sm font-bold" style={{ color: 'oklch(57% 0.14 40)' }}>{progress}%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E4D9C8' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: allDone ? 'oklch(58% 0.10 148)' : 'oklch(57% 0.14 40)',
            }}
          />
        </div>
      </div>

      {/* Categorieën */}
      <div className="flex flex-col gap-4">
        {CHECKLIST.map(cat => {
          const catChecked = cat.items.filter(i => checked.has(i.id)).length
          const catDone = catChecked === cat.items.length

          return (
            <div
              key={cat.title}
              className="rounded-2xl overflow-hidden shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid #E4D9C8' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: catDone ? 'oklch(58% 0.10 148)' : 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}
                  >
                    {catDone ? 'check_circle' : cat.icon}
                  </span>
                  <h2 className="font-semibold text-on-surface">{cat.title}</h2>
                </div>
                <span className="text-xs text-on-surface-variant">{catChecked}/{cat.items.length}</span>
              </div>

              <div className="px-4 py-2">
                {cat.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                    style={{ borderBottom: '1px solid #F0E9DA' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all"
                      style={{
                        background: checked.has(item.id) ? 'oklch(57% 0.14 40)' : 'transparent',
                        borderColor: checked.has(item.id) ? 'oklch(57% 0.14 40)' : '#D4C5B0',
                      }}
                    >
                      {checked.has(item.id) && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color: checked.has(item.id) ? '#A8937A' : '#2C2316',
                        textDecoration: checked.has(item.id) ? 'line-through' : 'none',
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset knop */}
      {checked.size > 0 && (
        <button
          onClick={() => {
            setChecked(new Set())
            localStorage.removeItem(STORAGE_KEY)
          }}
          className="w-full mt-6 rounded-2xl border-2 py-3 text-sm font-semibold"
          style={{ borderColor: '#E4D9C8', color: '#A8937A' }}
        >
          Alles resetten
        </button>
      )}
    </div>
  )
}
