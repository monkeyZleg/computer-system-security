import { supabase } from '../lib/supabase'
import { unwrap } from './client'

export async function listPatients() {
  return unwrap(
    await supabase
      .from('patients')
      .select('id, date_of_birth, users:users!user_id(full_name, phone_number)')
      .order('created_at', { ascending: false })
  )
}

export async function getPatientById(id) {
  return unwrap(
    await supabase
      .from('patients')
      .select('id, date_of_birth, home_address, diagnosis, medical_history, users:users!user_id(full_name, phone_number)')
      .eq('id', id)
      .single()
  )
}

export async function getPatientByUserId(userId) {
  return unwrap(
    await supabase
      .from('patients')
      .select('id, date_of_birth, home_address, diagnosis, medical_history, insurance_id, users:users!user_id(full_name, phone_number)')
      .eq('user_id', userId)
      .single()
  )
}

export async function getPatientIdByUserId(userId) {
  return unwrap(
    await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .single()
  )
}

export async function updatePatientRecord(patientId, { home_address, diagnosis, medical_history }) {
  return unwrap(
    await supabase
      .from('patients')
      .update({ home_address, diagnosis, medical_history, updated_at: new Date().toISOString() })
      .eq('id', patientId)
  )
}

export async function searchPatientsByName(query, limit = 5) {
  return unwrap(
    await supabase
      .from('patients')
      .select('id, users:users!user_id(full_name)')
      .ilike('users.full_name', `%${query}%`)
      .limit(limit)
  )
}

export async function createPatientRecord({ user_id, date_of_birth }) {
  return unwrap(
    await supabase.from('patients').insert({ user_id, date_of_birth })
  )
}

export async function countPatients() {
  const { count, error } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count
}
