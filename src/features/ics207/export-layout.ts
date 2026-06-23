import { format, isValid, parseISO } from 'date-fns'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import type { Ics207ExportContext } from '@/features/ics207/types'

function formatOperationalPeriodPart(value: string): { date: string; time: string } {
  const trimmed = value.trim()
  if (!trimmed) return { date: '', time: '' }

  const iso = parseISO(trimmed)
  if (isValid(iso)) {
    return {
      date: format(iso, 'MM/dd/yyyy'),
      time: format(iso, 'HH:mm'),
    }
  }

  if (trimmed.includes('T')) {
    const [datePart, timePart = ''] = trimmed.split('T')
    const normalizedTime = timePart.slice(0, 5)
    const datePieces = datePart.split('-')
    if (datePieces.length === 3) {
      return {
        date: `${datePieces[1]}/${datePieces[2]}/${datePieces[0]}`,
        time: normalizedTime,
      }
    }
  }

  if (trimmed.includes(' ')) {
    const [datePart, ...timeParts] = trimmed.split(/\s+/)
    return { date: datePart ?? trimmed, time: timeParts.join(' ') }
  }

  return { date: trimmed, time: '' }
}

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
  const from = formatOperationalPeriodPart(input.operationalPeriodFrom ?? '')
  const to = formatOperationalPeriodPart(input.operationalPeriodTo ?? '')

  let operationalPeriodDate = from.date
  let operationalPeriodTime = to.time || from.time

  if (input.scope === 'next_op') {
    operationalPeriodDate = operationalPeriodDate
      ? `${operationalPeriodDate}${scopeLabel}`
      : `Next operational period${scopeLabel}`
  }

  return {
    incidentName: input.incidentName.trim() || 'Incident',
    incidentLocation: (input.incidentLocation ?? '').trim(),
    operationalPeriodDate,
    operationalPeriodTime,
    preparedByName: (input.preparedByName ?? '').trim(),
    preparedByPositionTitle: (input.preparedByPositionTitle ?? '').trim(),
    preparedByDateTime: format(now, 'MM/dd/yyyy HH:mm'),
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
