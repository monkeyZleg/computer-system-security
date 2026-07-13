import { supabase } from '../lib/supabase'
import { toResult, forbidden } from './client'

async function ownsAppointment(id, viewer) {
  if (viewer.role === 'admin' || viewer.role === 'nurse') return true
  const res = await supabase.from('appointments').select('patient_id, doctor_id').eq('id', id).single()
  if (res.error || !res.data) return false
  if (viewer.role === 'patient') return res.data.patient_id === viewer.patientId
  if (viewer.role === 'doctor') return res.data.doctor_id === viewer.userId
  return false
}

export async function listAppointments({ role, userId, patientId }) {
  let query = supabase
    .from('appointments')
    .select('id, appointment_date, status, notes, patients:patients!patient_id(id, users:users!user_id(full_name)), users:users!doctor_id(full_name)')
    .order('appointment_date', { ascending: false })

  if (role === 'patient' && patientId) {
    query = query.eq('patient_id', patientId)
  } else if (role === 'doctor') {
    query = query.eq('doctor_id', userId)
  }

  const res = await query
  return toResult(res, { context: 'list appointments' })
}

export async function bookAppointment({ patient_id, doctor_id, appointment_date, notes }) {
  const res = await supabase.from('appointments').insert({
    patient_id,
    doctor_id,
    appointment_date: new Date(appointment_date).toISOString(),
    notes: notes || null,
    status: 'scheduled',
  })
  return toResult(res, { successStatus: 201, context: 'book appointment' })
}

// Ownership check: patients/doctors may only update their own appointments; staff may update any.
export async function updateAppointmentStatus(id, status, viewer) {
  if (!viewer || !(await ownsAppointment(id, viewer))) {
    return forbidden('You can only update your own appointments.')
  }
  const res = await supabase.from('appointments').update({ status }).eq('id', id)
  return toResult(res, { context: 'update appointment status' })
}

export async function getUpcomingAppointmentsForPatient(patientId, limit = 5) {
  const res = await supabase
    .from('appointments')
    .select('id, appointment_date, status, users:users!doctor_id(full_name)')
    .eq('patient_id', patientId)
    .eq('status', 'scheduled')
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(limit)
  return toResult(res, { context: 'fetch upcoming appointments' })
}

export async function getTodayAppointmentsForDoctor(doctorId) {
  const today = new Date()
  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const end = new Date(today.setHours(23, 59, 59, 999)).toISOString()
  const res = await supabase
    .from('appointments')
    .select('id, appointment_date, status, patients:patients!patient_id(users:users!user_id(full_name))')
    .eq('doctor_id', doctorId)
    .gte('appointment_date', start)
    .lte('appointment_date', end)
    .order('appointment_date', { ascending: true })
  return toResult(res, { context: "fetch doctor's appointments" })
}

export async function countScheduledAppointments() {
  const res = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'scheduled')
  return toResult(res, { context: 'count scheduled appointments', data: res.count })
}

// Exported for completeness; not wired into any UI — cancel-via-status already
// covers the product need for removing an appointment from the active view.
export async function deleteAppointment(id, viewer) {
  if (!viewer || !(await ownsAppointment(id, viewer))) {
    return forbidden('You can only delete your own appointments.')
  }
  const res = await supabase.from('appointments').delete().eq('id', id)
  return toResult(res, { context: 'delete appointment' })
}
