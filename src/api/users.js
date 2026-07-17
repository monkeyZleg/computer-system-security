import { forbidden } from './client'
import { invokeEncrypted } from './encrypted'

// All user/role reads and writes go through the `users-encrypted` Edge Function: the
// server runs the query (and any shaping, e.g. flattening role.description), AES-GCM
// encrypts the JSON, and the response travels the wire as ciphertext. invokeEncrypted
// decrypts it after it arrives.

export async function listRoles() {
  return invokeEncrypted('users-encrypted', { op: 'listRoles' }, { context: 'list roles' })
}

export async function listUsers(viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can view all user accounts.')
  }
  return invokeEncrypted('users-encrypted', { op: 'list' }, { context: 'list users' })
}

// Returns patient-role users with their patients-record id (prescriptions reference
// patients.id, not users.id). Filtering/shaping happens server-side.
export async function listPatientUsers() {
  return invokeEncrypted('users-encrypted', { op: 'listPatientUsers' }, { context: 'list patient users' })
}

export async function listDoctors() {
  return invokeEncrypted('users-encrypted', { op: 'listDoctors' }, { context: 'list doctors' })
}

export async function createStaffUser({ full_name, email, password, role, phone_number }, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can create staff accounts.')
  }
  return invokeEncrypted(
    'users-encrypted',
    { op: 'create', full_name, email, password, role, phone_number },
    { context: 'create staff user', successStatus: 201 },
  )
}

export async function updateUserRole(id, roleDescription, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can change user roles.')
  }
  return invokeEncrypted(
    'users-encrypted',
    { op: 'updateRole', id, roleDescription },
    { context: 'update user role' },
  )
}

export async function countStaff() {
  return invokeEncrypted('users-encrypted', { op: 'countStaff' }, { context: 'count staff' })
}

// Exported for completeness (full CRUD); intentionally not wired into any UI —
// deleting a doctor/nurse with existing appointments/prescriptions fails (FK NO ACTION),
// while deleting a patient-role user cascades and silently removes their patient record.
export async function deleteUser(id, viewer) {
  if (!viewer || viewer.role !== 'admin') {
    return forbidden('Only admins can delete user accounts.')
  }
  return invokeEncrypted('users-encrypted', { op: 'delete', id }, { context: 'delete user' })
}
