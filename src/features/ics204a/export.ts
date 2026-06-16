import type { Ics204ResourceAssignedRow } from '@/features/ics204/types'
import { resolveIcs204ResourceSnapshot } from '@/features/ics204/utils'
import { ICS204A_FIELD_LABELS } from '@/features/ics204a/constants'
import type { Ics204aFormState } from '@/features/ics204a/types'

export type Ics204aDocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

export type Ics204aDocxHeaderFooterCell = {
  label: string
  value?: string
}

export type Ics204aDocxOptions = {
  header?: {
    cells: Ics204aDocxHeaderFooterCell[]
    topLines?: string[]
  }
  footer?: {
    cells: Ics204aDocxHeaderFooterCell[]
    topLines?: string[]
  }
}

export type Ics204aExportContext = {
  incidentName?: string
  parentAssignedUnit?: string
}

function formatOperationalPeriod(form: Ics204aFormState): string {
  const from = [form.operationalPeriodFrom].filter((part) => part.trim().length > 0).join(' ')
  const to = [form.operationalPeriodTo].filter((part) => part.trim().length > 0).join(' ')
  if (from.length === 0 && to.length === 0) return ''
  if (from.length > 0 && to.length > 0) return `${from} – ${to}`
  return from || to
}

export function ics204aExportFilenameBase(
  row: Ics204ResourceAssignedRow,
  parentAssignedUnit?: string
): string {
  const resource = resolveIcs204ResourceSnapshot(row)
  const resourcePart = resource.name.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'resource'
  const unitPart = (parentAssignedUnit ?? '').trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return unitPart.length > 0 ? `ICS-204A_${unitPart}_${resourcePart}` : `ICS-204A_${resourcePart}`
}

export function buildIcs204aExportOptions(
  form: Ics204aFormState,
  context: Ics204aExportContext = {}
): Ics204aDocxOptions {
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'U.S. COAST GUARD',
        'ASSIGNMENT LIST ATTACHMENT (ICS 204A-CG)',
      ],
      cells: [
        { label: `${ICS204A_FIELD_LABELS.incidentName}:`, value: form.incidentName || context.incidentName || '' },
        { label: `${ICS204A_FIELD_LABELS.incidentLocation}:`, value: form.incidentLocation },
        { label: `${ICS204A_FIELD_LABELS.operationalPeriod}:`, value: formatOperationalPeriod(form) },
      ],
    },
    footer: {
      topLines: ['ICS 204A-CG (07/23)'],
      cells: [
        { label: `${ICS204A_FIELD_LABELS.preparedBy}:`, value: form.preparedByName },
        { label: `${ICS204A_FIELD_LABELS.dateTime}:`, value: form.preparedByDateTime },
      ],
    },
  }
}

export function buildIcs204aDocxBlocks(
  form: Ics204aFormState,
  context: Ics204aExportContext = {}
): Ics204aDocxBlock[] {
  const blocks: Ics204aDocxBlock[] = []
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

  blocks.push({ kind: 'title', text: 'Assignment List Attachment (ICS 204A-CG)' })
  const subtitleParts = [
    context.parentAssignedUnit?.trim(),
    form.resourceIdentifier.trim() || context.incidentName?.trim(),
  ].filter((part): part is string => Boolean(part && part.length > 0))
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }

  pushHeading('Incident & Operational Period')
  pushField(ICS204A_FIELD_LABELS.incidentName, form.incidentName || context.incidentName)
  pushField(ICS204A_FIELD_LABELS.incidentLocation, form.incidentLocation)
  pushField(ICS204A_FIELD_LABELS.operationalPeriodFrom, form.operationalPeriodFrom)
  pushField(ICS204A_FIELD_LABELS.operationalPeriodTo, form.operationalPeriodTo)

  pushHeading('Assignment Structure')
  pushField(ICS204A_FIELD_LABELS.branch, form.branch)
  pushField(ICS204A_FIELD_LABELS.divisionGroup, form.divisionGroup)
  pushField(ICS204A_FIELD_LABELS.resourceIdentifier, form.resourceIdentifier)
  pushField(ICS204A_FIELD_LABELS.leader, form.leader)
  pushField(ICS204A_FIELD_LABELS.assignmentLocation, form.assignmentLocation)

  pushHeading('Work Assignment')
  pushField(ICS204A_FIELD_LABELS.workAssignmentSpecialInstructions, form.workAssignmentSpecialInstructions)
  pushField(ICS204A_FIELD_LABELS.siteSafetyPlanLocation, form.siteSafetyPlanLocation)

  pushHeading(ICS204A_FIELD_LABELS.otherAttachments)
  pushField(ICS204A_FIELD_LABELS.mapChart, form.otherAttachments.mapChart)
  pushField(ICS204A_FIELD_LABELS.weatherForecast, form.otherAttachments.weatherForecast)
  pushField(ICS204A_FIELD_LABELS.tidesCurrents, form.otherAttachments.tidesCurrents)
  pushField(ICS204A_FIELD_LABELS.otherAttachmentNotes, form.otherAttachments.notes)

  pushHeading('Review & Approval')
  pushField(ICS204A_FIELD_LABELS.preparedBy, form.preparedByName)
  pushField(`${ICS204A_FIELD_LABELS.preparedBy} ${ICS204A_FIELD_LABELS.dateTime}`, form.preparedByDateTime)
  pushField(ICS204A_FIELD_LABELS.reviewedByPsc, form.reviewedByPscName)
  pushField(`${ICS204A_FIELD_LABELS.reviewedByPsc} ${ICS204A_FIELD_LABELS.dateTime}`, form.reviewedByPscDateTime)
  pushField(ICS204A_FIELD_LABELS.reviewedByOscIsc, form.reviewedByOscIscName)
  pushField(`${ICS204A_FIELD_LABELS.reviewedByOscIsc} ${ICS204A_FIELD_LABELS.dateTime}`, form.reviewedByOscIscDateTime)

  return blocks
}
