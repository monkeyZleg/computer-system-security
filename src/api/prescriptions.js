import { forbidden } from './client'
import { invokeEncrypted } from './encrypted'

// All prescription CRUD goes through the `prescriptions-encrypted` Edge Function:
// the server runs the query, AES-GCM encrypts the JSON, and the response travels
// the wire as ciphertext. invokeEncrypted decrypts it after it arrives.

// The server scopes the list by the caller's database role: patients see their
// own prescriptions, doctors the ones they issued, admins everything.
export async function listPrescriptions() {
  return invokeEncrypted(
    'prescriptions-encrypted',
    { op: 'list' },
    { context: 'list prescriptions' },
  )
}

export async function issuePrescription({ patient_id, doctor_id, medication, dosage, issue_date }, viewer) {
  if (!viewer || viewer.role !== 'doctor' || viewer.userId !== doctor_id) {
    return forbidden('Only the treating doctor can issue this prescription.')
  }
  return invokeEncrypted(
    'prescriptions-encrypted',
    { op: 'create', patient_id, doctor_id, medication, dosage, issue_date },
    { context: 'issue prescription', successStatus: 201 },
  )
}

export async function getRecentPrescriptionsForPatient(patientId, limit = 5) {
  return invokeEncrypted(
    'prescriptions-encrypted',
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
    'prescriptions-encrypted',
    { op: 'delete', id },
    { context: 'delete prescription' },
  )
}
