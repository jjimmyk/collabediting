import { ICS215A_SECTION_LABELS } from '@/features/ics215a/constants'
import {
  formatIcs215aIncidentAreaLabel,
  formatIcs215aLocationSummary,
} from '@/features/ics215a/location-utils'
import type { Ics215aFormState } from '@/features/ics215a/types'
import { formatIcs215aRiskGain } from '@/features/ics215a/utils'

export type Ics215aDocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics215aDocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics215aDocxOptions = {
  header?: {
    cells: Ics215aDocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics215aDocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics215aExportContext = {
  incidentName?: string
}

export function ics215aExportFilenameBase(form: Ics215aFormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-215A_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics215aFormState): string {
  const fromParts = [form.operationalPeriodDateFrom, form.operationalPeriodTimeFrom]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  const toParts = [form.operationalPeriodDateTo, form.operationalPeriodTimeTo]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  if (fromParts.length === 0 && toParts.length === 0) return ''
  if (fromParts.length > 0 && toParts.length > 0) return `${fromParts} – ${toParts}`
  return fromParts || toParts
}

function formatPreparedDateTime(form: Ics215aFormState): string {
  const parts = [form.preparedDate, form.preparedTime].filter((part) => part.trim().length > 0)
  return parts.join(' ')
}

export function buildIcs215aExportOptions(
  form: Ics215aFormState,
  context: Ics215aExportContext = {}
): Ics215aDocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'INCIDENT ACTION PLAN SAFETY ANALYSIS (ICS 215A-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Incident Location:', value: form.incidentLocation },
        {
          label: '3. Date/Time Prepared:',
          value: formatPreparedDateTime(form) || form.preparedDateTime,
        },
        { label: '4. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: form.preparedByPositionTitle },
        { label: 'Signature:', value: form.preparedBySignature },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs215aDocxBlocks(
  form: Ics215aFormState,
  context: Ics215aExportContext = {}
): Ics215aDocxBlock[] {
  const blocks: Ics215aDocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    for (const line of trimmed.split(/\r?\n/)) {
      const segment = line.trim()
      if (segment.length === 0) continue
      blocks.push({ kind: 'paragraph', text: segment })
    }
  }
  const pushField = (label: string, value: string | undefined | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length === 0) return
    pushParagraph(`${label}: ${trimmed}`)
  }

  blocks.push({
    kind: 'title',
    text: 'Incident Action Plan Safety Analysis (ICS 215A-CG)',
  })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS215A_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Location', form.incidentLocation)
  pushField('Date Prepared', form.preparedDate)
  pushField('Time Prepared', form.preparedTime)

  pushHeading(ICS215A_SECTION_LABELS['operational-period'])
  pushField('Date From', form.operationalPeriodDateFrom)
  pushField('Time From', form.operationalPeriodTimeFrom)
  pushField('Date To', form.operationalPeriodDateTo)
  pushField('Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS215A_SECTION_LABELS['safety-analysis'])
  if (form.safetyAnalysisRows.length === 0) {
    pushParagraph('No safety analysis rows recorded.')
  } else {
    form.safetyAnalysisRows.forEach((row, index) => {
      pushParagraph(`Row ${index + 1}`)
      pushField(
        'Incident Area',
        formatIcs215aIncidentAreaLabel(row.incidentArea)
      )
      pushField('Location', formatIcs215aLocationSummary(row.location))
      pushField('Hazards/Risks', row.hazardsRisks)
      pushField('Mitigations', row.mitigations)
      pushField('Risk/Gain', formatIcs215aRiskGain(row))
    })
  }

  pushHeading(ICS215A_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
