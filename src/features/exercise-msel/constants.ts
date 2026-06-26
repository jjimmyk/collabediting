export const MSEL_INJECT_CATEGORIES = [
  'Operations',
  'Logistics',
  'Communications',
  'Intelligence',
  'Planning',
  'Safety',
  'Medical',
  'Public Affairs',
  'Finance / Administration',
  'Legal',
] as const

export type MselInjectCategory = (typeof MSEL_INJECT_CATEGORIES)[number]

export function normalizeMselCategory(value: unknown): string {
  if (typeof value !== 'string') {
    return 'Operations'
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Operations'
  }
  const match = MSEL_INJECT_CATEGORIES.find(
    (category) => category.toLowerCase() === trimmed.toLowerCase()
  )
  return match ?? trimmed
}
