import { ICS215_SECTION_LABELS } from '@/features/ics215/constants'
import { type Ics215ExportContext } from '@/features/ics215/export-layout'
import type { Ics215FormState } from '@/features/ics215/types'
import { computeIcs215ColumnTotals, computeIcs215ResourceTotals } from '@/features/ics215/utils'
import { formatWorkAssignmentTargetLabel } from '@/lib/work-assignment-target'

export type Ics215DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics215DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics215DocxOptions = {
  header?: {
    cells: Ics215DocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics215DocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export {
  buildIcs215ExportLayout,
  ics215ExportFilenameBase,
  ICS215_FORM_TITLE_LINES,
  type Ics215ExportContext,
} from '@/features/ics215/export-layout'
export {
  buildIcs215DocxXml,
  downloadIcs215Docx,
  downloadIcs215Pdf,
  paginateIcs215Export,
  type Ics215PhysicalPage,
} from '@/features/ics215/export-download'
export {
  paginateIcs215TemplateExport,
  type Ics215TemplatePagePlan,
} from '@/features/ics215/export-template-pdf'

export function buildIcs215ExportOptions(
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Ics215DocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'U.S. COAST GUARD',
        'OPERATIONAL PLANNING WORKSHEET (ICS 215-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName || context.incidentName || '' },
        {
          label: '2. Incident Location:',
          value: context.incidentLocation?.trim() ?? '',
        },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        { label: 'Name:', value: form.preparedByName },
        { label: 'Position/Title:', value: form.preparedByPositionTitle },
        { label: 'Date/Time:', value: form.preparedDateTime || new Date().toLocaleString() },
      ],
    },
  }
}

/** Legacy flat blocks for IAP bundle consumers. */
export function buildIcs215DocxBlocks(
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Ics215DocxBlock[] {
  const blocks: Ics215DocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Operational Planning Worksheet (ICS-215)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  else if (context.incidentName?.trim()) subtitleParts.push(context.incidentName.trim())
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading(ICS215_SECTION_LABELS['incident-info'])
  pushField('Incident Name', form.incidentName || context.incidentName)
  pushField('Incident Location', context.incidentLocation)
  pushField('Operational Period Date From', form.operationalPeriodDateFrom)
  pushField('Operational Period Date To', form.operationalPeriodDateTo)
  pushField('Operational Period Time From', form.operationalPeriodTimeFrom)
  pushField('Operational Period Time To', form.operationalPeriodTimeTo)

  pushHeading(ICS215_SECTION_LABELS['work-assignments'])
  if (form.workAssignments.length === 0) {
    pushParagraph('No work assignments recorded.')
  } else {
    const columnTotals = computeIcs215ColumnTotals(form.resourceColumns, form.workAssignments)
    form.workAssignments.forEach((row, index) => {
      pushParagraph(`Assignment ${index + 1}`)
      pushField('Assignee', formatWorkAssignmentTargetLabel(row.assignee, context.roster))
      pushField('Work Assignment', row.workAssignment)
      for (const column of form.resourceColumns) {
        const value = row.resourceValues[column.id]
        if (!value) continue
        const hasValue =
          value.required.trim().length > 0 ||
          value.have.trim().length > 0 ||
          value.need.trim().length > 0
        if (!hasValue) continue
        pushParagraph(
          `${column.label}: Req ${value.required || '—'}, Have ${value.have || '—'}, Need ${value.need || '—'}`
        )
      }
      pushField('Overhead Position(s)', row.overheadPositions)
      pushField('Special Equipment & Supplies', row.specialEquipmentSupplies)
      pushField('Reporting Location', row.reportingLocation)
      pushField('Requested Arrival Time', row.requestedArrivalTime)
      pushField('Status', row.status)
    })

    pushParagraph('Column Totals')
    for (const column of form.resourceColumns) {
      const value = columnTotals[column.id]
      if (!value) continue
      pushParagraph(
        `${column.label}: Req ${value.required || '—'}, Have ${value.have || '—'}, Need ${value.need || '—'}`
      )
    }

    const resourceTotals = computeIcs215ResourceTotals(
      form.resourceColumns,
      form.workAssignments
    )
    pushField('Total Resources Required', resourceTotals.totalResourcesRequired)
    pushField('Total Resources Have on Hand', resourceTotals.totalResourcesHaveOnHand)
    pushField('Total Resources Need To Order', resourceTotals.totalResourcesNeedToOrder)
  }

  pushHeading(ICS215_SECTION_LABELS['prepared-by'])
  pushField('Prepared By', form.preparedByName)
  pushField('Position/Title', form.preparedByPositionTitle)
  pushField('Date/Time Prepared', form.preparedDateTime)

  return blocks
}
