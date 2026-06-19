import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics204aFormState } from '@/features/ics204a/types'
import type { ResourceListItemData } from '@/features/resources/types'

export type Ics204ResourceSnapshot = ResourceListItemData

export type Ics204ResourceAssignedRow = {
  id: number
  resourceId: number | null
  /** Stable link to hub asset catalog entry. */
  assetKey: string | null
  reportingInfoNotes: string
  has204A: boolean
  resourceSnapshot: Ics204ResourceSnapshot | null
  /** Optional ICS 204A-CG attachment when has204A is true. */
  ics204a?: Ics204aFormState | null
}

export type Ics204ResourceRequirementRow = {
  id: number
  resource: string
  required: string
  have: string
  need: string
}

export type Ics204WorkAssignmentRow = {
  id: number
  assignment: string
  priority: string
  resourceRequirements: Ics204ResourceRequirementRow[]
  overheadPositions: string
  specialEquipmentSupplies: string
  reportingLocation: string
  requestedArrivalTime: string
}

export type Ics204FormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  assignedUnit: string
  branch: string
  division: string
  group: string
  stagingArea: string
  sectionChief: string
  branchDirector: string
  divisionGroupSupervisor: string
  resourcesAssigned: Ics204ResourceAssignedRow[]
  workAssignments: Ics204WorkAssignmentRow[]
  specialInstructions: string
  communications: string
  emergencyCommunications: string
}

export type Ics204Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics204FormState
  signatures: Ics201VersionSignature[]
}

export type Ics204DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics204FormState
  latest_version_id: string | null
  assigned_at: string | null
  assigned_by: string | null
  assigned_unit: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics204VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics204FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics204DocumentBundle = {
  document: Ics204DocumentRow
  versions: Ics204Version[]
}

export type Ics204SectionId =
  | 'assignment-info'
  | 'resources-assigned'
  | 'work-assignments'
  | 'special-instructions'
  | 'communications'

export type Ics204AssignmentInfoDraft = Pick<
  Ics204FormState,
  | 'sectionChief'
  | 'branchDirector'
  | 'divisionGroupSupervisor'
  | 'branch'
  | 'division'
  | 'group'
  | 'stagingArea'
>

export type Ics204CommunicationsDraft = Pick<
  Ics204FormState,
  'communications' | 'emergencyCommunications'
>

export type Ics204FormSectionDrafts = {
  'assignment-info'?: Ics204AssignmentInfoDraft
  'resources-assigned'?: Ics204ResourceAssignedRow[]
  'work-assignments'?: Ics204WorkAssignmentRow[]
  'special-instructions'?: string
  communications?: Ics204CommunicationsDraft
}
