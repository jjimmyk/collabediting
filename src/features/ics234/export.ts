import { ICS234_SECTION_LABELS } from '@/features/ics234/constants'
import type { Ics234FormState } from '@/features/ics234/types'

export type Ics234DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics234DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics234DocxOptions = {
  header?: {
    cells: Ics234DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics234DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics234ExportContext = {
  incidentName?: string
}

export function ics234ExportFilenameBase(form: Ics234FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-234_${form.id.slice(0, 8)}`
}

export function buildIcs234ExportOptions(
  form: Ics234FormState,
  context: Ics234ExportContext = {}
): Ics234DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'U.S. COAST GUARD',
        'WORK ANALYSIS MATRIX (ICS 234-CG)',
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
        { label: 'Position/Title:', value: form.preparedByPositionTitle || 'Operations Section Chief' },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

export function buildIcs234DocxBlocks(
  form: Ics234FormState,
  context: Ics234ExportContext = {}
): Ics234DocxBlock[] {
  const blocks: Ics234DocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'paragraph', text: trimmed })
  }
  const pushField = (label: string, value: string | undefined | null) => {
    const trimmed = (value ?? '').trim()
    if (trimmed.length === 0) return
    pushParagraph(`${label}: ${trimmed}`)
  }

  blocks.push({ kind: 'title', text: 'Work Analysis Matrix (ICS-234)' })
  const subtitle = form.incidentName.trim() || context.incidentName?.trim()
  if (subtitle) blocks.push({ kind: 'subtitle', text: subtitle })

  pushHeading(ICS234_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Location', form.incidentLocation)
  pushField('Operational Period From', form.operationalPeriodFrom)
  pushField('Operational Period To', form.operationalPeriodTo)

  pushHeading(ICS234_SECTION_LABELS['work-analysis-matrix'])
  if (form.objectives.length === 0) {
    pushParagraph('No objectives recorded.')
  } else {
    form.objectives.forEach((objective, objectiveIndex) => {
      const objectiveName = objective.name.trim() || `Objective ${objectiveIndex + 1}`
      pushParagraph(objectiveName)
      objective.strategies.forEach((strategy, strategyIndex) => {
        const strategyName = strategy.name.trim() || `Strategy ${strategyIndex + 1}`
        pushParagraph(`  ${strategyName}`)
        strategy.tactics.forEach((tactic, tacticIndex) => {
          const tacticName = tactic.name.trim() || `Tactic ${tacticIndex + 1}`
          pushParagraph(`    ${tacticName}`)
        })
      })
    })
  }

  pushHeading(ICS234_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Signature', form.preparedBySignature)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
