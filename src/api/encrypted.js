import { supabase } from '../lib/supabase'
import { decryptPayload, getSessionUserId } from '../lib/crypto'

// Shared client for the *-encrypted Edge Functions. Each function runs the query
// server-side, AES-GCM encrypts the JSON result with the caller's per-user
// data_key, and returns { iv, data } so the response travels the wire as
// ciphertext. The request carries only the signed-in user's id — the Edge
// Function looks up the caller's role and encryption key in the database, so
// authorization can't be spoofed from the client and no secret is sent.
//
//   invokeEncrypted('patients-encrypted', { op: 'list' }, { context: 'list patients' })
export async function invokeEncrypted(fn, body, { context, successStatus = 200 } = {}) {
  const { data: encrypted, error } = await supabase.functions.invoke(fn, {
    body: { ...body, userId: getSessionUserId() },
  })

  if (error || !encrypted) {
    console.error(context ? `Failed to ${context}:` : 'API error:', error)
    return { status: 500, error: 'Internal Server Error', details: 'Something went wrong. Please try again later.' }
  }

  try {
    const data = await decryptPayload(encrypted)
    return { status: successStatus, data }
  } catch (e) {
    console.error(`Failed to decrypt (${context}):`, e)
    return { status: 500, error: 'Internal Server Error', details: 'Could not decrypt the response.' }
  }
}
