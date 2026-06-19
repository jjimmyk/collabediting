import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics215ResourceValue = {
  required: string
  have: string
  need: string
}

export type Ics215ResourceColumn = {
  id: string
  label: string
}

/** @deprecated Legacy per-row resource line — migrated to resourceValues on load */
export type Ics215ResourceLine = {
  id: number
  categoryKindType: string
  required: string
  have: string
  need: string
}

export type Ics215WorkAssignmentRow = {
  id: number
  assignee: string
  workAssignment: string
  resourceValues: Record<string, Ics215ResourceValue>
  overheadPositions: string
  specialEquipmentSupplies: string
  reportingLocation: string
  requestedArrivalTime: string
  status: string
}

export type Ics215FormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  incidentName: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  resourceColumns: Ics215ResourceColumn[]
  workAssignments: Ics215WorkAssignmentRow[]
  totalResourcesRequired: string
  totalResourcesHaveOnHand: string
  totalResourcesNeedToOrder: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedDateTime: string
}

export type Ics215Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics215FormState
  signatures: Ics201VersionSignature[]
}

export type Ics215DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics215FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics215VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics215FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics215DocumentBundle = {
  document: Ics215DocumentRow
  versions: Ics215Version[]
}

export type Ics215SectionId =
  | 'incident-info'
  | 'work-assignments'
  | 'resource-totals'
  | 'prepared-by'

export type Ics215IncidentInfoDraft = Pick<
  Ics215FormState,
  | 'incidentName'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics215WorkAssignmentsDraft = {
  resourceColumns: Ics215ResourceColumn[]
  workAssignments: Ics215WorkAssignmentRow[]
}

export type Ics215ResourceTotalsDraft = Pick<
  Ics215FormState,
  'totalResourcesRequired' | 'totalResourcesHaveOnHand' | 'totalResourcesNeedToOrder'
>

export type Ics215PreparedByDraft = Pick<
  Ics215FormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedDateTime'
>

export type Ics215FormSectionDrafts = {
  'incident-info'?: Ics215IncidentInfoDraft
  'work-assignments'?: Ics215WorkAssignmentsDraft
  'resource-totals'?: Ics215ResourceTotalsDraft
  'prepared-by'?: Ics215PreparedByDraft
}
