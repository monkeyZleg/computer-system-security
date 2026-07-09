import { supabase } from '../lib/supabase'
import { toResult } from './client'

export async function listPatients() {
  const res = await supabase
    .from('patients')
    .select('id, date_of_birth, users:users!user_id(full_name, phone_number)')
    .order('created_at', { ascending: false })
  return toResult(res, { context: 'list patients' })
}

export async function getPatientById(id) {
  const res = await supabase
    .from('patients')
    .select('id, date_of_birth, home_address, diagnosis, medical_history, users:users!user_id(full_name, phone_number)')
    .eq('id', id)
    .single()
  return toResult(res, { context: 'fetch patient record' })
}

export async function getPatientByUserId(userId) {
  const res = await supabase
    .from('patients')
    .select('id, date_of_birth, home_address, diagnosis, medical_history, insurance_id, users:users!user_id(full_name, phone_number)')
    .eq('user_id', userId)
    .single()
  return toResult(res, { context: 'fetch patient record' })
}

export async function getPatientIdByUserId(userId) {
  const res = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .single()
  return toResult(res, { context: 'fetch patient id' })
}

export async function updatePatientRecord(patientId, { home_address, diagnosis, medical_history }) {
  const res = await supabase
    .from('patients')
    .update({
      home_address,
      diagnosis,
      medical_history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', patientId);

  return toResult(res, { context: 'update patient record' })
}

export async function searchPatientsByName(query, limit = 5) {
  const res = await supabase
    .from('patients')
    .select('id, users:users!user_id(full_name)')
    .ilike('users.full_name', `%${query}%`)
    .limit(limit)
  return toResult(res, { context: 'search patients' })
}

export async function createPatientRecord({ user_id, date_of_birth }) {
  const res = await supabase.from('patients').insert({ user_id, date_of_birth })
  return toResult(res, { successStatus: 201, context: 'create patient record' })
}

export async function countPatients() {
  const res = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
  return toResult(res, { context: 'count patients', data: res.count })
}
