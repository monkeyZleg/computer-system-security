import { supabase } from '../lib/supabase'
import { decryptPayload, getSessionPassword } from '../lib/crypto'

// Shared client for the *-encrypted Edge Functions. Each function runs the query
// server-side, AES-GCM encrypts the JSON result, and returns { iv, data } so the
// response travels the wire as ciphertext (you see ciphertext in the Network tab).
// We decrypt here with Web Crypto after it arrives. The encryption key is derived
// from the account password, so it rides along on every call for the Edge
// Function to derive the matching key with.
//
//   invokeEncrypted('patients-encrypted', { op: 'list', viewer }, { context: 'list patients' })
export async function invokeEncrypted(fn, body, { context, successStatus = 200 } = {}) {
  const { data: encrypted, error } = await supabase.functions.invoke(fn, {
    body: { ...body, password: getSessionPassword() },
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
