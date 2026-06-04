'use client'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { DiaryEntry, PhotoMeta } from '@/lib/types'

const MOODS = ['😎', '🌧️', '😴', '🎉', '🤩']

const VACATION_DAYS: string[] = Array.from({ length: 15 }, (_, i) => {
  const d = new Date('2025-06-13')
  d.setDate(d.getDate() + i)
  return d.toISOString().split('T')[0]
})

export default function DagboekPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [photos, setPhotos] = useState<Record<string, PhotoMeta[]>>({})
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/diary')
      .then(r => r.json())
      .then((data: DiaryEntry[]) => {
        const map: Record<string, DiaryEntry> = {}
        data.forEach(e => { map[e.date] = e })
        setEntries(map)
      })
      .catch(() => {})
  }, [])

  const loadPhotos = async (date: string) => {
    if (photos[date] || !session?.accessToken) return
    const res = await fetch(`/api/photos?date=${date}`)
    if (res.ok) {
      const data = await res.json()
      setPhotos(prev => ({ ...prev, [date]: data }))
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
        photos: photos[date] || [],
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setEntries(prev => ({ ...prev, [date]: { ...(prev[date] || { date }), story_text: data.story_text } }))
    }
    setGenerating(null)
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-on-surface">Dagboek</h1>
        {!session ? (
          <button
            onClick={() => signIn('google')}
            className="rounded-full bg-tertiary text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">photo_library</span>
            Foto's koppelen
          </button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Google Photos
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {VACATION_DAYS.map(date => {
          const entry = entries[date] || { date }
          const isExpanded = expandedDay === date
          const dayPhotos = photos[date] || []
          const dateObj = new Date(date + 'T12:00:00')
          const hasContent = entry.actual_text || entry.mood_emoji || entry.story_text

          return (
            <div key={date} className="rounded-2xl bg-surface border border-outline-variant overflow-hidden shadow-blue">
              <button
                onClick={() => handleExpand(date)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="text-left">
                  <p className="font-bold text-on-surface">
                    {dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-2">
                    {entry.mood_emoji && <span>{entry.mood_emoji}</span>}
                    {hasContent ? 'Ingevuld' : 'Nog niet ingevuld'}
                  </p>
                </div>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-outline-variant">
                  {/* Photo strip */}
                  {session && (
                    <div className="mt-3 mb-3">
                      {dayPhotos.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {dayPhotos.slice(0, 6).map(p => (
                            <img
                              key={p.id}
                              src={`${p.baseUrl}=w200-h200-c`}
                              alt={p.filename}
                              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant italic">Geen foto's gevonden voor deze dag.</p>
                      )}
                    </div>
                  )}

                  {/* Plan text */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Plan was:</label>
                    <p className="text-sm text-on-surface-variant mt-1 italic">
                      {entry.plan_text
                        ? (typeof entry.plan_text === 'string' && entry.plan_text.startsWith('{')
                          ? JSON.parse(entry.plan_text).stops?.map((s: { name: string }) => s.name).join(' → ')
                          : entry.plan_text)
                        : 'Geen plan gemaakt.'}
                    </p>
                  </div>

                  {/* Actual text */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">We hebben eigenlijk:</label>
                    <textarea
                      value={entry.actual_text || ''}
                      onChange={e => setEntries(prev => ({ ...prev, [date]: { ...entry, actual_text: e.target.value } }))}
                      onBlur={() => saveEntry(date, { actual_text: entry.actual_text })}
                      placeholder="Schrijf wat jullie echt hebben gedaan…"
                      rows={3}
                      className="w-full mt-1 rounded-xl border border-outline-variant bg-white p-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Mood */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Stemming:</label>
                    <div className="flex gap-3 mt-2">
                      {MOODS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => saveEntry(date, { mood_emoji: emoji })}
                          className={`text-2xl transition-all ${entry.mood_emoji === emoji ? 'ring-2 ring-primary rounded-full scale-110' : 'opacity-60'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Story */}
                  {entry.story_text && (
                    <div className="rounded-xl bg-secondary/20 border border-secondary/40 p-3 mb-3">
                      <p className="text-sm text-on-surface leading-relaxed">{entry.story_text}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => generateStory(date)}
                      disabled={generating === date}
                      className="flex-1 rounded-full bg-primary text-white text-sm font-bold py-2 disabled:opacity-50 flex items-center justify-center gap-2"
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
