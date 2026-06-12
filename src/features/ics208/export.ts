import { ICS208_SECTION_LABELS } from '@/features/ics208/constants'
import type { Ics208FormState } from '@/features/ics208/types'
import { formatIcs208YesNo } from '@/features/ics208/utils'

export type Ics208DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics208DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics208DocxOptions = {
  header?: {
    cells: Ics208DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics208DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics208ExportContext = {
  incidentName?: string
}

export function ics208ExportFilenameBase(form: Ics208FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-208_${form.id.slice(0, 8)}`
}

function formatOperationalPeriod(form: Ics208FormState): string {
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

export function buildIcs208ExportOptions(
  form: Ics208FormState,
  context: Ics208ExportContext = {}
): Ics208DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'SAFETY MESSAGE/PLAN (ICS 208)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Operational Period:', value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['Prepared by (Safety Officer):'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: form.preparedByPositionTitle },
        { label: 'Signature:', value: form.preparedBySignature },
        { label: 'Date/Time:', value: form.preparedByDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs208DocxBlocks(
  form: Ics208FormState,
  context: Ics208ExportContext = {}
): Ics208DocxBlock[] {
  const blocks: Ics208DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Safety Message/Plan (ICS-208)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS208_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Operational Period Date From', form.operationalPeriodDateFrom)
  pushField('Operational Period Date To', form.operationalPeriodDateTo)
  pushField('Operational Period Time From', form.operationalPeriodTimeFrom)
  pushField('Operational Period Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS208_SECTION_LABELS['safety-message-plan'])
  pushParagraph(form.safetyMessagePlan || 'No safety message/plan recorded.')

  pushHeading(ICS208_SECTION_LABELS['site-safety-plan'])
  pushField('Site Safety Plan Required', formatIcs208YesNo(form.siteSafetyPlanRequired))
  pushField('Approved Site Safety Plan(s) Located At', form.approvedSiteSafetyPlanLocatedAt)

  pushHeading(ICS208_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time', form.preparedByDateTime)

  return blocks
}
