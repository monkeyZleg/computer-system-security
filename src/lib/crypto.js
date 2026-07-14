// Client-side decryption for AES-GCM payloads returned by encrypted Edge Functions.
//
// The Edge Function encrypts the JSON response so it travels the wire as
// ciphertext (visible as ciphertext in the browser Network tab). We hold the
// matching symmetric key here and decrypt after the response arrives.
//
// NOTE: shipping the symmetric key to the browser is only acceptable for this
// classroom demonstration — a production system would use per-user keys or a
// server-held key and never expose it to the client.
const KEY_B64 = 'W1NqNbmro9ItAQZ5eSr7fJaZ2s55LFnC7Nk5hD30++0='

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

let keyPromise
function getKey() {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      'raw',
      b64ToBytes(KEY_B64),
      'AES-GCM',
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
