import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type { ResourceListItemData } from '@/features/resources/types'
import type {
  Ics204AssignmentInfoDraft,
  Ics204CommunicationsDraft,
  Ics204FormSectionDrafts,
  Ics204FormState,
  Ics204ResourceAssignedRow,
  Ics204ResourceSnapshot,
  Ics204SectionId,
  Ics204Version,
  Ics204VersionRow,
  Ics204WorkAssignmentRow,
} from '@/features/ics204/types'

type LegacyIcs204ResourceAssignedRow = Partial<Ics204ResourceAssignedRow> & {
  resourceIdentifier?: string
  leader?: string
  numberOfPersons?: string
  contactInfo?: string
  contact?: string
  location?: string
  reportingInfoNotes?: string
}

const EMPTY_RESOURCE_SNAPSHOT = (id: number, name: string): Ics204ResourceSnapshot => ({
  id,
  name,
  assetStatus: 'FMC',
  assetStatusUpdatedAt: '',
  owner: '',
  status: 'Assigned',
  type: '',
  teamLead: '',
  eta: '',
  location: '',
  notes: '',
  mapLocation: [0, 0],
  currentLocation: '',
  datetimeOrdered: '',
  opcon: '',
  tacon: '',
  pointOfContact: '',
  owningOrganization: '',
  quantity: 0,
  unitType: '',
  unitName: '',
  hullTailNumber: '',
  symbology: '',
  latitude: '',
  longitude: '',
  capabilities: '',
  currentOpPeriod: '',
  nextOpPeriod: '',
  currentOpPeriodAssignment: '',
  nextOpPeriodAssignment: '',
  checkInStatus: '',
  costUnitType: 'per day',
  costPerUnit: 0,
  deploymentKind: 'incident',
  assignedIncidentName: null,
  assignedExerciseName: null,
})

export function snapshotFromResourceListItem(resource: ResourceListItemData): Ics204ResourceSnapshot {
  return { ...resource, mapLocation: [...resource.mapLocation] as [number, number] }
}

export function createIcs204ResourceAssignedRow(
  rowId: number,
  resource: ResourceListItemData,
  reportingInfoNotes: string,
  has204A: boolean
): Ics204ResourceAssignedRow {
  return {
    id: rowId,
    resourceId: resource.id,
    reportingInfoNotes,
    has204A,
    resourceSnapshot: snapshotFromResourceListItem(resource),
  }
}

export function buildDemoIcs204ResourceSnapshot(input: {
  id: number
  name: string
  teamLead?: string
  quantity?: number
  pointOfContact?: string
  currentLocation?: string
  notes?: string
}): Ics204ResourceSnapshot {
  const snapshot = EMPTY_RESOURCE_SNAPSHOT(input.id, input.name)
  snapshot.teamLead = input.teamLead ?? ''
  snapshot.pointOfContact = input.pointOfContact ?? ''
  snapshot.quantity = input.quantity ?? 0
  snapshot.currentLocation = input.currentLocation ?? ''
  snapshot.notes = input.notes ?? ''
  return snapshot
}

function legacyResourceSnapshotFromRow(row: LegacyIcs204ResourceAssignedRow): Ics204ResourceSnapshot {
  const rowId = typeof row.id === 'number' ? row.id : 0
  const snapshot = EMPTY_RESOURCE_SNAPSHOT(
    row.resourceId ?? rowId,
    String(row.resourceIdentifier ?? 'Unknown resource')
  )
  snapshot.teamLead = String(row.leader ?? '')
  snapshot.pointOfContact = String(row.contactInfo ?? row.contact ?? '')
  snapshot.quantity = Number.parseInt(String(row.numberOfPersons ?? ''), 10) || 0
  snapshot.notes = String(row.reportingInfoNotes ?? row.location ?? '')
  snapshot.currentLocation = String(row.location ?? '')
  return snapshot
}

export function resolveIcs204ResourceSnapshot(row: Ics204ResourceAssignedRow): Ics204ResourceSnapshot {
  if (row.resourceSnapshot) {
    return {
      ...row.resourceSnapshot,
      mapLocation: [...row.resourceSnapshot.mapLocation] as [number, number],
    }
  }
  return legacyResourceSnapshotFromRow(row)
}

export function normalizeIcs204ResourceAssignedRow(
  row: LegacyIcs204ResourceAssignedRow
): Ics204ResourceAssignedRow {
  const resourceSnapshot =
    row.resourceSnapshot != null
      ? snapshotFromResourceListItem(row.resourceSnapshot)
      : row.resourceIdentifier || row.leader || row.contactInfo || row.contact
        ? legacyResourceSnapshotFromRow(row)
        : null

  return {
    id: typeof row.id === 'number' ? row.id : 0,
    resourceId: row.resourceId ?? resourceSnapshot?.id ?? null,
    reportingInfoNotes: String(row.reportingInfoNotes ?? row.location ?? ''),
    has204A: Boolean(row.has204A),
    resourceSnapshot,
  }
}

export function normalizeIcs204FormState(form: Ics204FormState): Ics204FormState {
  return {
    ...form,
    resourcesAssigned: (form.resourcesAssigned ?? []).map(normalizeIcs204ResourceAssignedRow),
    emergencyCommunications: form.emergencyCommunications ?? '',
  }
}

export function cloneIcs204FormState(form: Ics204FormState): Ics204FormState {
  const normalized = normalizeIcs204FormState(form)
  return {
    ...normalized,
    resourcesAssigned: normalized.resourcesAssigned.map((row) => ({ ...row })),
    workAssignments: normalized.workAssignments.map((row) => ({
      ...row,
      resourceRequirements: row.resourceRequirements.map((entry) => ({ ...entry })),
    })),
  }
}

export function mapIcs204VersionRow(row: Ics204VersionRow): Ics204Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs204FormState(row.snapshot),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs204Form(id: string, label?: string): Ics204FormState {
  return {
    id,
    assignedUnit: label ?? '',
    branch: '',
    division: '',
    group: '',
    stagingArea: '',
    sectionChief: '',
    branchDirector: '',
    divisionGroupSupervisor: '',
    resourcesAssigned: [],
    workAssignments: [],
    specialInstructions: '',
    communications: '',
    emergencyCommunications: '',
  }
}

export function createLocalIcs204DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics204AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics204FormState): Ics204FormState {
  return cloneIcs204FormState({ ...form, id: documentId })
}

export function extractIcs204CommunicationsDraft(form: Ics204FormState): Ics204CommunicationsDraft {
  return {
    communications: form.communications,
    emergencyCommunications: form.emergencyCommunications,
  }
}

export function extractIcs204AssignmentInfoDraft(form: Ics204FormState): Ics204AssignmentInfoDraft {
  return {
    sectionChief: form.sectionChief,
    branchDirector: form.branchDirector,
    divisionGroupSupervisor: form.divisionGroupSupervisor,
    branch: form.branch,
    division: form.division,
    group: form.group,
    stagingArea: form.stagingArea,
  }
}

export function cloneIcs204ResourceAssignedRows(
  rows: Ics204ResourceAssignedRow[]
): Ics204ResourceAssignedRow[] {
  return rows.map((row) => {
    const normalized = normalizeIcs204ResourceAssignedRow(row)
    return {
      ...normalized,
      resourceSnapshot: normalized.resourceSnapshot
        ? snapshotFromResourceListItem(normalized.resourceSnapshot)
        : null,
    }
  })
}

export function cloneIcs204WorkAssignmentRows(
  rows: Ics204WorkAssignmentRow[]
): Ics204WorkAssignmentRow[] {
  return rows.map((row) => ({
    ...row,
    resourceRequirements: row.resourceRequirements.map((entry) => ({ ...entry })),
  }))
}

export function extractIcs204SectionDraft(
  form: Ics204FormState,
  section: Ics204SectionId
): Ics204FormSectionDrafts[Ics204SectionId] {
  switch (section) {
    case 'assignment-info':
      return extractIcs204AssignmentInfoDraft(form)
    case 'resources-assigned':
      return cloneIcs204ResourceAssignedRows(form.resourcesAssigned)
    case 'work-assignments':
      return cloneIcs204WorkAssignmentRows(form.workAssignments)
    case 'special-instructions':
      return form.specialInstructions
    case 'communications':
      return extractIcs204CommunicationsDraft(form)
    default:
      return undefined
  }
}

export function applyIcs204SectionDraft(
  form: Ics204FormState,
  section: Ics204SectionId,
  draft: Ics204FormSectionDrafts[Ics204SectionId]
): Ics204FormState {
  switch (section) {
    case 'assignment-info':
      return {
        ...form,
        ...(draft as Ics204AssignmentInfoDraft),
      }
    case 'resources-assigned':
      return {
        ...form,
        resourcesAssigned: cloneIcs204ResourceAssignedRows(
          draft as Ics204ResourceAssignedRow[]
        ),
      }
    case 'work-assignments':
      return {
        ...form,
        workAssignments: cloneIcs204WorkAssignmentRows(draft as Ics204WorkAssignmentRow[]),
      }
    case 'special-instructions':
      return {
        ...form,
        specialInstructions: draft as string,
      }
    case 'communications':
      return {
        ...form,
        ...(draft as Ics204CommunicationsDraft),
      }
    default:
      return form
  }
}

export function resolveIcs204AssignedUnitLabel(form: Ics204FormState): string {
  return form.assignedUnit.trim()
}

export function resolveIcs204ListTitle(form: Ics204FormState): string {
  const assignedUnit = resolveIcs204AssignedUnitLabel(form)
  return assignedUnit.length > 0 ? assignedUnit : `ICS-204 #${form.id.slice(0, 8)}`
}

export function getIcs204FormForExport(
  formId: string,
  forms: Ics204FormState[],
  sectionDraftsByFormId: Record<string, Ics204FormSectionDrafts>
): Ics204FormState | null {
  const form = forms.find((entry) => entry.id === formId)
  if (!form) return null
  let exportForm = cloneIcs204FormState(form)
  const drafts = sectionDraftsByFormId[formId]
  if (!drafts) return exportForm
  for (const section of Object.keys(drafts) as Ics204SectionId[]) {
    const draft = drafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs204SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
