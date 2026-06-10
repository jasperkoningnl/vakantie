// Generieke, niet-persoonsgebonden inhoud van de medische pagina.
// De persoonlijke medische gegevens (brief, ziekenhuizen, urgentietekst)
// staan in Supabase Storage; zie lib/medisch-content.ts.

export const emergencyNumbers = [
  { emoji: '🚑', number: '112', label: 'Alles', color: '#C0392B', bg: '#FDECEA' },
  { emoji: '🏥', number: '15', label: 'SAMU', color: '#1A6FA8', bg: '#E8F4FC' },
  { emoji: '🔥', number: '18', label: 'Pompiers', color: '#B45309', bg: '#FEF3C7' },
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
