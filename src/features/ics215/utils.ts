import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  ICS215_DEFAULT_RESOURCE_COLUMNS,
  ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT,
} from '@/features/ics215/constants'
import type {
  Ics215FormSectionDrafts,
  Ics215FormState,
  Ics215IncidentInfoDraft,
  Ics215PreparedByDraft,
  Ics215ResourceColumn,
  Ics215ResourceLine,
  Ics215ResourceTotalsDraft,
  Ics215ResourceValue,
  Ics215SectionId,
  Ics215Version,
  Ics215VersionRow,
  Ics215WorkAssignmentRow,
  Ics215WorkAssignmentsDraft,
} from '@/features/ics215/types'

type LegacyWorkAssignmentRow = Ics215WorkAssignmentRow & {
  branch?: string
  divisionGroupOther?: string
  workAssignmentInstructions?: string
  resources?: Ics215ResourceLine[]
}

function slugifyColumnLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.length > 0 ? slug : 'resource'
}

function emptyResourceValue(): Ics215ResourceValue {
  return { required: '', have: '', need: '' }
}

export function createEmptyResourceValues(
  columns: Ics215ResourceColumn[]
): Record<string, Ics215ResourceValue> {
  return Object.fromEntries(columns.map((column) => [column.id, emptyResourceValue()]))
}

export function cloneIcs215ResourceColumns(columns: Ics215ResourceColumn[]): Ics215ResourceColumn[] {
  return columns.map((column) => ({ ...column }))
}

export function cloneIcs215WorkAssignmentRows(
  rows: Ics215WorkAssignmentRow[],
  columns: Ics215ResourceColumn[]
): Ics215WorkAssignmentRow[] {
  return rows.map((row) => ({
    ...row,
    resourceValues: {
      ...createEmptyResourceValues(columns),
      ...Object.fromEntries(
        Object.entries(row.resourceValues ?? {}).map(([columnId, value]) => [
          columnId,
          { ...emptyResourceValue(), ...value },
        ])
      ),
    },
  }))
}

export function cloneIcs215FormState(form: Ics215FormState): Ics215FormState {
  const resourceColumns = cloneIcs215ResourceColumns(form.resourceColumns)
  return {
    ...form,
    resourceColumns,
    workAssignments: cloneIcs215WorkAssignmentRows(form.workAssignments, resourceColumns),
  }
}

export function createDefaultIcs215WorkAssignments(
  columns: Ics215ResourceColumn[] = ICS215_DEFAULT_RESOURCE_COLUMNS,
  count = ICS215_DEFAULT_WORK_ASSIGNMENT_COUNT
): Ics215WorkAssignmentRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    assignee: '',
    workAssignment: '',
    resourceValues: createEmptyResourceValues(columns),
    overheadPositions: '',
    specialEquipmentSupplies: '',
    reportingLocation: '',
    requestedArrivalTime: '',
    status: '',
  }))
}

function isLegacyWorkAssignmentRow(row: LegacyWorkAssignmentRow): boolean {
  return (
    Array.isArray(row.resources) ||
    typeof row.branch === 'string' ||
    typeof row.divisionGroupOther === 'string' ||
    typeof row.workAssignmentInstructions === 'string'
  )
}

function findOrCreateColumnForLabel(
  columns: Ics215ResourceColumn[],
  label: string
): Ics215ResourceColumn {
  const trimmed = label.trim()
  const existing = columns.find((column) => column.label.toLowerCase() === trimmed.toLowerCase())
  if (existing) return existing

  let baseId = slugifyColumnLabel(trimmed)
  let candidateId = baseId
  let suffix = 2
  while (columns.some((column) => column.id === candidateId)) {
    candidateId = `${baseId}-${suffix}`
    suffix += 1
  }

  const created = { id: candidateId, label: trimmed }
  columns.push(created)
  return created
}

function migrateLegacyWorkAssignmentRow(
  row: LegacyWorkAssignmentRow,
  index: number,
  columns: Ics215ResourceColumn[]
): Ics215WorkAssignmentRow {
  const resourceValues = createEmptyResourceValues(columns)

  for (const resource of row.resources ?? []) {
    const label = String(resource.categoryKindType ?? '').trim()
    if (label.length === 0) continue
    const column = findOrCreateColumnForLabel(columns, label)
    resourceValues[column.id] = {
      required: String(resource.required ?? ''),
      have: String(resource.have ?? ''),
      need: String(resource.need ?? ''),
    }
  }

  const assignee =
    String(row.assignee ?? '').trim() ||
    String(row.divisionGroupOther ?? '').trim() ||
    String(row.branch ?? '').trim()

  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    assignee,
    workAssignment: String(row.workAssignment ?? row.workAssignmentInstructions ?? ''),
    resourceValues,
    overheadPositions: String(row.overheadPositions ?? ''),
    specialEquipmentSupplies: String(row.specialEquipmentSupplies ?? ''),
    reportingLocation: String(row.reportingLocation ?? ''),
    requestedArrivalTime: String(row.requestedArrivalTime ?? ''),
    status: String(row.status ?? ''),
  }
}

function normalizeResourceColumn(column: Ics215ResourceColumn, index: number): Ics215ResourceColumn {
  const label = String(column.label ?? '').trim()
  return {
    id: String(column.id ?? `col-${index + 1}`),
    label: label.length > 0 ? label : `Resource ${index + 1}`,
  }
}

function normalizeWorkAssignmentRow(
  row: LegacyWorkAssignmentRow,
  index: number,
  columns: Ics215ResourceColumn[]
): Ics215WorkAssignmentRow {
  if (isLegacyWorkAssignmentRow(row)) {
    return migrateLegacyWorkAssignmentRow(row, index, columns)
  }

  const resourceValues = createEmptyResourceValues(columns)
  for (const column of columns) {
    const value = row.resourceValues?.[column.id]
    resourceValues[column.id] = {
      required: String(value?.required ?? ''),
      have: String(value?.have ?? ''),
      need: String(value?.need ?? ''),
    }
  }

  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    assignee: String(row.assignee ?? ''),
    workAssignment: String(row.workAssignment ?? ''),
    resourceValues,
    overheadPositions: String(row.overheadPositions ?? ''),
    specialEquipmentSupplies: String(row.specialEquipmentSupplies ?? ''),
    reportingLocation: String(row.reportingLocation ?? ''),
    requestedArrivalTime: String(row.requestedArrivalTime ?? ''),
    status: String(row.status ?? ''),
  }
}

function parseNumericTotal(value: string): number {
  const parsed = Number.parseFloat(value.trim())
  return Number.isFinite(parsed) ? parsed : 0
}

export function computeIcs215ResourceTotals(
  resourceColumns: Ics215ResourceColumn[],
  workAssignments: Ics215WorkAssignmentRow[]
): Ics215ResourceTotalsDraft {
  let totalRequired = 0
  let totalHave = 0
  let totalNeed = 0

  for (const row of workAssignments) {
    for (const column of resourceColumns) {
      const value = row.resourceValues?.[column.id]
      if (!value) continue
      totalRequired += parseNumericTotal(value.required)
      totalHave += parseNumericTotal(value.have)
      totalNeed += parseNumericTotal(value.need)
    }
  }

  const formatTotal = (total: number) => (total === 0 ? '' : String(total))

  return {
    totalResourcesRequired: formatTotal(totalRequired),
    totalResourcesHaveOnHand: formatTotal(totalHave),
    totalResourcesNeedToOrder: formatTotal(totalNeed),
  }
}

export function computeIcs215ColumnTotals(
  resourceColumns: Ics215ResourceColumn[],
  workAssignments: Ics215WorkAssignmentRow[]
): Record<string, Ics215ResourceValue> {
  const totals: Record<string, Ics215ResourceValue> = {}

  for (const column of resourceColumns) {
    let required = 0
    let have = 0
    let need = 0

    for (const row of workAssignments) {
      const value = row.resourceValues?.[column.id]
      if (!value) continue
      required += parseNumericTotal(value.required)
      have += parseNumericTotal(value.have)
      need += parseNumericTotal(value.need)
    }

    totals[column.id] = {
      required: required === 0 ? '' : String(required),
      have: have === 0 ? '' : String(have),
      need: need === 0 ? '' : String(need),
    }
  }

  return totals
}

export function normalizeIcs215FormState(form: Ics215FormState): Ics215FormState {
  const resourceColumns =
    (form.resourceColumns ?? []).length > 0
      ? (form.resourceColumns ?? []).map(normalizeResourceColumn)
      : cloneIcs215ResourceColumns(ICS215_DEFAULT_RESOURCE_COLUMNS)

  const rawRows = (form.workAssignments ?? []).length > 0 ? form.workAssignments : []
  const workAssignments =
    rawRows.length > 0
      ? rawRows.map((row, index) =>
          normalizeWorkAssignmentRow(row as LegacyWorkAssignmentRow, index, resourceColumns)
        )
      : createDefaultIcs215WorkAssignments(resourceColumns)

  const syncedTotals = computeIcs215ResourceTotals(resourceColumns, workAssignments)

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    resourceColumns,
    workAssignments,
    ...syncedTotals,
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
  const resourceColumns =
    partial?.resourceColumns && partial.resourceColumns.length > 0
      ? cloneIcs215ResourceColumns(partial.resourceColumns)
      : cloneIcs215ResourceColumns(ICS215_DEFAULT_RESOURCE_COLUMNS)

  return normalizeIcs215FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    resourceColumns,
    workAssignments:
      partial?.workAssignments ??
      createDefaultIcs215WorkAssignments(resourceColumns),
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

export function extractIcs215WorkAssignmentsDraft(form: Ics215FormState): Ics215WorkAssignmentsDraft {
  return {
    resourceColumns: cloneIcs215ResourceColumns(form.resourceColumns),
    workAssignments: cloneIcs215WorkAssignmentRows(form.workAssignments, form.resourceColumns),
  }
}

export function extractIcs215PreparedByDraft(form: Ics215FormState): Ics215PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
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
      return extractIcs215WorkAssignmentsDraft(form)
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
    case 'work-assignments': {
      const workDraft = draft as Ics215WorkAssignmentsDraft
      const resourceColumns = cloneIcs215ResourceColumns(workDraft.resourceColumns)
      const workAssignments = cloneIcs215WorkAssignmentRows(
        workDraft.workAssignments,
        resourceColumns
      )
      const totals = computeIcs215ResourceTotals(resourceColumns, workAssignments)
      return {
        ...form,
        resourceColumns,
        workAssignments,
        ...totals,
      }
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

export function createNextIcs215ResourceColumnId(columns: Ics215ResourceColumn[]): string {
  let next = columns.length + 1
  while (columns.some((column) => column.id === `col-${next}`)) {
    next += 1
  }
  return `col-${next}`
}

export function createNextIcs215WorkAssignmentId(rows: Ics215WorkAssignmentRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

export function appendIcs215ResourceColumn(
  draft: Ics215WorkAssignmentsDraft
): Ics215WorkAssignmentsDraft {
  const nextId = createNextIcs215ResourceColumnId(draft.resourceColumns)
  const resourceColumns = [
    ...draft.resourceColumns,
    { id: nextId, label: `Resource ${draft.resourceColumns.length + 1}` },
  ]
  return {
    resourceColumns,
    workAssignments: draft.workAssignments.map((row) => ({
      ...row,
      resourceValues: {
        ...createEmptyResourceValues(resourceColumns),
        ...row.resourceValues,
      },
    })),
  }
}
