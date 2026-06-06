import type * as Y from 'yjs'

export const ICS201_YJS_REMOTE_ORIGIN = 'ics201-remote'

export function encodeBytea(bytes: Uint8Array): string {
  return `\\x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function decodeBytea(value: string): Uint8Array {
  const hex = value.startsWith('\\x') ? value.slice(2) : value
  if (hex.length === 0) return new Uint8Array(0)
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }
  return bytes
}

export function applyTextDiff(ytext: Y.Text, previousText: string, nextText: string): void {
  if (previousText === nextText) return

  let prefix = 0
  const minLength = Math.min(previousText.length, nextText.length)
  while (
    prefix < minLength &&
    previousText.charCodeAt(prefix) === nextText.charCodeAt(prefix)
  ) {
    prefix += 1
  }

  let previousSuffix = previousText.length
  let nextSuffix = nextText.length
  while (
    previousSuffix > prefix &&
    nextSuffix > prefix &&
    previousText.charCodeAt(previousSuffix - 1) === nextText.charCodeAt(nextSuffix - 1)
  ) {
    previousSuffix -= 1
    nextSuffix -= 1
  }

  const deleteCount = previousSuffix - prefix
  if (deleteCount > 0) {
    ytext.delete(prefix, deleteCount)
  }

  const insertText = nextText.slice(prefix, nextSuffix)
  if (insertText.length > 0) {
    ytext.insert(prefix, insertText)
  }
}

export function clipText(value: string, maxLength?: number): string {
  if (maxLength === undefined) return value
  return value.slice(0, maxLength)
}

export function clipObjectives(objectives: string[], maxLength?: number): string[] {
  if (maxLength === undefined) return objectives
  let remaining = maxLength
  const clipped: string[] = []
  for (const objective of objectives) {
    if (remaining <= 0) break
    const next = objective.slice(0, remaining)
    clipped.push(next)
    remaining -= next.length
  }
  return clipped.length > 0 ? clipped : objectives.slice(0, 1).map((entry) => entry.slice(0, maxLength))
}
