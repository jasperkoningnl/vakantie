import { PrintButton } from '@/components/PrintButton'
import { SpeechButton } from '@/components/SpeechButton'
import MedischContentForm from '@/components/MedischContentForm'
import { requirePrivatePageAccess } from '@/lib/private-page-auth'
import { getMedischContent } from '@/lib/medisch-content'
import { emergencyNumbers, phrases } from '@/lib/medisch-static'

export const dynamic = 'force-dynamic'

export default async function MedischPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePrivatePageAccess('/medisch')

  const content = await getMedischContent()
  const { bewerk } = await searchParams
  const showForm = !content || bewerk === '1'

  return (
    <div className="px-4 pt-5">
      <h1
        className="text-3xl font-medium mb-4"
        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
      >
        Praktisch
      </h1>

      <section
        className="rounded-2xl p-3 mb-5"
        style={{ background: '#FFF6D8', border: '1px solid #E6C76A', color: '#6B4E16' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1">Privépagina</p>
        <p className="text-sm">
          Deze pagina is alleen zichtbaar na inloggen. Deel geen privélinks of screenshots met medische details buiten de familiekring.
        </p>
      </section>

      <section
        className="rounded-2xl p-4 mb-4 shadow-blue"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>emergency</span>
          Noodoproepen Frankrijk
        </h2>
        <div className="flex gap-3">
          {emergencyNumbers.map(e => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex-1 flex flex-col items-center gap-1 rounded-2xl py-4 text-center"
              style={{ background: e.bg, border: `1.5px solid ${e.color}20` }}
            >
              <span className="text-2xl">{e.emoji}</span>
              <span className="text-xl font-black" style={{ color: e.color }}>{e.number}</span>
              <span className="text-xs text-on-surface-variant">{e.label}</span>
            </a>
          ))}
        </div>
        <a href="/nood" className="text-xs font-semibold mt-3 inline-block" style={{ color: 'oklch(57% 0.14 40)' }}>
          Open openbare noodmodus met alleen telefoonnummers →
        </a>
      </section>

      {showForm && (
        <MedischContentForm initialJson={content ? JSON.stringify(content, null, 2) : undefined} />
      )}

      {content && !showForm && (
        <>
          <div className="flex flex-col gap-3 mb-5">
            {content.hospitals.map(hospital => (
              <div
                key={hospital.name}
                className="rounded-2xl p-4 shadow-blue"
                style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-on-surface text-sm">{hospital.name}</h3>
                    <p className="text-xs text-on-surface-variant">{hospital.specialty}</p>
                    <p className="text-xs text-on-surface-variant">{hospital.address}</p>
                    {hospital.distance && <p className="text-xs text-on-surface-variant">{hospital.distance}</p>}
                    <a href={hospital.href} className="text-sm font-bold mt-1 block" style={{ color: 'oklch(57% 0.14 40)' }}>
                      {hospital.phone}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section
            className="rounded-2xl p-4 mb-6 shadow-blue"
            style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-on-surface">Medische brief</h2>
              <div className="flex gap-2">
                <SpeechButton
                  text={content.urgencyText}
                  label="FR"
                  className="rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                  style={{
                    background: 'oklch(92% 0.05 218)',
                    border: '1px solid oklch(65% 0.10 218 / 0.3)',
                    color: 'oklch(65% 0.10 218)',
                  }}
                />
                <PrintButton />
              </div>
            </div>

            <pre
              className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-sans rounded-xl p-3 overflow-x-auto"
              style={{ background: 'white', border: '1px solid #E4D9C8' }}
            >
              {content.medicalLetter}
            </pre>
            <a href="/medisch?bewerk=1" className="text-xs font-semibold mt-3 inline-block no-print" style={{ color: '#A8937A' }}>
              Medische gegevens bewerken
            </a>
          </section>
        </>
      )}

      <section className="mb-8">
        <h2 className="font-semibold text-on-surface mb-2">Franse zinnen</h2>
        <p className="text-sm text-on-surface-variant mb-4">
          Tik op de speaker om een zin voor te laten lezen in het Frans.
        </p>
        <div className="flex flex-col gap-3">
          {phrases.map((phrase, index) => (
            <div
              key={index}
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-3 items-center">
                  <p className="text-xs text-on-surface-variant">{phrase.nl}</p>
                  <p className="font-semibold text-on-surface" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic' }}>
                    {phrase.fr}
                  </p>
                </div>
                <SpeechButton
                  text={phrase.fr}
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'oklch(92% 0.05 218)', color: 'oklch(65% 0.10 218)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
