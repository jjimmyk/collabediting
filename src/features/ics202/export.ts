import { ICS202_SECTION_LABELS } from '@/features/ics202/constants'
import type { Ics202FormState } from '@/features/ics202/types'

export type Ics202DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics202DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics202DocxOptions = {
  header?: {
    cells: Ics202DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics202DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics202ExportContext = {
  incidentName?: string
}

export function ics202ExportFilenameBase(form: Ics202FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-202_${form.id.slice(0, 8)}`
}

export function buildIcs202ExportOptions(
  form: Ics202FormState,
  context: Ics202ExportContext = {}
): Ics202DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'U.S. COAST GUARD',
        'INCIDENT OBJECTIVES (ICS 202-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        { label: '2. Incident Location:', value: form.incidentLocation },
        {
          label: '3. Operational Period:',
          value: [form.operationalPeriodFrom, form.operationalPeriodTo]
            .filter((part) => part.trim().length > 0)
            .join(' – '),
        },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: 'Planning Section Chief' },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs202DocxBlocks(
  form: Ics202FormState,
  context: Ics202ExportContext = {}
): Ics202DocxBlock[] {
  const blocks: Ics202DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Incident Objectives (ICS-202)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS202_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Location', form.incidentLocation)
  pushField('Operational Period From', form.operationalPeriodFrom)
  pushField('Operational Period To', form.operationalPeriodTo)

  pushHeading(ICS202_SECTION_LABELS.objectives)
  if (form.objectives.length === 0) {
    pushParagraph('No objectives recorded.')
  } else {
    form.objectives.forEach((row, index) => {
      const prefix = [row.kind, row.label].filter(Boolean).join(' ')
      pushParagraph(
        `${index + 1}. ${prefix}${prefix ? ' — ' : ''}${row.objective || '(no objective text)'}`
      )
    })
  }

  pushHeading(ICS202_SECTION_LABELS['command-emphasis'])
  pushParagraph(form.commandEmphasis || 'No command emphasis recorded.')

  pushHeading(ICS202_SECTION_LABELS['site-safety-plan'])
  pushField('Site Safety Plan Required', form.siteSafetyPlanRequired ? 'Yes' : 'No')
  pushField('Site Safety Plan Located At', form.siteSafetyPlanLocation)

  pushHeading(ICS202_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
