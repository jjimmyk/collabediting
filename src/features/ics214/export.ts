import { ICS214_SECTION_LABELS } from '@/features/ics214/constants'
import type { Ics214FormState } from '@/features/ics214/types'

export type Ics214DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics214DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics214DocxOptions = {
  header?: {
    cells: Ics214DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics214DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics214ExportContext = {
  incidentName?: string
}

export function ics214ExportFilenameBase(form: Ics214FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-214_${form.id.slice(0, 8)}`
}

export function buildIcs214ExportOptions(
  form: Ics214FormState,
  context: Ics214ExportContext = {}
): Ics214DocxOptions {
  return {
    header: {
      topLines: ['DEPARTMENT OF HOMELAND SECURITY', 'MARATHON', 'ACTIVITY LOG (ICS 214)'],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Unit Name:', value: form.unitName },
        {
          label: '3. Operational Period:',
          value: [form.operationalPeriodFrom, form.operationalPeriodTo]
            .filter((part) => part.trim().length > 0)
            .join(' – '),
        },
        { label: '4. Date of Activity:', value: form.dateOfActivity },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: 'Unit Leader' },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs214DocxBlocks(
  form: Ics214FormState,
  context: Ics214ExportContext = {}
): Ics214DocxBlock[] {
  const blocks: Ics214DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Activity Log (ICS-214)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (form.unitName.trim()) subtitleParts.push(form.unitName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS214_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Unit Name', form.unitName)
  pushField('Operational Period From', form.operationalPeriodFrom)
  pushField('Operational Period To', form.operationalPeriodTo)
  pushField('Date of Activity', form.dateOfActivity)

  pushHeading(ICS214_SECTION_LABELS['activity-log'])
  if (form.entries.length === 0) {
    pushParagraph('No activity log entries recorded.')
  } else {
    form.entries.forEach((row, index) => {
      pushParagraph(
        `${index + 1}. ${row.completedAt || '(no time)'} — ${row.completedBy || '(unknown)'} — ${row.notableActivities || '(no activity text)'}`
      )
    })
  }

  pushHeading(ICS214_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
