import { supabase } from '../lib/supabase'
import { toResult } from './client'

export async function listPrescriptions({ role, userId, patientId }) {
  let query = supabase
    .from('prescriptions')
    .select('id, medication, dosage, issue_date, patients:patients!patient_id(users:users!user_id(full_name)), users:users!doctor_id(full_name)')
    .order('issue_date', { ascending: false })

  if (role === 'patient' && patientId) {
    query = query.eq('patient_id', patientId)
  } else if (role === 'doctor') {
    query = query.eq('doctor_id', userId)
  }

  const res = await query
  return toResult(res, { context: 'list prescriptions' })
}

export async function issuePrescription({ patient_id, doctor_id, medication, dosage, issue_date }) {
  const res = await supabase.from('prescriptions').insert({
    patient_id,
    doctor_id,
    medication,
    dosage,
    issue_date,
  })
  return toResult(res, { successStatus: 201, context: 'issue prescription' })
}

export async function getRecentPrescriptionsForPatient(patientId, limit = 5) {
  const res = await supabase
    .from('prescriptions')
    .select('id, medication, dosage, issue_date')
    .eq('patient_id', patientId)
    .order('issue_date', { ascending: false })
    .limit(limit)
  return toResult(res, { context: 'fetch recent prescriptions' })
}

// Exported for completeness; not wired into any UI.
export async function deletePrescription(id) {
  const res = await supabase.from('prescriptions').delete().eq('id', id)
  return toResult(res, { context: 'delete prescription' })
}
