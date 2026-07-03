import { supabase } from '../lib/supabase'
import { unwrap } from './client'

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

  return unwrap(await query)
}

export async function issuePrescription({ patient_id, doctor_id, medication, dosage, issue_date }) {
  return unwrap(
    await supabase.from('prescriptions').insert({
      patient_id,
      doctor_id,
      medication,
      dosage,
      issue_date,
    })
  )
}

export async function getRecentPrescriptionsForPatient(patientId, limit = 5) {
  return unwrap(
    await supabase
      .from('prescriptions')
      .select('id, medication, dosage, issue_date')
      .eq('patient_id', patientId)
      .order('issue_date', { ascending: false })
      .limit(limit)
  )
}

// Exported for completeness; not wired into any UI.
export async function deletePrescription(id) {
  return unwrap(await supabase.from('prescriptions').delete().eq('id', id))
}
