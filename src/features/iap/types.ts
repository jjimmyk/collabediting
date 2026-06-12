import type { Ics201VersionSignature } from '@/features/ics201/types'

export type IapChecklistFormId =
  | 'ics-202'
  | 'ics-203'
  | 'ics-204'
  | 'ics-205'
  | 'ics-206'
  | 'ics-207'
  | 'ics-208'
  | 'map-chart'
  | 'weather'
  | 'other-1'
  | 'other-2'
  | 'other-3'

export type IapFormChecklistItem = {
  id: IapChecklistFormId
  label: string
  included: boolean
  customLabel?: string
}

export type IapIncidentCommanderRow = {
  id: number
  organization: string
  name: string
  signedAt: number | null
}

export type IapFormState = {
  id: string
  incidentName: string
  incidentLocation: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  incidentCommanders: IapIncidentCommanderRow[]
  formsChecklist: IapFormChecklistItem[]
}

export type IapVersion = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: IapFormState
  signatures: Ics201VersionSignature[]
}

export type IapDocumentRow = {
  id: string
  workspace_id: string
  form_data: IapFormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type IapVersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: IapFormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type IapDocumentBundle = {
  document: IapDocumentRow
  versions: IapVersion[]
}

export type IapSectionId = 'cover-sheet' | 'incident-commanders' | 'forms-checklist'

export type IapCoverSheetDraft = Pick<
  IapFormState,
  'incidentName' | 'incidentLocation' | 'operationalPeriodFrom' | 'operationalPeriodTo'
>

export type IapFormSectionDrafts = {
  'cover-sheet'?: IapCoverSheetDraft
  'incident-commanders'?: IapIncidentCommanderRow[]
  'forms-checklist'?: IapFormChecklistItem[]
}
