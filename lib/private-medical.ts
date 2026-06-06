import 'server-only'

export const emergencyNumbers = [
  { emoji: '🚑', number: '112', label: 'Alles', color: '#C0392B', bg: '#FDECEA' },
  { emoji: '🏥', number: '15', label: 'SAMU', color: '#1A6FA8', bg: '#E8F4FC' },
  { emoji: '🔥', number: '18', label: 'Pompiers', color: '#B45309', bg: '#FEF3C7' },
]

export const urgencyText = 'Ce patient présente un kyste mandibulaire avec risque de fracture pathologique. Veuillez contacter le service de chirurgie maxillo-faciale en urgence.'

export const medicalLetter = `LETTRE MÉDICALE D'INFORMATION URGENTE

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

export const hospitals = [
  {
    name: 'CHU Toulouse Purpan',
    specialty: 'Chirurgie maxillo-faciale',
    address: '1 Place du Docteur Joseph Baylac, 31300 Toulouse',
    distance: 'ca. 1u30 van Les Escaliers',
    phone: '05 61 77 74 76',
    href: 'tel:0561777476',
  },
  {
    name: 'Meander Ziekenhuis Amersfoort',
    specialty: 'Drs. H.G.G.J. Vallen — chirurgie maxillo-faciaal',
    address: 'Maatweg 3, 3813 TZ Amersfoort',
    distance: null,
    phone: '+31 33 850 5050',
    href: 'tel:+31338505050',
  },
]

export const phrases = [
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
