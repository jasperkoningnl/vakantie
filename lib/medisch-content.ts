import 'server-only'
import { supabaseAdmin } from './supabase'

// Persoonlijke medische gegevens staan bewust niet in de codebase maar in
// een privé Supabase Storage-bucket (alleen leesbaar met de service-role
// key). Eenmalig invullen kan via het formulier op /medisch.
const PRIVATE_BUCKET = 'private-content'
const MEDISCH_FILE = 'medisch.json'

export interface Hospital {
  name: string
  specialty: string
  address: string
  distance: string | null
  phone: string
  href: string
}

export interface MedischContent {
  urgencyText: string
  medicalLetter: string
  hospitals: Hospital[]
}

export function isMedischContent(value: unknown): value is MedischContent {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>

  if (typeof v.urgencyText !== 'string' || typeof v.medicalLetter !== 'string') return false
  if (!Array.isArray(v.hospitals)) return false

  return v.hospitals.every(h => {
    if (!h || typeof h !== 'object') return false
    const hospital = h as Record<string, unknown>
    return (
      typeof hospital.name === 'string' &&
      typeof hospital.specialty === 'string' &&
      typeof hospital.address === 'string' &&
      (hospital.distance === null || typeof hospital.distance === 'string') &&
      typeof hospital.phone === 'string' &&
      typeof hospital.href === 'string'
    )
  })
}

export async function getMedischContent(): Promise<MedischContent | null> {
  try {
    const db = supabaseAdmin()
    const { data, error } = await db.storage.from(PRIVATE_BUCKET).download(MEDISCH_FILE)
    if (error || !data) return null

    const parsed: unknown = JSON.parse(await data.text())
    return isMedischContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function saveMedischContent(content: MedischContent): Promise<void> {
  const db = supabaseAdmin()
  // Bestaat de bucket al, dan negeren we de foutmelding in het resultaat.
  await db.storage.createBucket(PRIVATE_BUCKET, { public: false })

  const { error } = await db.storage
    .from(PRIVATE_BUCKET)
    .upload(MEDISCH_FILE, JSON.stringify(content, null, 2), {
      contentType: 'application/json',
      upsert: true,
    })

  if (error) throw new Error(error.message)
}
