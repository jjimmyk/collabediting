import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import { ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT } from '@/features/ics215/constants'
import type {
  Ics215FormSectionDrafts,
  Ics215FormState,
  Ics215IncidentInfoDraft,
  Ics215PreparedByDraft,
  Ics215ResourceLine,
  Ics215ResourceTotalsDraft,
  Ics215SectionId,
  Ics215Version,
  Ics215VersionRow,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'

export function cloneIcs215ResourceLines(lines: Ics215ResourceLine[]): Ics215ResourceLine[] {
  return lines.map((line) => ({ ...line }))
}

export function cloneIcs215WorkAssignmentRows(
  rows: Ics215WorkAssignmentRow[]
): Ics215WorkAssignmentRow[] {
  return rows.map((row) => ({
    ...row,
    resources: cloneIcs215ResourceLines(row.resources),
  }))
}

export function cloneIcs215FormState(form: Ics215FormState): Ics215FormState {
  return {
    ...form,
    workAssignments: cloneIcs215WorkAssignmentRows(form.workAssignments),
  }
}

export function createDefaultIcs215WorkAssignments(
  count = ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT
): Ics215WorkAssignmentRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    branch: '',
    divisionGroupOther: '',
    workAssignmentInstructions: '',
    resources: [],
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: '',
    requestedArrivalTime: '',
  }))
}

function normalizeResourceLine(line: Ics215ResourceLine, index: number): Ics215ResourceLine {
  return {
    id: typeof line.id === 'number' ? line.id : index + 1,
    categoryKindType: String(line.categoryKindType ?? ''),
    required: String(line.required ?? ''),
    have: String(line.have ?? ''),
    need: String(line.need ?? ''),
  }
}

function normalizeWorkAssignmentRow(
  row: Ics215WorkAssignmentRow,
  index: number
): Ics215WorkAssignmentRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    branch: String(row.branch ?? ''),
    divisionGroupOther: String(row.divisionGroupOther ?? ''),
    workAssignmentInstructions: String(row.workAssignmentInstructions ?? ''),
    resources: (row.resources ?? []).map(normalizeResourceLine),
    overheadPositions: String(row.overheadPositions ?? ''),
    specialEquipmentSupplies: String(row.specialEquipmentSupplies ?? ''),
    reportingLocation: String(row.reportingLocation ?? ''),
    requestedArrivalTime: String(row.requestedArrivalTime ?? ''),
  }
}

export function normalizeIcs215FormState(form: Ics215FormState): Ics215FormState {
  const workAssignments =
    (form.workAssignments ?? []).length > 0
      ? form.workAssignments.map(normalizeWorkAssignmentRow)
      : createDefaultIcs215WorkAssignments()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    workAssignments,
    totalResourcesRequired: String(form.totalResourcesRequired ?? ''),
    totalResourcesHaveOnHand: String(form.totalResourcesHaveOnHand ?? ''),
    totalResourcesNeedToOrder: String(form.totalResourcesNeedToOrder ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedDateTime: String(form.preparedDateTime ?? ''),
  }
}

export function mapIcs215VersionRow(row: Ics215VersionRow): Ics215Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs215FormState(normalizeIcs215FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs215Form(
  id: string,
  partial?: Partial<Ics215FormState>
): Ics215FormState {
  return normalizeIcs215FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    workAssignments: partial?.workAssignments ?? createDefaultIcs215WorkAssignments(),
    totalResourcesRequired: partial?.totalResourcesRequired ?? '',
    totalResourcesHaveOnHand: partial?.totalResourcesHaveOnHand ?? '',
    totalResourcesNeedToOrder: partial?.totalResourcesNeedToOrder ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
  })
}

export function createLocalIcs215DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics215AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics215FormState): Ics215FormState {
  return cloneIcs215FormState({ ...normalizeIcs215FormState(form), id: documentId })
}

export function extractIcs215IncidentInfoDraft(form: Ics215FormState): Ics215IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs215ResourceTotalsDraft(form: Ics215FormState): Ics215ResourceTotalsDraft {
  return {
    totalResourcesRequired: form.totalResourcesRequired,
    totalResourcesHaveOnHand: form.totalResourcesHaveOnHand,
    totalResourcesNeedToOrder: form.totalResourcesNeedToOrder,
  }
}

export function extractIcs215PreparedByDraft(form: Ics215FormState): Ics215PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
    preparedBySignature: form.preparedBySignature,
    preparedDateTime: form.preparedDateTime,
  }
}

export function extractIcs215SectionDraft(
  form: Ics215FormState,
  section: Ics215SectionId
): Ics215FormSectionDrafts[Ics215SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs215IncidentInfoDraft(form)
    case 'work-assignments':
      return cloneIcs215WorkAssignmentRows(form.workAssignments)
    case 'resource-totals':
      return extractIcs215ResourceTotalsDraft(form)
    case 'prepared-by':
      return extractIcs215PreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs215SectionDraft(
  form: Ics215FormState,
  section: Ics215SectionId,
  draft: Ics215FormSectionDrafts[Ics215SectionId]
): Ics215FormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics215IncidentInfoDraft),
      }
    case 'work-assignments':
      return {
        ...form,
        workAssignments: cloneIcs215WorkAssignmentRows(draft as Ics215WorkAssignmentRow[]),
      }
    case 'resource-totals':
      return {
        ...form,
        ...(draft as Ics215ResourceTotalsDraft),
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics215PreparedByDraft),
      }
    default:
      return form
  }
}

export function getIcs215FormForExport(
  form: Ics215FormState,
  sectionDrafts: Ics215FormSectionDrafts
): Ics215FormState {
  let exportForm = cloneIcs215FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics215SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs215SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
