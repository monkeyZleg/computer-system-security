// Client-side decryption for AES-GCM payloads returned by encrypted Edge Functions.
//
// The Edge Function encrypts the JSON response so it travels the wire as
// ciphertext (visible as ciphertext in the browser Network tab). Instead of a
// hardcoded shared key, the AES-GCM key is derived from the signed-in account's
// password with PBKDF2 — the client derives it here, the Edge Function derives
// the same key server-side from the password it's sent, and the two must match
// for decryption to succeed.
//
// NOTE: sending the plaintext password with every request so the server can
// re-derive the key is only acceptable for this classroom demonstration — a
// production system would never do this.
const SALT_B64 = 'e/ghT9ctg3Uwg0zpNvtzpg=='
const PBKDF2_ITERATIONS = 100000

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

// Derives an AES-256-GCM decrypt key from the account password via PBKDF2.
// Must be called (and produce the same key) before decryptPayload can succeed.
async function deriveKeyFromPassword(password) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBytes(SALT_B64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

let sessionPassword = null
let keyPromise = null

// Call after sign-in/sign-up with the plaintext password so decryptPayload has
// something to derive the key from. Call clearSessionKey() on sign-out.
export function setSessionPassword(password) {
  sessionPassword = password
  keyPromise = null
}

export function getSessionPassword() {
  return sessionPassword
}

export function clearSessionKey() {
  sessionPassword = null
  keyPromise = null
}

function getKey() {
  if (!sessionPassword) {
    return Promise.reject(new Error('No account password set for this session — sign in again.'))
  }
  if (!keyPromise) {
    keyPromise = deriveKeyFromPassword(sessionPassword)
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
