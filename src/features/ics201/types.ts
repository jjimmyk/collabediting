export type Ics201MapSketchVertex = {
  longitude: number
  latitude: number
}

export type Ics201ActionRow = {
  id: number
  task: string
  owner: string
  startTime: string
  endTime: string
  status: string
}

export type Ics201ResourceSummaryRow = {
  id: number
  category: string
  identifier: string
  quantity: string
  status: string
  assignment: string
}

export type Ics201SafetyRow = {
  id: number
  hazard: string
  mitigation: string
  ppe: string
  medicalPlan: string
}

export type Ics201FormState = {
  incidentName: string
  incidentNumber: string
  incidentLocation: string
  dateInitiated: string
  timeInitiated: string
  preparedDateTime: string
  operationalPeriodStart: string
  operationalPeriodEnd: string
  jurisdiction: string
  preparedBy: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  mapSketchPolygon: Ics201MapSketchVertex[]
  currentSituationSummary: string
  weatherForecast: string
  projectedIncidentCourse: string
  objectives: string[]
  actions: Ics201ActionRow[]
  orgChart: {
    incidentCommander: string
    operationsSectionChief: string
    planningSectionChief: string
    logisticsSectionChief: string
    financeSectionChief: string
    publicInformationOfficer: string
    safetyOfficer: string
    liaisonOfficer: string
  }
  resources: Ics201ResourceSummaryRow[]
  safetyAnalysis: Ics201SafetyRow[]
}

export type Ics201SectionId =
  | 'report-info'
  | 'incident-briefing'
  | 'map-sketch'
  | 'current-situation'
  | 'objectives'
  | 'actions'
  | 'org-chart'
  | 'resources'
  | 'safety-analysis'

export type Ics201StructureMode = 'flexible' | 'paginated' | 'strict'

export type Ics201VersionSignature = {
  name: string
  role: string
  signedAt: number
}

export type Ics201Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorEmail?: string | null
  authorColor: string
  snapshot: Ics201FormState
  signatures: Ics201VersionSignature[]
  sectionId?: Ics201SectionId | null
}

export type Ics201CollaboratorPresence = {
  id: string
  email: string
  name: string
  initials: string
  color: string
  position: string
  activeSection: Ics201SectionId | null
  isSelf: boolean
}

export type Ics201DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics201FormState
  structure_mode: Ics201StructureMode
  latest_version_id: string | null
  updated_at: string
  updated_by: string | null
}

export type Ics201VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics201FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}
