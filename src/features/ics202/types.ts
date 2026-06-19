import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics202ObjectiveKind = 'O' | 'M' | 'O&M' | ''

export type Ics202ObjectiveRow = {
  id: number
  kind: Ics202ObjectiveKind
  objective: string
}

export type Ics202CommunityLifelineId =
  | 'safety-security'
  | 'transportation'
  | 'hazardous-materials'
  | 'health-medical'
  | 'energy'
  | 'communications'
  | 'food-hydration-shelter'
  | 'water-systems'

export type Ics202CommunityLifelines = Record<Ics202CommunityLifelineId, boolean>

export type Ics202FormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  incidentName: string
  incidentLocation: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  communityLifelines: Ics202CommunityLifelines
  incidentPriorities: string
  objectives: Ics202ObjectiveRow[]
  commandEmphasis: string
  siteSafetyPlanRequired: boolean
  siteSafetyPlanLocation: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedDateTime: string
  criticalInformationRequirements: string
  limitationsAndConstraints: string
  keyDecisionsAndProcedures: string
}

export type Ics202Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics202FormState
  signatures: Ics201VersionSignature[]
}

export type Ics202DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics202FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics202VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics202FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics202DocumentBundle = {
  document: Ics202DocumentRow
  versions: Ics202Version[]
}

export type Ics202SectionId =
  | 'incident-info'
  | 'community-lifelines'
  | 'incident-priorities'
  | 'objectives'
  | 'command-emphasis'
  | 'site-safety-plan'
  | 'prepared-by'
  | 'critical-information-requirements'
  | 'limitations-constraints'
  | 'key-decisions-procedures'

export type Ics202IncidentInfoDraft = Pick<
  Ics202FormState,
  'incidentName' | 'incidentLocation' | 'operationalPeriodFrom' | 'operationalPeriodTo'
>

export type Ics202SiteSafetyPlanDraft = Pick<
  Ics202FormState,
  'siteSafetyPlanRequired' | 'siteSafetyPlanLocation'
>

export type Ics202PreparedByDraft = Pick<
  Ics202FormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedDateTime'
>

export type Ics202FormSectionDrafts = {
  'incident-info'?: Ics202IncidentInfoDraft
  'community-lifelines'?: Ics202CommunityLifelines
  'incident-priorities'?: string
  objectives?: Ics202ObjectiveRow[]
  'command-emphasis'?: string
  'site-safety-plan'?: Ics202SiteSafetyPlanDraft
  'prepared-by'?: Ics202PreparedByDraft
  'critical-information-requirements'?: string
  'limitations-constraints'?: string
  'key-decisions-procedures'?: string
}
