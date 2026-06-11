import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics234TacticsRow = {
  id: number
  name: string
}

export type Ics234StrategyRow = {
  id: number
  name: string
  tactics: Ics234TacticsRow[]
}

export type Ics234ObjectiveRow = {
  id: number
  name: string
  strategies: Ics234StrategyRow[]
}

/** @deprecated Legacy flat row shape — migrated to objectives on load */
export type Ics234MatrixRow = {
  id: number
  objectiveLabel: string
  objectiveDesiredOutcome: string
  strategy: string
  tacticsWho: string
  tacticsWhat: string
  tacticsWhere: string
  tacticsWhen: string
}

export type Ics234FormState = {
  id: string
  incidentName: string
  incidentLocation: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  objectives: Ics234ObjectiveRow[]
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedDateTime: string
}

export type Ics234Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics234FormState
  signatures: Ics201VersionSignature[]
}

export type Ics234DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics234FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics234VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics234FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics234DocumentBundle = {
  document: Ics234DocumentRow
  versions: Ics234Version[]
}

export type Ics234SectionId =
  | 'incident-info'
  | 'work-analysis-matrix'
  | 'prepared-by'

export type Ics234IncidentInfoDraft = Pick<
  Ics234FormState,
  'incidentName' | 'incidentLocation' | 'operationalPeriodFrom' | 'operationalPeriodTo'
>

export type Ics234PreparedByDraft = Pick<
  Ics234FormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedDateTime'
>

export type Ics234FormSectionDrafts = {
  'incident-info'?: Ics234IncidentInfoDraft
  'work-analysis-matrix'?: Ics234ObjectiveRow[]
  'prepared-by'?: Ics234PreparedByDraft
}

export type Ics234MatrixItemRef =
  | { kind: 'objective'; objectiveId: number }
  | { kind: 'strategy'; objectiveId: number; strategyId: number }
  | { kind: 'tactic'; objectiveId: number; strategyId: number; tacticId: number }

export type Ics234MatrixItemDraft = {
  kind: Ics234MatrixItemRef['kind']
  name: string
}

export type Ics234MatrixItemEditState = {
  ref: Ics234MatrixItemRef
  draft: Ics234MatrixItemDraft
}
