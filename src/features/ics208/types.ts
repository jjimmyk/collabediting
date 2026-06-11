import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics208YesNo = '' | 'yes' | 'no'

export type Ics208FormState = {
  id: string
  incidentName: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  safetyMessagePlan: string
  siteSafetyPlanRequired: Ics208YesNo
  approvedSiteSafetyPlanLocatedAt: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedByDateTime: string
}

export type Ics208Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics208FormState
  signatures: Ics201VersionSignature[]
}

export type Ics208DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics208FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics208VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics208FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics208DocumentBundle = {
  document: Ics208DocumentRow
  versions: Ics208Version[]
}

export type Ics208SectionId =
  | 'incident-info'
  | 'safety-message-plan'
  | 'site-safety-plan'
  | 'prepared-by'

export type Ics208IncidentInfoDraft = Pick<
  Ics208FormState,
  | 'incidentName'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics208SafetyMessagePlanDraft = Pick<Ics208FormState, 'safetyMessagePlan'>

export type Ics208SiteSafetyPlanDraft = Pick<
  Ics208FormState,
  'siteSafetyPlanRequired' | 'approvedSiteSafetyPlanLocatedAt'
>

export type Ics208PreparedByDraft = Pick<
  Ics208FormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedByDateTime'
>

export type Ics208FormSectionDrafts = {
  'incident-info'?: Ics208IncidentInfoDraft
  'safety-message-plan'?: Ics208SafetyMessagePlanDraft
  'site-safety-plan'?: Ics208SiteSafetyPlanDraft
  'prepared-by'?: Ics208PreparedByDraft
}
