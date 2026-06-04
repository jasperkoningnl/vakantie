'use client'

const EMERGENCY = [
  { emoji: '🚑', number: '112', label: 'Alles' },
  { emoji: '🏥', number: '15', label: 'SAMU' },
  { emoji: '🔥', number: '18', label: 'Pompiers' },
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

export default function MedischPage() {
  const speak = (text: string, lang: string) => {
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    speechSynthesis.speak(utter)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Medisch</h1>

      {/* Emergency contacts */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-4 shadow-blue">
        <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
          Noodoproepen Frankrijk
        </h2>
        <div className="flex gap-3">
          {EMERGENCY.map(e => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex-1 flex flex-col items-center gap-1 rounded-2xl bg-primary/10 border border-primary/20 py-4 font-bold text-on-surface"
            >
              <span className="text-2xl">{e.emoji}</span>
              <span className="text-xl font-black text-primary">{e.number}</span>
              <span className="text-xs text-on-surface-variant">{e.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Hospital cards */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="rounded-2xl bg-surface border border-outline-variant p-4 shadow-blue">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface text-sm">CHU Toulouse Purpan</h3>
              <p className="text-xs text-on-surface-variant">Chirurgie maxillo-faciale</p>
              <p className="text-xs text-on-surface-variant">1 Place du Docteur Joseph Baylac, 31300 Toulouse</p>
              <p className="text-xs text-on-surface-variant">ca. 1u30 van Les Escaliers</p>
              <a href="tel:0561777476" className="text-sm font-bold text-primary mt-1 block">05 61 77 74 76</a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-outline-variant p-4 shadow-blue">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface text-sm">Meander Ziekenhuis Amersfoort</h3>
              <p className="text-xs text-on-surface-variant">Drs. H.G.G.J. Vallen — chirurgie maxillo-faciaal</p>
              <p className="text-xs text-on-surface-variant">Maatweg 3, 3813 TZ Amersfoort</p>
              <a href="tel:+31338505050" className="text-sm font-bold text-primary mt-1 block">+31 33 850 5050</a>
            </div>
          </div>
        </div>
      </div>

      {/* Medical letter */}
      <section className="rounded-2xl bg-surface border border-outline-variant p-4 mb-4 shadow-blue">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-on-surface">Medische brief</h2>
          <div className="flex gap-2">
            <button
              onClick={() => speak(URGENCY_TEXT, 'fr-FR')}
              className="rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">volume_up</span>
              FR
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-full bg-on-surface/10 border border-outline-variant text-on-surface px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print
            </button>
          </div>
        </div>

        <pre className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-sans bg-white rounded-xl p-3 border border-outline-variant overflow-x-auto">
          {MEDICAL_LETTER}
        </pre>
      </section>
    </div>
  )
}
