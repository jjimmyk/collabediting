import type { Ics207ExportContext } from '@/features/ics207/types'

export const ICS207_FORM_TITLE_LINES = [
  'DEPARTMENT OF HOMELAND SECURITY',
  'U.S. COAST GUARD',
  'INCIDENT ORGANIZATION CHART (ICS 207-CG)',
] as const

export type Ics207HeaderCell = {
  label: string
  value: string
  subFields?: Array<{ label: string; value: string }>
}

export type Ics207PreparedByFields = {
  name: string
  positionTitle: string
  dateTime: string
}

export type Ics207ExportLayoutBlock =
  | { kind: 'form-title' }
  | { kind: 'header-row'; cells: Ics207HeaderCell[] }
  | { kind: 'org-chart-image'; dataUrl?: string; alt: string }
  | { kind: 'org-chart-live' }
  | { kind: 'prepared-by'; fields: Ics207PreparedByFields }

function buildHeaderCells(context: Ics207ExportContext): Ics207HeaderCell[] {
  return [
    { label: '1. Incident Name:', value: context.incidentName },
    { label: '2. Incident Location:', value: context.incidentLocation },
    {
      label: '3. Operational Period (Date/Time):',
      value: '',
      subFields: [
        { label: 'Date:', value: context.operationalPeriodDate },
        { label: 'Time:', value: context.operationalPeriodTime },
      ],
    },
  ]
}

function buildPreparedByFields(context: Ics207ExportContext): Ics207PreparedByFields {
  return {
    name: context.preparedByName,
    positionTitle: context.preparedByPositionTitle,
    dateTime: context.preparedByDateTime,
  }
}

export function buildIcs207ExportLayout(
  context: Ics207ExportContext,
  chartImage?: { dataUrl: string }
): Ics207ExportLayoutBlock[] {
  return [
    { kind: 'form-title' },
    { kind: 'header-row', cells: buildHeaderCells(context) },
    chartImage
      ? { kind: 'org-chart-image', dataUrl: chartImage.dataUrl, alt: 'Organization chart' }
      : { kind: 'org-chart-live' },
    { kind: 'prepared-by', fields: buildPreparedByFields(context) },
  ]
}
