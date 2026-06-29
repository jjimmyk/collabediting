const QUALIFICATIONS_PREFIX = 'Qualifications: '
const MAX_SUMMARY_LENGTH = 120

export function formatQualificationsSummary(qualifications: string[] | undefined | null): string | null {
  const labels = (qualifications ?? [])
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  if (labels.length === 0) return null

  const joined = labels.join(', ')
  const summary = `${QUALIFICATIONS_PREFIX}${joined}`
  if (summary.length <= MAX_SUMMARY_LENGTH) {
    return summary
  }

  return `${summary.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`
}

export function normalizeQualificationLabels(values: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(trimmed)
  }
  return normalized
}
