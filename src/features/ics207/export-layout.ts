import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import type { Ics207ExportContext } from '@/features/ics207/types'

export function buildIcs207ExportContext(input: {
  scope: OrgChartExportScope
  incidentName: string
  incidentLocation?: string | null
  operationalPeriodFrom?: string | null
  operationalPeriodTo?: string | null
  preparedByName?: string | null
  preparedByPositionTitle?: string | null
}): Ics207ExportContext {
  const now = new Date()
  const scopeLabel = input.scope === 'next_op' ? ' (Next OP projection)' : ''
  const periodFrom = (input.operationalPeriodFrom ?? '').trim()
  const periodTo = (input.operationalPeriodTo ?? '').trim()

  let operationalPeriodDate = periodFrom
  let operationalPeriodTime = periodTo

  if (periodFrom.includes(' ') && !periodTo) {
    const [datePart, ...timeParts] = periodFrom.split(/\s+/)
    operationalPeriodDate = datePart ?? periodFrom
    operationalPeriodTime = timeParts.join(' ')
  }

  if (input.scope === 'next_op' && operationalPeriodDate) {
    operationalPeriodDate = `${operationalPeriodDate}${scopeLabel}`
  } else if (input.scope === 'next_op') {
    operationalPeriodDate = `Next operational period${scopeLabel}`
  }

  return {
    incidentName: input.incidentName.trim() || 'Incident',
    incidentLocation: (input.incidentLocation ?? '').trim(),
    operationalPeriodDate,
    operationalPeriodTime,
    preparedByName: (input.preparedByName ?? '').trim(),
    preparedByPositionTitle: (input.preparedByPositionTitle ?? '').trim(),
    preparedByDateTime: now.toLocaleString(),
    scope: input.scope,
  }
}

export function resolveIcs207PreparedByName(
  profileEmail: string | null | undefined,
  profileDisplayName?: string | null
): string {
  const displayName = (profileDisplayName ?? '').trim()
  if (displayName) return displayName
  return (profileEmail ?? '').trim()
}
