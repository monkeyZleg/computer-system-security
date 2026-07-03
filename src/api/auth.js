import { supabase } from '../lib/supabase'
import { unwrap } from './client'

export async function signUp({ full_name, email, password, phone_number }) {
  return unwrap(
    await supabase
      .rpc('register_user', {
        p_full_name: full_name,
        p_email: email,
        p_password: password,
        p_phone_number: phone_number || null,
        p_role: 'patient',
      })
      .single()
  )
}

export async function signIn({ email, password }) {
  const rows = unwrap(
    await supabase.rpc('authenticate_user', {
      p_email: email,
      p_password: password,
    })
  )
  if (!rows || rows.length === 0) throw new Error('Invalid email or password')
  return rows[0]
}
