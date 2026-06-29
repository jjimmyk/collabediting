import { ICS205A_SECTION_LABELS } from '@/features/ics205a/constants'
import {
  contactRowHasContent,
  resolveIcs205aContactDisplayLabels,
  type Ics205aContactRowOptionsInput,
} from '@/features/ics205a/ics205a-contact-row-options'
import type { Ics205aFormState } from '@/features/ics205a/types'

export type Ics205aDocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics205aDocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics205aDocxOptions = {
  header?: {
    cells: Ics205aDocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics205aDocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics205aExportContext = {
  incidentName?: string
  contactRowOptionsInput?: Ics205aContactRowOptionsInput
}

export function ics205aExportFilenameBase(form: Ics205aFormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-205A_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics205aFormState): string {
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

export function buildIcs205aExportOptions(
  form: Ics205aFormState,
  context: Ics205aExportContext = {}
): Ics205aDocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'COMMUNICATIONS LIST (ICS 205A)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Prepared by (Communications Unit Leader):'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: form.preparedByPositionTitle },
        { label: 'Signature:', value: form.preparedBySignature },
        { label: 'Date/Time:', value: form.preparedByDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs205aDocxBlocks(
  form: Ics205aFormState,
  context: Ics205aExportContext = {}
): Ics205aDocxBlock[] {
  const blocks: Ics205aDocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Communications List (ICS-205A)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS205A_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Operational Period Date From', form.operationalPeriodDateFrom)
  pushField('Operational Period Date To', form.operationalPeriodDateTo)
  pushField('Operational Period Time From', form.operationalPeriodTimeFrom)
  pushField('Operational Period Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS205A_SECTION_LABELS['local-communications-info'])
  const filledContacts = form.contactRows.filter(contactRowHasContent)
  if (filledContacts.length === 0) {
    pushParagraph('No local communications contacts recorded.')
  } else {
    filledContacts.forEach((row, index) => {
      const labels = context.contactRowOptionsInput
        ? resolveIcs205aContactDisplayLabels(row, context.contactRowOptionsInput)
        : { assignedPosition: row.assignedPosition, name: row.name }
      pushParagraph(`Contact ${index + 1}`)
      pushField('Incident Assigned Position', labels.assignedPosition)
      pushField('Name', labels.name)
      pushField('Cell Phone #', row.cellPhone)
      pushField('Radio Frequency', row.radioFrequency)
      pushField('Other', row.other)
    })
  }

  pushHeading(ICS205A_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time', form.preparedByDateTime)

  return blocks
}
