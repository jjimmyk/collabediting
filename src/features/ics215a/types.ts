import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics215aRiskGainLevel = 'L' | 'M' | 'H' | ''

export type Ics215aSafetyAnalysisRow = {
  id: number
  incidentArea: string
  hazardsRisks: string
  mitigations: string
  riskLevel: Ics215aRiskGainLevel
  gainLevel: Ics215aRiskGainLevel
}

export type Ics215aFormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  incidentName: string
  incidentLocation: string
  preparedDate: string
  preparedTime: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  safetyAnalysisRows: Ics215aSafetyAnalysisRow[]
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedDateTime: string
}

export type Ics215aVersion = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics215aFormState
  signatures: Ics201VersionSignature[]
}

export type Ics215aDocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics215aFormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics215aVersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics215aFormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics215aDocumentBundle = {
  document: Ics215aDocumentRow
  versions: Ics215aVersion[]
}

export type Ics215aSectionId =
  | 'incident-info'
  | 'operational-period'
  | 'safety-analysis'
  | 'prepared-by'

export type Ics215aIncidentInfoDraft = Pick<
  Ics215aFormState,
  'incidentName' | 'incidentLocation' | 'preparedDate' | 'preparedTime'
>

export type Ics215aOperationalPeriodDraft = Pick<
  Ics215aFormState,
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics215aPreparedByDraft = Pick<
  Ics215aFormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedDateTime'
>

export type Ics215aFormSectionDrafts = {
  'incident-info'?: Ics215aIncidentInfoDraft
  'operational-period'?: Ics215aOperationalPeriodDraft
  'safety-analysis'?: Ics215aSafetyAnalysisRow[]
  'prepared-by'?: Ics215aPreparedByDraft
}
