export type Ics201MapSketchVertex = {
  longitude: number
  latitude: number
}

export type Ics201KnownHazardId =
  | 'severeWeather'
  | 'onWaterResponse'
  | 'flooding'
  | 'heat'
  | 'iceWinterConditions'
  | 'debrisInWater'
  | 'oilPetroleum'
  | 'flammableGas'
  | 'radiological'
  | 'poisonToxins'
  | 'bloodBornePathogens'
  | 'biologicalDisease'
  | 'hazardousMaterials'
  | 'explosives'
  | 'humanRemains'
  | 'nuclear'
  | 'fire'
  | 'terrorism'
  | 'civilDisturbance'
  | 'traumaticIncidentStress'
  | 'criminalViolence'
  | 'wildlifeEncounters'

export type Ics201PpeId =
  | 'lifeJackets'
  | 'steelToedBoots'
  | 'hardHat'
  | 'eyeProtection'
  | 'gloves'
  | 'masks'
  | 'hearingProtection'
  | 'protectiveClothing'
  | 'respirators'
  | 'faceShields'
  | 'fallProtectionGear'
  | 'gasDetectors'

export type Ics201HazmatClassificationId =
  | 'oilPetroleumProducts'
  | 'flammableLiquid'
  | 'explosives'
  | 'gases'
  | 'flammableSolid'
  | 'flammableGas'
  | 'oxidizer'
  | 'poisonToxic'
  | 'poisonInhalationHazard'
  | 'radioactive'
  | 'corrosive'
  | 'dangerousWhenWet'
  | 'otherMiscellaneous'

export type Ics201HazmatProcedureId =
  | 'securityPerimeter'
  | 'evacuationProcedures'
  | 'medicalTriage'
  | 'safetyZone'
  | 'warningDangerSigns'
  | 'safetyBriefingsForResponders'

export type Ics201HazmatPotentialHazardId =
  | 'noKnownHazards'
  | 'airPurifyingCriteriaMet'
  | 'scbaRequired'
  | 'levelARequired'

import type { ResourceListItemData } from '@/features/resources/types'

export type Ics201ActionRow = {
  id: number
  time: string
  action: string
}

export type Ics201ResourceSnapshot = ResourceListItemData

export type Ics201ResourceSummaryRow = {
  id: number
  assetKey: string | null
  resourceId: number | null
  resourceSnapshot: Ics201ResourceSnapshot | null
  resource: string
  resourceIdentifier: string
  dateTimeOrdered: string
  eta: string
  onScene: boolean
  notes: string
}

export type Ics201WeatherConditions = {
  temp: string
  conditions: string
  wind: string
  tides: string
  seaState: string
  waterTemp: string
  forecast: string
}

export type Ics201SafetyAnalysisBox13 = {
  safetyOfficer: string
  knownHazards: Record<Ics201KnownHazardId, boolean>
  weather: Ics201WeatherConditions
  safetyNotes: string
  requiredPpe: Record<Ics201PpeId, boolean>
  ppeNotes: string
  involvesHazmat: boolean | null
}

export type Ics201HazmatProductRow = {
  id: number
  material: string
  qty: string
  physState: string
  niosh: string
  specificGravity: string
  ph: string
  idlh: string
  flashPoint: string
  lel: string
  uel: string
}

export type Ics201HazmatAssessmentBox15 = {
  classification: Record<Ics201HazmatClassificationId, boolean>
  products: Ics201HazmatProductRow[]
  potentialHazards: Record<Ics201HazmatPotentialHazardId, boolean>
  requiredProcedures: Record<Ics201HazmatProcedureId, boolean>
  airMonitoringRequired: boolean | null
  sopAndSafeWorkPractices: string
  decontaminationProcedures: string
  medicalMonitoringRequired: boolean | null
  medicalTreatmentTransportInPlace: boolean | null
  emergencyProcedures: string
}

export type Ics201ObjectiveKind = 'O' | 'M' | 'O&M' | ''

export type Ics201ObjectiveRow = {
  id: number
  kind: Ics201ObjectiveKind
  objective: string
}

export type Ics201FormState = {
  schemaVersion: 2
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
  objectives: Ics201ObjectiveRow[]
  actions: Ics201ActionRow[]
  orgChart: {
    commandNames: string[]
    safetyOfficer: string
    liaisonOfficer: string
    publicInformationOfficer: string
    operationsSectionChief: string
    planningSectionChief: string
    logisticsSectionChief: string
    financeSectionChief: string
    intelInvestSectionChief: string
  }
  resources: Ics201ResourceSummaryRow[]
  safetyAnalysisBox13: Ics201SafetyAnalysisBox13
  hazmatAssessmentBox15: Ics201HazmatAssessmentBox15
}

/** @deprecated Legacy row shape — migrated into safetyAnalysisBox13.safetyNotes */
export type Ics201SafetyRow = {
  id: number
  hazard: string
  mitigation: string
  ppe: string
  medicalPlan: string
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
  | 'hazmat-assessment'

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
