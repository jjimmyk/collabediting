import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics205aContactRow = {
  id: number
  /** Encoded roster target: position | single_resource | org_chart_asset */
  assignedPosition: string
  /** Encoded name target: member | position_asset | single_resource | org_chart_asset | resource_category | custom */
  name: string
  cellPhone: string
  radioFrequency: string
  other: string
}

export type Ics205aFormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  incidentName: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  contactRows: Ics205aContactRow[]
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedByDateTime: string
}

export type Ics205aVersion = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics205aFormState
  signatures: Ics201VersionSignature[]
}

export type Ics205aDocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics205aFormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics205aVersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics205aFormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics205aDocumentBundle = {
  document: Ics205aDocumentRow
  versions: Ics205aVersion[]
}

export type Ics205aSectionId =
  | 'incident-info'
  | 'local-communications-info'
  | 'prepared-by'

export type Ics205aIncidentInfoDraft = Pick<
  Ics205aFormState,
  | 'incidentName'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics205aPreparedByDraft = Pick<
  Ics205aFormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedByDateTime'
>

export type Ics205aFormSectionDrafts = {
  'incident-info'?: Ics205aIncidentInfoDraft
  'local-communications-info'?: Ics205aContactRow[]
  'prepared-by'?: Ics205aPreparedByDraft
}
