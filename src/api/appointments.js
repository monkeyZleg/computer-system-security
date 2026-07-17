import { forbidden } from './client'
import { invokeEncrypted } from './encrypted'

// All appointment CRUD goes through the `appointments-encrypted` Edge Function: the
// server runs the query, AES-GCM encrypts the JSON, and the response travels the wire
// as ciphertext. invokeEncrypted decrypts it after it arrives. Ownership checks run
// server-side inside the function; the client-side guards below are a first line only.

export async function listAppointments({ role, userId, patientId }) {
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'list', viewer: { role, userId, patientId } },
    { context: 'list appointments' },
  )
}

export async function bookAppointment({ patient_id, doctor_id, appointment_date, notes }) {
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'book', patient_id, doctor_id, appointment_date, notes },
    { context: 'book appointment', successStatus: 201 },
  )
}

// Ownership check: patients/doctors may only update their own appointments; staff may update any.
export async function updateAppointmentStatus(id, status, viewer) {
  if (!viewer) {
    return forbidden('You can only update your own appointments.')
  }
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'updateStatus', id, status, viewer },
    { context: 'update appointment status' },
  )
}

export async function getUpcomingAppointmentsForPatient(patientId, limit = 5) {
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'upcoming', patientId, limit },
    { context: 'fetch upcoming appointments' },
  )
}

export async function getTodayAppointmentsForDoctor(doctorId) {
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'today', doctorId },
    { context: "fetch doctor's appointments" },
  )
}

export async function countScheduledAppointments() {
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'countScheduled' },
    { context: 'count scheduled appointments' },
  )
}

// Exported for completeness; not wired into any UI — cancel-via-status already
// covers the product need for removing an appointment from the active view.
export async function deleteAppointment(id, viewer) {
  if (!viewer) {
    return forbidden('You can only delete your own appointments.')
  }
  return invokeEncrypted(
    'appointments-encrypted',
    { op: 'delete', id, viewer },
    { context: 'delete appointment' },
  )
}
