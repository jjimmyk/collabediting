import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics204ResourceAssignedRow = {
  id: number
  resourceIdentifier: string
  leader: string
  contact: string
  location: string
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
