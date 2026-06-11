import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics205RadioMode = 'A' | 'D' | 'M' | ''

export type Ics205RadioChannelRow = {
  id: number
  zone: string
  group: string
  channelNumber: string
  function: string
  channelNameTalkgroup: string
  assignment: string
  rxFreq: string
  rxNw: string
  rxToneNac: string
  txFreq: string
  txNw: string
  txToneNac: string
  mode: Ics205RadioMode
  remarks: string
}

export type Ics205FormState = {
  /** Document id (uuid in Supabase; local-* offline) */
  id: string
  incidentName: string
  preparedDate: string
  preparedTime: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  radioChannels: Ics205RadioChannelRow[]
  specialInstructions: string
  preparedByName: string
  preparedBySignature: string
  preparedByDateTime: string
}

export type Ics205Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics205FormState
  signatures: Ics201VersionSignature[]
}

export type Ics205DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics205FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics205VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics205FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics205DocumentBundle = {
  document: Ics205DocumentRow
  versions: Ics205Version[]
}

export type Ics205SectionId =
  | 'incident-info'
  | 'basic-radio-channels'
  | 'special-instructions'
  | 'prepared-by'

export type Ics205IncidentInfoDraft = Pick<
  Ics205FormState,
  | 'incidentName'
  | 'preparedDate'
  | 'preparedTime'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics205PreparedByDraft = Pick<
  Ics205FormState,
  'preparedByName' | 'preparedBySignature' | 'preparedByDateTime'
>

export type Ics205FormSectionDrafts = {
  'incident-info'?: Ics205IncidentInfoDraft
  'basic-radio-channels'?: Ics205RadioChannelRow[]
  'special-instructions'?: string
  'prepared-by'?: Ics205PreparedByDraft
}
