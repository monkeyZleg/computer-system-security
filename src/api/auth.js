import { supabase } from '../lib/supabase'
import { toResult } from './client'

export async function signUp({ full_name, email, password, phone_number }) {
  const res = await supabase
    .rpc('register_user', {
      p_full_name: full_name,
      p_email: email,
      p_password: password,
      p_phone_number: phone_number || null,
      p_role: 'patient',
    })
    .single()
  // 23505 = unique_violation (users_email_key): surface it instead of a generic 500.
  if (res.error?.code === '23505') {
    return { status: 409, error: 'Conflict', details: 'This email is already used by another account. Please use another email to create your new account.' }
  }
  return toResult(res, { successStatus: 201, context: 'register user' })
}

export async function signIn({ email, password }) {
  const res = await supabase.rpc('authenticate_user', {
    p_email: email,
    p_password: password,
  })

  if (res.error) {
    console.error('Failed to authenticate user:', res.error)
    return { status: 500, error: 'Internal Server Error', details: res.error.message }
  }
  if (!res.data || res.data.length === 0) {
    return { status: 401, error: 'Unauthorized', details: 'Invalid email or password' }
  }
  return { status: 200, data: res.data[0] }
}
