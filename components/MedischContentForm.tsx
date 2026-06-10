'use client'
import { useState } from 'react'

const TEMPLATE = JSON.stringify(
  {
    urgencyText: 'Korte Franse urgentietekst voor hulpverleners.',
    medicalLetter: 'Volledige Franse medische brief.',
    hospitals: [
      {
        name: 'Naam ziekenhuis',
        specialty: 'Specialisme',
        address: 'Adres',
        distance: 'ca. 1u30 van Les Escaliers (of null)',
        phone: '05 00 00 00 00',
        href: 'tel:0500000000',
      },
    ],
  },
  null,
  2,
)

interface Props {
  initialJson?: string
}

export default function MedischContentForm({ initialJson }: Props) {
  const [value, setValue] = useState(initialJson ?? TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/medisch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: value,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Opslaan mislukt.')
      }
      window.location.href = '/medisch'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.')
      setSaving(false)
    }
  }

  return (
    <section
      className="rounded-2xl p-4 mb-6 shadow-blue"
      style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
    >
      <h2 className="font-semibold text-on-surface mb-2">Medische gegevens invullen</h2>
      <p className="text-sm text-on-surface-variant mb-3">
        De persoonlijke medische gegevens staan niet in de app-code maar in een privé-opslag.
        Plak hieronder de medische JSON en sla op. Dit hoeft maar één keer.
      </p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={16}
        spellCheck={false}
        className="w-full rounded-xl p-3 text-xs text-on-surface font-mono resize-y focus:outline-none"
        style={{ background: 'white', border: '1px solid #E4D9C8' }}
      />
      {error && (
        <p className="text-sm mt-2" style={{ color: 'oklch(50% 0.15 25)' }}>{error}</p>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 rounded-full text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60"
        style={{ background: 'oklch(57% 0.14 40)' }}
      >
        {saving ? 'Opslaan…' : 'Opslaan'}
      </button>
    </section>
  )
}
