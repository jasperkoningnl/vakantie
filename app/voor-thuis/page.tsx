import { supabaseAdmin } from '@/lib/supabase'
import { SafeArrival } from '@/lib/types'
import { hasVoorthuisAccess } from '@/lib/voorthuis-auth'

export const dynamic = 'force-dynamic'

function VoorthuisLogin({ fout }: { fout: boolean }) {
  return (
    <div className="px-4 pt-6 pb-16 max-w-md mx-auto min-h-screen flex flex-col justify-center">
      <div className="mb-6 text-center">
        <div
          className="text-xl font-semibold mb-0.5"
          style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}
        >
          Notre Voyage
        </div>
        <h1
          className="text-3xl font-medium leading-tight"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Voor de thuisblijvers
        </h1>
      </div>

      <form
        method="post"
        action="/api/voor-thuis-login"
        className="rounded-2xl p-5 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <p className="text-sm text-on-surface-variant mb-4">
          Deze pagina is voor familie en vrienden. Vul het wachtwoord in dat je van ons hebt gekregen.
        </p>
        <input
          type="password"
          name="wachtwoord"
          required
          autoFocus
          placeholder="Wachtwoord"
          className="w-full rounded-xl p-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none mb-3"
          style={{ background: 'white', border: '1px solid #E4D9C8' }}
        />
        {fout && (
          <p className="text-sm mb-3" style={{ color: 'oklch(50% 0.15 25)' }}>
            Dat wachtwoord klopt niet. Probeer het nog eens.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-2xl py-3 text-white font-semibold text-sm"
          style={{ background: 'oklch(57% 0.14 40)' }}
        >
          Bekijk reisupdates
        </button>
      </form>
    </div>
  )
}

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
  { date: '12 juni', label: 'Amersfoort', sub: 'Vertrek', icon: '🏠' },
  { date: '12–13 juni', label: 'Atelier des Sens', sub: 'Bourgondië · 1 nacht', icon: '🛏️' },
  { date: '13–27 juni', label: 'Les Escaliers', sub: 'Porte-du-Quercy · 2 weken', icon: '🌻' },
  { date: '27–29 juni', label: 'Chartres', sub: '2 nachten · Kathedraal', icon: '⛪' },
  { date: '29 juni', label: 'Thuis', sub: 'Amersfoort', icon: '🏁' },
]

const STEP_COLORS = [
  'oklch(57% 0.14 40)',
  'oklch(65% 0.10 218)',
  'oklch(58% 0.10 148)',
  'oklch(79% 0.16 83)',
  'oklch(57% 0.14 40)',
]

export default async function VoorThuisPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  if (!(await hasVoorthuisAccess())) {
    const { fout } = await searchParams
    return <VoorthuisLogin fout={fout === '1'} />
  }

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
    <div className="px-4 pt-6 pb-16 max-w-md mx-auto">

      {/* Page header — zelfde stijl als andere pagina's */}
      <div className="mb-5">
        <div
          className="text-xl font-semibold mb-0.5"
          style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}
        >
          Notre Voyage
        </div>
        <h1
          className="text-3xl font-medium leading-tight"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Voor de thuisblijvers
        </h1>
      </div>

      <section
        className="rounded-2xl p-3 mb-5"
        style={{ background: '#FFF6D8', border: '1px solid #E6C76A', color: '#6B4E16' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1">Voor familie &amp; vrienden</p>
        <p className="text-sm">
          Welkom! Hier vind je onze route, overnachtingen en een live reisupdate. Deel de link alleen met mensen die je kent.
        </p>
      </section>

      {/* Aankomststatus hero */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'linear-gradient(150deg, oklch(54% 0.14 40) 0%, oklch(44% 0.12 32) 100%)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Reisupdate
            </p>
            <p className="text-lg font-semibold text-white leading-tight">
              {arrival ? `Aangekomen bij ${arrival.leg}` : 'Nog onderweg'}
            </p>
            {arrival && (
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {formatTs(arrival.timestamp)}
              </p>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: arrival ? 'rgba(93,214,140,0.25)' : 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-xl">{arrival ? '✅' : '🚗'}</span>
          </div>
        </div>
        {!arrival && (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            We sturen een berichtje zodra we ergens aangekomen zijn!
          </p>
        )}
      </div>

      {/* Route tijdlijn */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          De route
        </div>
        <div className="rounded-2xl p-4 shadow-blue" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}>
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5" style={{ background: '#E4D9C8' }} />
            {TIMELINE.map((step, i) => (
              <div key={i} className="relative flex gap-4 mb-4 last:mb-0">
                <div
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm flex-shrink-0 z-10"
                  style={{ background: STEP_COLORS[i] }}
                >
                  {step.icon}
                </div>
                <div className="pt-0.5">
                  <p className="text-[10px] text-on-surface-variant">{step.date}</p>
                  <p className="font-semibold text-on-surface text-sm">{step.label}</p>
                  <p className="text-xs text-on-surface-variant">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overnachtingen */}
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
              note: 'Studio met keuken & zwembad',
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
              note: 'Centrum, parkeergarage aanwezig',
            },
          ].map(acc => (
            <div
              key={acc.name}
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-on-surface text-sm">{acc.name}</h3>
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

      {/* Auto — voor als er iets is */}
      <section className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#A8937A' }}>
          Onze auto
        </div>
        <div className="rounded-2xl p-4 shadow-blue" style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}>
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
        </div>
      </section>

    </div>
  )
}
