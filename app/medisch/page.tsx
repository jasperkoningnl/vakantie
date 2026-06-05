'use client'
import { useState } from 'react'

const EMERGENCY = [
  { emoji: '🚑', number: '112', label: 'Alles',    color: '#C0392B', bg: '#FDECEA' },
  { emoji: '🏥', number: '15',  label: 'SAMU',     color: '#1A6FA8', bg: '#E8F4FC' },
  { emoji: '🔥', number: '18',  label: 'Pompiers', color: '#B45309', bg: '#FEF3C7' },
]

const URGENCY_TEXT = "Ce patient présente un kyste mandibulaire avec risque de fracture pathologique. Veuillez contacter le service de chirurgie maxillo-faciale en urgence."

const MEDICAL_LETTER = `LETTRE MÉDICALE D'INFORMATION URGENTE

Concernant : M. Jasper Koning
Date de naissance : 7 décembre 1976
Nationalité : Néerlandaise
Médecin traitant : Drs. H.G.G.J. Vallen, chirurgien maxillo-facial
Établissement : Meander Medisch Centrum, Maatweg 3, 3813 TZ Amersfoort, Pays-Bas
Téléphone : +31 33 850 5050

Objet : Patient présentant un kyste mandibulaire avec risque de fracture pathologique

Madame, Monsieur,

M. Koning est suivi pour un kyste osseux de la mandibule inférieure gauche.
Ce kyste entraîne un amincissement significatif de la corticale osseuse
mandibulaire gauche, rendant la mâchoire particulièrement fragilisée.

Il existe un risque réel de fracture pathologique de la mandibule. Toute
douleur soudaine, gêne à l'ouverture buccale ou asymétrie de la mâchoire
doit être considérée comme un signal d'alarme.

Traitement en cours : irrigation biquotidienne à l'eau claire.
Aucune médication systémique.

Un orthopantomogramme récent est disponible sur demande.

En cas d'urgence : radiographie panoramique ou scanner de la mandibule,
avis du service de chirurgie maxillo-faciale.

Secrétariat Meander : +31 33 850 5050`

const ZINNEN = [
  { nl: 'Wij zijn vegetariër', fr: 'Nous sommes végétariens' },
  { nl: 'Heeft u iets zonder vlees?', fr: 'Avez-vous quelque chose sans viande ?' },
  { nl: 'De rekening alstublieft', fr: "L'addition, s'il vous plaît" },
  { nl: 'Waar is de dichtstbijzijnde apotheek?', fr: 'Où est la pharmacie la plus proche ?' },
  { nl: 'Mijn man heeft een probleem met zijn kaak', fr: 'Mon mari a un problème à la mâchoire' },
  { nl: 'We hebben dringend een dokter nodig', fr: 'Nous avons besoin d\'un médecin de toute urgence' },
  { nl: 'Heeft u een kinderstoel?', fr: 'Avez-vous une chaise haute ?' },
  { nl: 'Waar zijn de toiletten?', fr: 'Où sont les toilettes ?' },
  { nl: 'Wij hebben een reservering', fr: 'Nous avons une réservation' },
  { nl: 'Kunt u ons helpen?', fr: 'Pouvez-vous nous aider ?' },
  { nl: 'Spreekt u Engels?', fr: 'Parlez-vous anglais ?' },
  { nl: 'Hoeveel kost dit?', fr: 'Combien ça coûte ?' },
  { nl: 'We zijn verdwaald', fr: 'Nous sommes perdus' },
  { nl: 'Is er een speeltuin in de buurt?', fr: "Y a-t-il une aire de jeux à proximité ?" },
]

export default function MedischPage() {
  const [tab, setTab] = useState<'medisch' | 'zinnen'>('medisch')

  const speak = (text: string, lang: string) => {
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    speechSynthesis.speak(utter)
  }

  return (
    <div className="px-4 pt-5">
      <h1
        className="text-3xl font-medium mb-4"
        style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
      >
        Praktisch
      </h1>

      {/* Sub-tabs */}
      <div
        className="flex rounded-2xl overflow-hidden p-1 mb-5"
        style={{ background: '#F0E9DA' }}
      >
        {([
          { value: 'medisch', label: 'Medisch & Nood' },
          { value: 'zinnen',  label: 'Franse zinnen' },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
            style={
              tab === t.value
                ? { background: '#FAF7F0', color: '#2C2316', boxShadow: '0 1px 3px rgba(44,35,22,0.1)' }
                : { color: '#A8937A' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'medisch' && (
        <>
          {/* Emergency numbers */}
          <section
            className="rounded-2xl p-4 mb-4 shadow-blue"
            style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
          >
            <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: 'oklch(57% 0.14 40)', fontVariationSettings: "'FILL' 1" }}>emergency</span>
              Noodoproepen Frankrijk
            </h2>
            <div className="flex gap-3">
              {EMERGENCY.map(e => (
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
          </section>

          {/* Hospital cards */}
          <div className="flex flex-col gap-3 mb-5">
            <div
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface text-sm">CHU Toulouse Purpan</h3>
                  <p className="text-xs text-on-surface-variant">Chirurgie maxillo-faciale</p>
                  <p className="text-xs text-on-surface-variant">1 Place du Docteur Joseph Baylac, 31300 Toulouse</p>
                  <p className="text-xs text-on-surface-variant">ca. 1u30 van Les Escaliers</p>
                  <a href="tel:0561777476" className="text-sm font-bold mt-1 block" style={{ color: 'oklch(57% 0.14 40)' }}>
                    05 61 77 74 76
                  </a>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 shadow-blue"
              style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'oklch(65% 0.10 218)', fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface text-sm">Meander Ziekenhuis Amersfoort</h3>
                  <p className="text-xs text-on-surface-variant">Drs. H.G.G.J. Vallen — chirurgie maxillo-faciaal</p>
                  <p className="text-xs text-on-surface-variant">Maatweg 3, 3813 TZ Amersfoort</p>
                  <a href="tel:+31338505050" className="text-sm font-bold mt-1 block" style={{ color: 'oklch(57% 0.14 40)' }}>
                    +31 33 850 5050
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Medical letter */}
          <section
            className="rounded-2xl p-4 mb-4 shadow-blue"
            style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-on-surface">Medische brief</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => speak(URGENCY_TEXT, 'fr-FR')}
                  className="rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                  style={{
                    background: 'oklch(92% 0.05 218)',
                    border: '1px solid oklch(65% 0.10 218 / 0.3)',
                    color: 'oklch(65% 0.10 218)',
                  }}
                >
                  <span className="material-symbols-outlined text-sm">volume_up</span>
                  FR
                </button>
                <button
                  onClick={() => window.print()}
                  className="rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"
                  style={{ background: '#F0E9DA', border: '1px solid #E4D9C8', color: '#6B5A3E' }}
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Print
                </button>
              </div>
            </div>

            <pre
              className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-sans rounded-xl p-3 overflow-x-auto"
              style={{ background: 'white', border: '1px solid #E4D9C8' }}
            >
              {MEDICAL_LETTER}
            </pre>
          </section>
        </>
      )}

      {tab === 'zinnen' && (
        <section>
          <p className="text-sm text-on-surface-variant mb-4">
            Tik op de speaker om een zin voor te laten lezen in het Frans.
          </p>
          <div className="flex flex-col gap-3">
            {ZINNEN.map((z, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 shadow-blue"
                style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-variant mb-1">{z.nl}</p>
                    <p className="font-semibold text-on-surface" style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic' }}>
                      {z.fr}
                    </p>
                  </div>
                  <button
                    onClick={() => speak(z.fr, 'fr-FR')}
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{ background: 'oklch(92% 0.05 218)', color: 'oklch(65% 0.10 218)' }}
                    aria-label="Spreek uit"
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      volume_up
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
