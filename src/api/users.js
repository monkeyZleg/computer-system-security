import { supabase } from '../lib/supabase'
import { toResult, forbidden } from './client'

export async function listRoles() {
  const res = await supabase.from('role').select('id, description').order('id')
  return toResult(res, { context: 'list roles' })
}

async function roleIdFromDescription(description) {
  return await supabase.from('role').select('id').eq('description', description).single()
}

export async function listUsers(viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can view all user accounts.')
  }
  const res = await supabase
    .from('users')
    .select('id, full_name, email, phone_number, created_at, role:role(description)')
    .order('created_at', { ascending: false })

  if (res.error) {
    console.error('Failed to list users:', res.error)
    return { status: 500, error: 'Internal Server Error', details: res.error.message }
  }
  return { status: 200, data: res.data.map(u => ({ ...u, role: u.role.description })) }
}

export async function listDoctors() {
  const res = await supabase
    .from('users')
    .select('id, full_name, role:role!inner(description)')
    .eq('role.description', 'doctor')
    .order('full_name')
  return toResult(res, { context: 'list doctors' })
}

export async function createStaffUser({ full_name, email, password, role, phone_number }, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can create staff accounts.')
  }
  const res = await supabase
    .rpc('register_user', {
      p_full_name: full_name,
      p_email: email,
      p_password: password,
      p_phone_number: phone_number || null,
      p_role: role,
    })
    .single()
  return toResult(res, { successStatus: 201, context: 'create staff user' })
}

export async function updateUserRole(id, roleDescription, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can change user roles.')
  }
  const roleRes = await roleIdFromDescription(roleDescription)
  if (roleRes.error) {
    console.error('Failed to resolve role id:', roleRes.error)
    return { status: 500, error: 'Internal Server Error', details: roleRes.error.message }
  }

  const res = await supabase.from('users').update({ role: roleRes.data.id }).eq('id', id)
  return toResult(res, { context: 'update user role' })
}

export async function countStaff() {
  const rolesRes = await listRoles()
  if (rolesRes.error) return rolesRes

  const ids = rolesRes.data.filter(r => r.description === 'doctor' || r.description === 'nurse').map(r => r.id)
  const res = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('role', ids)
  return toResult(res, { context: 'count staff', data: res.count })
}

// Exported for completeness (full CRUD); intentionally not wired into any UI —
// deleting a doctor/nurse with existing appointments/prescriptions fails (FK NO ACTION),
// while deleting a patient-role user cascades and silently removes their patient record.
export async function deleteUser(id, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can delete user accounts.')
  }
  const res = await supabase.from('users').delete().eq('id', id)
  return toResult(res, { context: 'delete user' })
}
