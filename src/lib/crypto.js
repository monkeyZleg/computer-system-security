// Client-side decryption for AES-GCM payloads returned by encrypted Edge Functions.
//
// The Edge Function encrypts the JSON response with the signed-in account's
// data_key — a random per-user AES-256 key stored in users.data_key. The key
// crosses the wire exactly once, in the authenticate_user/register_user response
// at sign-in (over TLS); after that, requests carry only the caller's user id
// and the Edge Function looks the key (and the caller's role) up in the
// database itself. No password ever rides along with API calls.
//
// The key is kept in sessionStorage so it survives a page refresh; it is
// cleared on sign-out and when the tab closes.
const STORAGE_KEY = 'hpms.sessionAuth'

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

let session = readStored()
let keyPromise = null

// Call after sign-in/sign-up with the account id and its data_key so
// decryptPayload can import the key. Call clearSessionKey() on sign-out.
export function setSessionAuth({ userId, dataKey }) {
  session = { userId, dataKey }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  keyPromise = null
}

// The signed-in user's id — sent with every encrypted call so the Edge
// Function can look up the caller's role and key server-side.
export function getSessionUserId() {
  return session?.userId ?? null
}

export function clearSessionKey() {
  session = null
  sessionStorage.removeItem(STORAGE_KEY)
  keyPromise = null
}

function getKey() {
  if (!session?.dataKey) {
    return Promise.reject(new Error('No session key for this session — sign in again.'))
  }
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      'raw',
      b64ToBytes(session.dataKey),
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
  }
  return keyPromise
}

// Accepts { iv, data } (base64) as produced by the Edge Function and returns
// the decrypted, parsed JSON value.
export async function decryptPayload({ iv, data }) {
  const key = await getKey()
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBytes(iv) },
    key,
    b64ToBytes(data),
  )
  return JSON.parse(new TextDecoder().decode(plaintext))
}
