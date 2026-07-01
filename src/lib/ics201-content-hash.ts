import type { Ics201FormState } from '@/features/ics201/types'
import { cloneIcs201FormState, normalizeIcs201FormState } from '@/features/ics201/utils'

function stableSerialize(form: Ics201FormState): string {
  return JSON.stringify(normalizeIcs201FormState(cloneIcs201FormState(form)))
}

export function hashIcs201FormStateSync(form: Ics201FormState): string {
  const input = stableSerialize(form)
  let hash = 5381
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export async function hashIcs201FormState(form: Ics201FormState): Promise<string> {
  const input = stableSerialize(form)
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoded = new TextEncoder().encode(input)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  return hashIcs201FormStateSync(form)
}
