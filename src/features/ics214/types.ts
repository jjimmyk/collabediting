import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics214ActivityLogRow = {
  id: number
  completedBy: string
  completedAt: string
  notableActivities: string
}

export type Ics214FormState = {
  id: string
  incidentName: string
  unitName: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  dateOfActivity: string
  preparedByName: string
  preparedDateTime: string
  entries: Ics214ActivityLogRow[]
}

export type Ics214Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics214FormState
  signatures: Ics201VersionSignature[]
}

export type Ics214DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics214FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics214VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics214FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics214DocumentBundle = {
  document: Ics214DocumentRow
  versions: Ics214Version[]
}

export type Ics214SectionId = 'incident-info' | 'activity-log' | 'prepared-by'

export type Ics214IncidentInfoDraft = Pick<
  Ics214FormState,
  | 'incidentName'
  | 'unitName'
  | 'operationalPeriodFrom'
  | 'operationalPeriodTo'
  | 'dateOfActivity'
>

export type Ics214PreparedByDraft = Pick<Ics214FormState, 'preparedByName' | 'preparedDateTime'>

export type Ics214FormSectionDrafts = {
  'incident-info'?: Ics214IncidentInfoDraft
  'activity-log'?: Ics214ActivityLogRow[]
  'prepared-by'?: Ics214PreparedByDraft
}

export type Ics214ActivityLogFilters = {
  completedBy: string
  completedAt: string
  notableActivitiesSearch: string
}
