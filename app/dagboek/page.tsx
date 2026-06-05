'use client'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { DiaryEntry, PhotoMeta } from '@/lib/types'

const MOODS = [
  { emoji: '😴', label: 'Moe' },
  { emoji: '🙂', label: 'Goed' },
  { emoji: '😄', label: 'Geweldig' },
  { emoji: '🥰', label: 'Zalig' },
  { emoji: '🤩', label: 'Episch' },
]

const VACATION_DAYS: string[] = Array.from({ length: 15 }, (_, i) => {
  const d = new Date('2025-06-13')
  d.setDate(d.getDate() + i)
  return d.toISOString().split('T')[0]
})

export default function DagboekPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [photos, setPhotos] = useState<Record<string, PhotoMeta[]>>({})
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Record<string, string[]>>({})
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [loadingPhotos, setLoadingPhotos] = useState<string | null>(null)
  const [reisverhaal, setReisverhaal] = useState<string | null>(null)
  const [generatingVerhaal, setGeneratingVerhaal] = useState(false)
  const [showVerhaal, setShowVerhaal] = useState(false)

  useEffect(() => {
    fetch('/api/diary')
      .then(r => r.json())
      .then((data: DiaryEntry[]) => {
        const map: Record<string, DiaryEntry> = {}
        data.forEach(e => { map[e.date] = e })
        setEntries(map)
      })
      .catch(() => {})

    try {
      const saved = localStorage.getItem('dagboek_selected_photos')
      if (saved) setSelectedPhotoIds(JSON.parse(saved))
    } catch {}
  }, [])

  const filledEntries = Object.values(entries).filter(e => e.actual_text || e.mood_emoji)

  const loadPhotos = async (date: string) => {
    if (photos[date] !== undefined || !session?.accessToken) return
    setLoadingPhotos(date)
    try {
      const res = await fetch(`/api/photos?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setPhotos(prev => ({ ...prev, [date]: data }))
      } else {
        setPhotos(prev => ({ ...prev, [date]: [] }))
      }
    } catch {
      setPhotos(prev => ({ ...prev, [date]: [] }))
    } finally {
      setLoadingPhotos(null)
    }
  }

  const handleExpand = (date: string) => {
    if (expandedDay === date) {
      setExpandedDay(null)
    } else {
      setExpandedDay(date)
      loadPhotos(date)
    }
  }

  const saveEntry = async (date: string, updates: Partial<DiaryEntry>) => {
    setSaving(date)
    const current = entries[date] || { date }
    const merged = { ...current, ...updates }
    const res = await fetch('/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    })
    if (res.ok) {
      const saved = await res.json()
      setEntries(prev => ({ ...prev, [date]: saved }))
    }
    setSaving(null)
  }

  const togglePhotoSelection = (date: string, photoId: string, allPhotoIds: string[]) => {
    setSelectedPhotoIds(prev => {
      const current = prev[date] ?? allPhotoIds
      const next = current.includes(photoId)
        ? current.filter(id => id !== photoId)
        : [...current, photoId]
      const updated = { ...prev, [date]: next }
      localStorage.setItem('dagboek_selected_photos', JSON.stringify(updated))
      return updated
    })
  }

  const getSelectedPhotos = (date: string): PhotoMeta[] => {
    const dayPhotos = photos[date] || []
    const sel = selectedPhotoIds[date]
    if (!sel) return dayPhotos
    return dayPhotos.filter(p => sel.includes(p.id))
  }

  const generateStory = async (date: string) => {
    setGenerating(date)
    const entry = entries[date] || {}
    const res = await fetch('/api/diary-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        plan_text: entry.plan_text,
        actual_text: entry.actual_text,
        mood_emoji: entry.mood_emoji,
        photos: getSelectedPhotos(date),
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setEntries(prev => ({ ...prev, [date]: { ...(prev[date] || { date }), story_text: data.story_text } }))
    }
    setGenerating(null)
  }

  const generateReisverhaal = async () => {
    setGeneratingVerhaal(true)
    const entriesArray = Object.values(entries)
    const res = await fetch('/api/reisverhaal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: entriesArray }),
    })
    if (res.ok) {
      const data = await res.json()
      setReisverhaal(data.verhaal)
      setShowVerhaal(true)
    }
    setGeneratingVerhaal(false)
  }

  if (showVerhaal && reisverhaal) {
    return (
      <div className="px-4 pt-5 pb-10">
        <button
          onClick={() => setShowVerhaal(false)}
          className="flex items-center gap-2 text-sm font-semibold mb-4"
          style={{ color: 'oklch(57% 0.14 40)' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Terug naar dagboek
        </button>
        <h1
          className="text-3xl font-medium mb-2"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Ons reisverhaal
        </h1>
        <p className="text-xs text-on-surface-variant mb-6">Notre Voyage — Lot, Zuid-Frankrijk, 2025</p>
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'linear-gradient(145deg, oklch(94% 0.04 75), oklch(96% 0.025 60))', border: '1px solid #E4D9C8' }}
        >
          <p
            className="text-base leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
          >
            {reisverhaal}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full rounded-2xl border-2 py-3 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ borderColor: '#E4D9C8', color: '#6B5A3E' }}
        >
          <span className="material-symbols-outlined text-sm">print</span>
          Afdrukken
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-3xl font-medium"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Dagboek
        </h1>
      </div>

      {/* Google Photos connected */}
      {session && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center gap-3"
          style={{ background: 'oklch(92% 0.05 148)', border: '1px solid oklch(58% 0.10 148 / 0.3)' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'oklch(58% 0.10 148)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'oklch(35% 0.08 148)' }}>Google Photos gekoppeld</p>
            <p className="text-xs" style={{ color: 'oklch(45% 0.08 148)' }}>Klap een dag open om de foto&apos;s van die dag te zien.</p>
          </div>
        </div>
      )}

      {/* Google Photos onboarding */}
      {!session && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: 'oklch(92% 0.05 218)', border: '1px solid oklch(65% 0.10 218 / 0.25)' }}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-3xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>photo_library</span>
            <div className="flex-1">
              <p className="font-semibold text-on-surface">Koppel Google Photos</p>
              <p className="text-sm text-on-surface-variant mt-1">
                Koppel je Google account om foto&apos;s van de dag automatisch te zien bij elke dagboekkaart.
              </p>
              <button
                onClick={() => signIn('google', { callbackUrl: '/dagboek' })}
                className="mt-3 rounded-full text-white text-sm font-semibold px-4 py-2 flex items-center gap-2"
                style={{ background: 'oklch(65% 0.10 218)' }}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                Inloggen met Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reisverhaal knop — alleen zichtbaar na 3+ entries */}
      {filledEntries.length >= 3 && (
        <button
          onClick={generateReisverhaal}
          disabled={generatingVerhaal}
          className="w-full rounded-2xl p-4 mb-5 flex items-center gap-3 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, oklch(76% 0.18 83), oklch(66% 0.17 58))' }}
        >
          <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {generatingVerhaal ? 'refresh' : 'auto_stories'}
          </span>
          <div className="text-left">
            <p className="font-semibold text-white">
              {generatingVerhaal ? 'Reisverhaal schrijven…' : 'Maak ons reisverhaal'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Claude schrijft een warm verhaal van jullie vakantie
            </p>
          </div>
        </button>
      )}

      <div className="flex flex-col gap-3">
        {VACATION_DAYS.map(date => {
          const entry = entries[date] || { date }
          const isExpanded = expandedDay === date
          const dayPhotos = photos[date] || []
          const dateObj = new Date(date + 'T12:00:00')
          const hasContent = entry.actual_text || entry.mood_emoji || entry.story_text
          const weekday = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })
          const dayNum = dateObj.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })

          return (
            <div
              key={date}
              className="rounded-2xl overflow-hidden shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <button
                onClick={() => handleExpand(date)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#A8937A' }}>
                    {weekday}
                  </p>
                  <p className="font-semibold text-on-surface">{dayNum}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                    {entry.mood_emoji && <span>{entry.mood_emoji}</span>}
                    {hasContent ? 'Ingevuld' : 'Nog niet ingevuld'}
                  </p>
                </div>
                <span
                  className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                >
                  expand_more
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid #E4D9C8' }}>
                  {/* Photo grid met selectie */}
                  {session && (
                    <div className="mt-3 mb-3">
                      {loadingPhotos === date ? (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant py-1">
                          <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                          Foto&apos;s laden…
                        </div>
                      ) : dayPhotos.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                              Foto&apos;s ({(selectedPhotoIds[date] ?? dayPhotos.map(p => p.id)).length}/{dayPhotos.length} geselecteerd)
                            </p>
                            <button
                              onClick={() => {
                                const allIds = dayPhotos.map(p => p.id)
                                const current = selectedPhotoIds[date] ?? allIds
                                const allSelected = current.length === allIds.length
                                const updated = { ...selectedPhotoIds, [date]: allSelected ? [] : allIds }
                                setSelectedPhotoIds(updated)
                                localStorage.setItem('dagboek_selected_photos', JSON.stringify(updated))
                              }}
                              className="text-[10px] font-semibold"
                              style={{ color: 'oklch(65% 0.10 218)' }}
                            >
                              {(selectedPhotoIds[date] ?? dayPhotos.map(p => p.id)).length === dayPhotos.length ? 'Geen' : 'Alle'}
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {dayPhotos.map(p => {
                              const allIds = dayPhotos.map(pp => pp.id)
                              const isSelected = (selectedPhotoIds[date] ?? allIds).includes(p.id)
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => togglePhotoSelection(date, p.id, allIds)}
                                  className="relative aspect-square rounded-xl overflow-hidden"
                                >
                                  <img
                                    src={`${p.baseUrl}=w200-h200-c`}
                                    alt={p.filename}
                                    className="w-full h-full object-cover transition-opacity"
                                    style={{ opacity: isSelected ? 1 : 0.35 }}
                                  />
                                  <div
                                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={isSelected
                                      ? { background: 'oklch(58% 0.10 148)' }
                                      : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(255,255,255,0.8)' }
                                    }
                                  >
                                    {isSelected && (
                                      <svg width="10" height="10" viewBox="0 0 10 10">
                                        <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </>
                      ) : photos[date] !== undefined ? (
                        <p className="text-xs text-on-surface-variant italic">Geen foto&apos;s op deze dag gevonden in Google Photos.</p>
                      ) : null}
                    </div>
                  )}

                  {/* Plan text */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(65% 0.10 218)' }} />
                      <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                        Gepland
                      </label>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {entry.plan_text
                        ? (typeof entry.plan_text === 'string' && entry.plan_text.startsWith('{')
                          ? JSON.parse(entry.plan_text).stops?.map((s: { name: string }) => s.name).join(' → ')
                          : entry.plan_text)
                        : 'Geen plan gemaakt.'}
                    </p>
                  </div>

                  {/* Actual text */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(57% 0.14 40)' }} />
                      <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                        Wat echt gebeurde
                      </label>
                    </div>
                    <textarea
                      value={entry.actual_text || ''}
                      onChange={e => setEntries(prev => ({ ...prev, [date]: { ...entry, actual_text: e.target.value } }))}
                      onBlur={() => saveEntry(date, { actual_text: entry.actual_text })}
                      placeholder="Schrijf wat jullie echt hebben gedaan…"
                      rows={3}
                      className="w-full mt-1 rounded-xl p-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none"
                      style={{
                        background: 'white',
                        border: '1px solid #E4D9C8',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'oklch(57% 0.14 40)')}
                    />
                  </div>

                  {/* Mood */}
                  <div className="mb-4">
                    <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                      Stemming van de dag
                    </label>
                    <div className="flex gap-2 mt-2">
                      {MOODS.map(m => (
                        <button
                          key={m.emoji}
                          onClick={() => saveEntry(date, { mood_emoji: m.emoji })}
                          className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all"
                          style={
                            entry.mood_emoji === m.emoji
                              ? {
                                  background: 'oklch(92% 0.07 83)',
                                  border: '2px solid oklch(79% 0.16 83)',
                                  boxShadow: '0 2px 8px oklch(79% 0.16 83 / 0.3)',
                                }
                              : {
                                  background: '#FAF7F0',
                                  border: '2px solid transparent',
                                  boxShadow: '0 1px 3px rgba(44,35,22,0.06), 0 0 0 1px rgba(44,35,22,0.05)',
                                }
                          }
                        >
                          <span className="text-xl">{m.emoji}</span>
                          <span
                            className="text-[9px] font-semibold"
                            style={{ color: entry.mood_emoji === m.emoji ? '#6B5A3E' : '#A8937A' }}
                          >
                            {m.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI story */}
                  {entry.story_text && (
                    <div
                      className="rounded-2xl p-4 mb-3 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, oklch(94% 0.04 75), oklch(96% 0.025 60))',
                        border: '1px solid #E4D9C8',
                      }}
                    >
                      <div
                        className="absolute top-2 right-4 text-6xl leading-none pointer-events-none select-none"
                        style={{ fontFamily: 'var(--font-journal)', color: 'oklch(57% 0.14 40)', opacity: 0.12 }}
                      >
                        &quot;
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs" style={{ color: 'oklch(79% 0.16 83)' }}>✦</span>
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#A8937A' }}>
                          Dagboekverhaal
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
                      >
                        {entry.story_text}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => generateStory(date)}
                      disabled={generating === date}
                      className="flex-1 rounded-2xl text-white text-sm font-semibold py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'oklch(57% 0.14 40)' }}
                    >
                      {generating === date ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                          Schrijven…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                          Maak er een verhaal van
                        </>
                      )}
                    </button>
                    {saving === date && (
                      <span className="text-xs text-on-surface-variant flex items-center">Opslaan…</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
