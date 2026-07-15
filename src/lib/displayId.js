// Generates a sequential, human-friendly display number from a row's position
// in the fetched list — so the UI never exposes the raw database UUID.
//
//   seqId(index)                -> "0001"
//   seqId(index, 'RX')          -> "RX-0001"
//   seqId(index, 'APT', { pad: 3 }) -> "APT-001"
export function seqId(index, prefix = '', { pad = 4 } = {}) {
  const n = String(index + 1).padStart(pad, '0')
  return prefix ? `${prefix}-${n}` : n
}
