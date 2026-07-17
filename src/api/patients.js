import { forbidden } from './client'
import { invokeEncrypted } from './encrypted'

const STAFF_ROLES = ['doctor', 'nurse', 'admin']

// All patient CRUD goes through the `patients-encrypted` Edge Function: the server
// runs the query, AES-GCM encrypts the JSON, and the response travels the wire as
// ciphertext. invokeEncrypted decrypts it after it arrives. The request body only
// carries the signed-in user's id — the server looks up the caller's role itself,
// so the viewer checks below are a first-line UX guard, not the enforcement.

export async function listPatients(viewer) {
  if (!viewer || !STAFF_ROLES.includes(viewer.role)) {
    return forbidden('Only staff can list patient records.')
  }
  return invokeEncrypted('patients-encrypted', { op: 'list' }, { context: 'list patients' })
}

// Ownership check: patients may only fetch their own record; staff may fetch any.
export async function getPatientById(id, viewer) {
  if (viewer?.role === 'patient' && viewer.patientId !== id) {
    return forbidden('You can only view your own patient record.')
  }
  return invokeEncrypted('patients-encrypted', { op: 'get', id }, { context: 'fetch patient record' })
}

// Server-side these always resolve against the signed-in user.
export async function getPatientByUserId() {
  return invokeEncrypted('patients-encrypted', { op: 'getByUserId' }, { context: 'fetch patient record' })
}

export async function getPatientIdByUserId() {
  return invokeEncrypted('patients-encrypted', { op: 'getIdByUserId' }, { context: 'fetch patient id' })
}

export async function updatePatientRecord(patientId, { home_address, diagnosis, medical_history }, viewer) {
  if (!viewer || (viewer.role !== 'doctor' && viewer.role !== 'admin')) {
    return forbidden('Only doctors or admins can update patient records.')
  }
  return invokeEncrypted(
    'patients-encrypted',
    { op: 'update', patientId, home_address, diagnosis, medical_history },
    { context: 'update patient record' },
  )
}

export async function searchPatientsByName(query, limit = 5) {
  return invokeEncrypted('patients-encrypted', { op: 'search', query, limit }, { context: 'search patients' })
}

export async function createPatientRecord({ user_id, date_of_birth }) {
  return invokeEncrypted(
    'patients-encrypted',
    { op: 'create', user_id, date_of_birth },
    { context: 'create patient record', successStatus: 201 },
  )
}

export async function countPatients() {
  return invokeEncrypted('patients-encrypted', { op: 'count' }, { context: 'count patients' })
}
