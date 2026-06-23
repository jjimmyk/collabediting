import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

export type Ics207ExportContext = {
  incidentName: string
  incidentLocation: string
  operationalPeriodDate: string
  operationalPeriodTime: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedByDateTime: string
  scope: OrgChartExportScope
}

export function ics207ExportFilenameBase(context: Ics207ExportContext): string {
  const incidentSlug =
    context.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'Incident'
  const scopeSlug = context.scope === 'next_op' ? 'next-op' : 'current-op'
  return `ICS-207_${incidentSlug}_${scopeSlug}`
}

export function formatIcs207ExportTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 16).replace(/[:T]/g, '-')
}
