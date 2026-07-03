import { supabase } from '../lib/supabase'
import { unwrap } from './client'

export async function listRoles() {
  return unwrap(
    await supabase.from('role').select('id, description').order('id')
  )
}

async function roleIdFromDescription(description) {
  const row = unwrap(
    await supabase.from('role').select('id').eq('description', description).single()
  )
  return row.id
}

export async function listUsers() {
  const rows = unwrap(
    await supabase
      .from('users')
      .select('id, full_name, email, phone_number, created_at, role:role(description)')
      .order('created_at', { ascending: false })
  )
  return rows.map(u => ({ ...u, role: u.role.description }))
}

export async function listDoctors() {
  return unwrap(
    await supabase
      .from('users')
      .select('id, full_name, role:role!inner(description)')
      .eq('role.description', 'doctor')
      .order('full_name')
  )
}

export async function createStaffUser({ full_name, email, password, role, phone_number }) {
  return unwrap(
    await supabase
      .rpc('register_user', {
        p_full_name: full_name,
        p_email: email,
        p_password: password,
        p_phone_number: phone_number || null,
        p_role: role,
      })
      .single()
  )
}

export async function updateUserRole(id, roleDescription) {
  const roleId = await roleIdFromDescription(roleDescription)
  return unwrap(
    await supabase.from('users').update({ role: roleId }).eq('id', id)
  )
}

export async function countStaff() {
  const roles = await listRoles()
  const ids = roles.filter(r => r.description === 'doctor' || r.description === 'nurse').map(r => r.id)
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('role', ids)
  if (error) throw error
  return count
}

// Exported for completeness (full CRUD); intentionally not wired into any UI —
// deleting a doctor/nurse with existing appointments/prescriptions fails (FK NO ACTION),
// while deleting a patient-role user cascades and silently removes their patient record.
export async function deleteUser(id) {
  return unwrap(await supabase.from('users').delete().eq('id', id))
}
