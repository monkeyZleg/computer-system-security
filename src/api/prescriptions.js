import { supabase } from '../lib/supabase'
import { forbidden } from './client'
import { decryptPayload } from '../lib/crypto'

// All prescription CRUD goes through the `prescriptions-encrypted` Edge Function:
// the server runs the query, AES-GCM encrypts the JSON, and the response travels
// the wire as ciphertext. We decrypt here with Web Crypto after it arrives.
async function invokeEncrypted(body, { context, successStatus = 200 } = {}) {
  const { data: encrypted, error } = await supabase.functions.invoke(
    'prescriptions-encrypted',
    { body },
  )

  if (error || !encrypted) {
    console.error(context ? `Failed to ${context}:` : 'API error:', error)
    return { status: 500, error: 'Internal Server Error', details: 'Something went wrong. Please try again later.' }
  }

  try {
    const data = await decryptPayload(encrypted)
    return { status: successStatus, data }
  } catch (e) {
    console.error(`Failed to decrypt (${context}):`, e)
    return { status: 500, error: 'Internal Server Error', details: 'Could not decrypt the response.' }
  }
}

export async function listPrescriptions({ role, userId, patientId }) {
  return invokeEncrypted(
    { op: 'list', viewer: { role, userId, patientId } },
    { context: 'list prescriptions' },
  )
}

export async function issuePrescription({ patient_id, doctor_id, medication, dosage, issue_date }, viewer) {
  if (!viewer || viewer.role !== 'doctor' || viewer.userId !== doctor_id) {
    return forbidden('Only the treating doctor can issue this prescription.')
  }
  return invokeEncrypted(
    { op: 'create', viewer, patient_id, doctor_id, medication, dosage, issue_date },
    { context: 'issue prescription', successStatus: 201 },
  )
}

export async function getRecentPrescriptionsForPatient(patientId, limit = 5) {
  return invokeEncrypted(
    { op: 'recent', patientId, limit },
    { context: 'fetch recent prescriptions' },
  )
}

// Exported for completeness; not wired into any UI.
export async function deletePrescription(id, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can delete prescriptions.')
  }
  return invokeEncrypted(
    { op: 'delete', id, viewer },
    { context: 'delete prescription' },
  )
}
