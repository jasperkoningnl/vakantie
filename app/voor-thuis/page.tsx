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

const STEP_COLORS = [
  'oklch(57% 0.14 40)',  /* terra — departure */
  'oklch(79% 0.16 83)',  /* gold  — midway */
  'oklch(58% 0.10 148)', /* sage  — destination */
  'oklch(65% 0.10 218)', /* ciel  — return night */
  'oklch(57% 0.14 40)',  /* terra — home */
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
      {/* Postcard-style header */}
      <div
        className="rounded-2xl p-5 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, oklch(54% 0.14 40) 0%, oklch(44% 0.12 32) 100%)' }}
      >
        {/* Decorative stamp */}
        <div
          className="absolute top-4 right-4 w-11 h-14 flex flex-col items-center justify-center rounded-sm"
          style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
        >
          <span className="text-xl">🌻</span>
          <span className="text-[7px] font-semibold tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>FRANCE</span>
        </div>

        <div
          className="text-sm mb-2"
          style={{ fontFamily: 'var(--font-hand)', color: 'rgba(255,255,255,0.75)' }}
        >
          Voor de thuisblijvers
        </div>
        <div
          className="text-3xl font-light mb-3"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: 'white', lineHeight: 1.2 }}
        >
          Notre Voyage 🌻
        </div>

        {/* Safe arrival status */}
        {arrival ? (
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: '#5DD68C' }} />
            <span className="text-xs font-medium text-white">
              Aangekomen bij {arrival.leg} · {formatTs(arrival.timestamp)}
            </span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-sm">🚗</span>
            <span className="text-xs font-medium text-white">Nog onderweg — we laten het weten!</span>
          </div>
        )}
      </div>

      {/* Route timeline */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          De route
        </div>
        <div
          className="rounded-2xl p-4 shadow-blue"
          style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
        >
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background: '#E4D9C8' }} />
            {TIMELINE.map((step, i) => (
              <div key={i} className="relative flex gap-4 mb-4 last:mb-0">
                <div
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 z-10"
                  style={{ background: STEP_COLORS[i] }}
                >
                  {i + 1}
                </div>
                <div className="pt-1">
                  <p className="text-[10px] text-on-surface-variant">{step.date}</p>
                  <p className="font-semibold text-on-surface text-sm">{step.label}</p>
                  <p className="text-xs text-on-surface-variant">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accommodations */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Overnachtingen
        </div>
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
            <div
              key={acc.name}
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-on-surface">{acc.name}</h3>
                  <p className="text-xs text-on-surface-variant">{acc.region} · {acc.dates}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{acc.note}</p>
                </div>
                {acc.url && (
                  <a
                    href={acc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color: 'oklch(65% 0.10 218)' }}
                  >
                    Website →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auto */}
      <section
        className="rounded-2xl p-4 mb-6 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <h2 className="font-semibold text-on-surface mb-3">Auto</h2>
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
      <section
        className="rounded-2xl p-4 mb-6"
        style={{ background: 'oklch(92% 0.07 83)', border: '1px solid oklch(79% 0.16 83 / 0.3)' }}
      >
        <h2 className="font-semibold text-on-surface mb-2">Telefoonnummers</h2>
        <p className="text-sm text-on-surface-variant italic">[INVULLEN DOOR JASPER VOOR DEPLOY]</p>
      </section>

      {/* Medical Jasper */}
      <section
        className="rounded-2xl p-4 mb-6 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <h2 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
          Medische situatie Jasper
        </h2>
        <p className="text-sm text-on-surface leading-relaxed">
          Kaakkyste linksonder, fragiele kaak. Behandelend specialist: Drs. H.G.G.J. Vallen, Meander Amersfoort,{' '}
          <a href="tel:+31338505050" className="font-semibold" style={{ color: 'oklch(65% 0.10 218)' }}>+31 33 850 5050</a>.
          Bij nood in Frankrijk: CHU Toulouse Purpan, chirurgie maxillo-faciale,{' '}
          <a href="tel:0561777476" className="font-semibold" style={{ color: 'oklch(57% 0.14 40)' }}>05 61 77 74 76</a>.
        </p>
      </section>

      {/* Emergency numbers */}
      <section
        className="rounded-2xl p-4 mb-6 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>emergency</span>
          Noodoproepen Frankrijk
        </h2>
        <div className="flex gap-3">
          {[
            { emoji: '🚑', number: '112', label: 'Alles',    color: '#C0392B', bg: '#FDECEA' },
            { emoji: '🏥', number: '15',  label: 'SAMU',     color: '#1A6FA8', bg: '#E8F4FC' },
            { emoji: '🔥', number: '18',  label: 'Pompiers', color: '#B45309', bg: '#FEF3C7' },
          ].map(e => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-4"
              style={{ background: e.bg, border: `1.5px solid ${e.color}20` }}
            >
              <span className="text-xl">{e.emoji}</span>
              <span className="text-xl font-black" style={{ color: e.color }}>{e.number}</span>
              <span className="text-xs text-on-surface-variant">{e.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
