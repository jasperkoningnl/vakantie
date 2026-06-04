export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { SafeArrival } from '@/lib/types'

async function getLatestArrival(): Promise<SafeArrival | null> {
  try {
    const db = supabaseAdmin()
    const { data } = await db
      .from('safe_arrival')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    return data || null
  } catch {
    return null
  }
}

const TIMELINE = [
  { date: '12 juni', label: 'Amersfoort', sub: 'Vertrek' },
  { date: '12–13 juni', label: 'Atelier des Sens', sub: 'Bourgondië' },
  { date: '13–27 juni', label: 'Les Escaliers', sub: 'Porte-du-Quercy' },
  { date: '27 juni', label: 'Chartres', sub: '2 nachten' },
  { date: '29 juni', label: 'Thuis', sub: 'Amersfoort' },
]

export default async function VoorThuisPage() {
  const arrival = await getLatestArrival()

  const formatTs = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="px-4 pt-8 pb-12 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-on-surface">Notre Voyage 🌻</h1>
        <p className="text-on-surface-variant mt-1">voor de thuisblijvers</p>
      </div>

      {/* Safe arrival status */}
      <div className={`rounded-2xl p-4 mb-6 border ${arrival ? 'bg-green-50 border-green-200' : 'bg-surface border-outline-variant'}`}>
        {arrival ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-800">Aangekomen bij {arrival.leg}</p>
              <p className="text-sm text-green-700">{formatTs(arrival.timestamp)}</p>
              {arrival.message && <p className="text-sm text-green-700 mt-1">{arrival.message}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <p className="text-on-surface-variant font-medium">Nog onderweg — we laten het weten!</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <section className="mb-6">
        <h2 className="font-bold text-on-surface mb-4">De route</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-outline-variant" />
          {TIMELINE.map((step, i) => (
            <div key={i} className="relative flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center text-xs font-bold flex-shrink-0 z-10">
                {i + 1}
              </div>
              <div className="pt-1">
                <p className="text-xs text-on-surface-variant">{step.date}</p>
                <p className="font-bold text-on-surface">{step.label}</p>
                <p className="text-xs text-on-surface-variant">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accommodations */}
      <section className="mb-6">
        <h2 className="font-bold text-on-surface mb-3">Overnachtingen</h2>
        <div className="flex flex-col gap-3">
          {[
            {
              name: 'Atelier des Sens 89',
              region: 'Bourgondië',
              dates: '12–13 juni',
              url: 'https://atelierdessens89.fr',
              note: 'Studio met keuken, zwembad',
            },
            {
              name: 'Les Escaliers de La Combe',
              region: 'Porte-du-Quercy',
              dates: '13–27 juni',
              url: 'https://lesescaliers.com',
              note: 'Eigenaren: Ilse & Coen (Nederlandstalig)',
            },
            {
              name: 'Hotel Henri IV',
              region: 'Chartres',
              dates: '27–29 juni',
              url: null,
              note: 'Parkeergarage aanwezig',
            },
          ].map(acc => (
            <div key={acc.name} className="rounded-2xl bg-surface border border-outline-variant p-4 shadow-blue">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-on-surface">{acc.name}</h3>
                  <p className="text-xs text-on-surface-variant">{acc.region} · {acc.dates}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{acc.note}</p>
                </div>
                {acc.url && (
                  <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-tertiary flex-shrink-0">
                    Website →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auto */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-6 shadow-blue">
        <h2 className="font-bold text-on-surface mb-2">Auto</h2>
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
        <p className="text-xs text-on-surface-variant mt-2">Nul eigen risico · Honda Assistance Europa</p>
      </section>

      {/* Phone numbers */}
      <section className="rounded-2xl bg-secondary/20 border border-secondary/40 p-4 mb-6">
        <h2 className="font-bold text-on-surface mb-2">Telefoonnummers</h2>
        <p className="text-sm text-on-surface-variant italic">[INVULLEN DOOR JASPER VOOR DEPLOY]</p>
      </section>

      {/* Medical Jasper */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-6 shadow-blue">
        <h2 className="font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
          Medische situatie Jasper
        </h2>
        <p className="text-sm text-on-surface leading-relaxed">
          Kaakkyste linksonder, fragiele kaak. Behandelend specialist: Drs. H.G.G.J. Vallen, Meander Amersfoort, <a href="tel:+31338505050" className="text-tertiary font-semibold">+31 33 850 5050</a>.
          Bij nood in Frankrijk: CHU Toulouse Purpan, chirurgie maxillo-faciale, <a href="tel:0561777476" className="text-primary font-semibold">05 61 77 74 76</a>.
        </p>
      </section>

      {/* Emergency France */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-6 shadow-blue">
        <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
          Noodoproepen Frankrijk
        </h2>
        <div className="flex gap-3">
          {[{ emoji: '🚑', number: '112', label: 'Alles' }, { emoji: '🏥', number: '15', label: 'SAMU' }, { emoji: '🔥', number: '18', label: 'Pompiers' }].map(e => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex-1 flex flex-col items-center gap-1 rounded-2xl bg-primary/10 border border-primary/20 py-4"
            >
              <span className="text-xl">{e.emoji}</span>
              <span className="text-xl font-black text-primary">{e.number}</span>
              <span className="text-xs text-on-surface-variant">{e.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
