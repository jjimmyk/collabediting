import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  cloneIcs215ResourceColumns,
  cloneIcs215WorkAssignmentRows,
} from '@/features/ics215/utils'
import type { Ics204aFormState } from '@/features/ics204a/types'
import type { ResourceListItemData } from '@/features/resources/types'
import type {
  Ics204AssignmentInfoDraft,
  Ics204CommunicationsDraft,
  Ics204FormSectionDrafts,
  Ics204FormState,
  Ics204Ics215ImportSnapshot,
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
  assetKey: `ics204-empty-${id}`,
  areaKey: 'atlantic',
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
  assignedWorkspaceId: null,
  assignedWorkspaceKind: null,
  assignedIncidentName: null,
  assignedExerciseName: null,
  orgChartReportsTo: null,
  orgChartSortOrder: 0,
  ics204DocumentId: null,
  pointOfContactMemberId: null,
})

function cloneEmbeddedIcs204a(value: Ics204aFormState): Ics204aFormState {
  return {
    ...value,
    otherAttachments: { ...value.otherAttachments },
  }
}

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
    assetKey: resource.assetKey,
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
    assetKey: row.assetKey ?? resourceSnapshot?.assetKey ?? null,
    reportingInfoNotes: String(row.reportingInfoNotes ?? row.location ?? ''),
    has204A: Boolean(row.has204A),
    resourceSnapshot,
    ics204a:
      row.has204A && row.ics204a != null ? cloneEmbeddedIcs204a(row.ics204a as Ics204aFormState) : null,
  }
}

export function normalizeIcs204FormState(form: Ics204FormState): Ics204FormState {
  return {
    ...form,
    resourcesAssigned: (form.resourcesAssigned ?? []).map(normalizeIcs204ResourceAssignedRow),
    emergencyCommunications: form.emergencyCommunications ?? '',
    ics215Import: form.ics215Import ? cloneIcs204Ics215ImportSnapshot(form.ics215Import) : undefined,
  }
}

export function cloneIcs204Ics215ImportSnapshot(
  snapshot: Ics204Ics215ImportSnapshot
): Ics204Ics215ImportSnapshot {
  const resourceColumns = cloneIcs215ResourceColumns(snapshot.resourceColumns)
  return {
    assignee: snapshot.assignee,
    resourceColumns,
    workAssignments: cloneIcs215WorkAssignmentRows(snapshot.workAssignments, resourceColumns),
  }
}

export function getIcs204ResourceRowAssetKey(row: Ics204ResourceAssignedRow): string | null {
  return row.assetKey ?? row.resourceSnapshot?.assetKey ?? null
}

export function getIcs204ResourceAssetKeysForForm(
  form: Ics204FormState,
  drafts: Ics204FormSectionDrafts | undefined,
  editingSections: Partial<Record<Ics204SectionId, boolean>> | undefined
): Set<string> {
  const rows =
    editingSections?.['resources-assigned'] && drafts?.['resources-assigned']
      ? drafts['resources-assigned']
      : form.resourcesAssigned

  return new Set(
    rows
      .map(getIcs204ResourceRowAssetKey)
      .filter((assetKey): assetKey is string => Boolean(assetKey))
  )
}

export function filterIcs204AttachableWorkspaceAssets(
  workspaceAssets: ResourceListItemData[],
  excludedAssetKeys: Set<string>
): ResourceListItemData[] {
  return workspaceAssets.filter((asset) => !excludedAssetKeys.has(asset.assetKey))
}

export function cloneIcs204FormState(form: Ics204FormState): Ics204FormState {
  const normalized = normalizeIcs204FormState(form)
  return {
    ...normalized,
    resourcesAssigned: normalized.resourcesAssigned.map((row) => ({
      ...row,
      ics204a: row.ics204a ? cloneEmbeddedIcs204a(row.ics204a) : null,
    })),
    workAssignments: normalized.workAssignments.map((row) => ({
      ...row,
      resourceRequirements: row.resourceRequirements.map((entry) => ({ ...entry })),
    })),
    ics215Import: normalized.ics215Import
      ? cloneIcs204Ics215ImportSnapshot(normalized.ics215Import)
      : undefined,
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
      ics204a:
        normalized.has204A && normalized.ics204a
          ? cloneEmbeddedIcs204a(normalized.ics204a)
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
