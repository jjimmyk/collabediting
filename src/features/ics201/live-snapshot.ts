import type {
  Ics201ActionRow,
  Ics201FormState,
  Ics201HazmatAssessmentBox15,
  Ics201MapSketchVertex,
  Ics201ObjectiveRow,
  Ics201ResourceSummaryRow,
  Ics201SafetyAnalysisBox13,
} from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'

export type Ics201LiveSnapshotInput = {
  form: Ics201FormState
  currentSituationLive?: string
  objectivesLive?: Ics201ObjectiveRow[]
  editingReportInfo: boolean
  reportInfoDraft: {
    incidentName: string
    incidentLocation: string
    dateInitiated: string
    timeInitiated: string
    preparedByName: string
    preparedByPositionTitle: string
    preparedBySignature: string
    preparedDateTime: string
  }
  editingIncidentBriefing: boolean
  incidentBriefingDraft: {
    incidentName: string
    incidentNumber: string
    preparedDateTime: string
    preparedBy: string
    operationalPeriodStart: string
    operationalPeriodEnd: string
    jurisdiction: string
  }
  editingMapSketch: boolean
  mapSketchDraft: Ics201MapSketchVertex[]
  editingActions: boolean
  actionsDraft: Ics201ActionRow[]
  editingOrgChart: boolean
  orgChartDraft: Ics201FormState['orgChart']
  editingResources: boolean
  resourcesDraft: Ics201ResourceSummaryRow[]
  editingSafetyAnalysis: boolean
  safetyAnalysisBox13Draft: Ics201SafetyAnalysisBox13
  editingHazmatAssessment: boolean
  hazmatAssessmentBox15Draft: Ics201HazmatAssessmentBox15
}

function cloneSafetyAnalysisBox13(box: Ics201SafetyAnalysisBox13): Ics201SafetyAnalysisBox13 {
  return {
    ...box,
    knownHazards: { ...box.knownHazards },
    weather: { ...box.weather },
    requiredPpe: { ...box.requiredPpe },
  }
}

function cloneHazmatAssessmentBox15(box: Ics201HazmatAssessmentBox15): Ics201HazmatAssessmentBox15 {
  return {
    ...box,
    classification: { ...box.classification },
    products: box.products.map((row) => ({ ...row })),
    potentialHazards: { ...box.potentialHazards },
    requiredProcedures: { ...box.requiredProcedures },
  }
}

export function buildIcs201LiveFormSnapshot(input: Ics201LiveSnapshotInput): Ics201FormState {
  const form = cloneIcs201FormState(input.form)

  if (input.currentSituationLive !== undefined) {
    form.currentSituationSummary = input.currentSituationLive
  }
  if (input.objectivesLive !== undefined) {
    form.objectives = input.objectivesLive.map((row) => ({ ...row }))
  }
  if (input.editingReportInfo) {
    form.incidentName = input.reportInfoDraft.incidentName
    form.incidentLocation = input.reportInfoDraft.incidentLocation
    form.dateInitiated = input.reportInfoDraft.dateInitiated
    form.timeInitiated = input.reportInfoDraft.timeInitiated
    form.preparedByName = input.reportInfoDraft.preparedByName
    form.preparedByPositionTitle = input.reportInfoDraft.preparedByPositionTitle
    form.preparedBySignature = input.reportInfoDraft.preparedBySignature
    form.preparedDateTime = input.reportInfoDraft.preparedDateTime
  }
  if (input.editingIncidentBriefing) {
    Object.assign(form, input.incidentBriefingDraft)
  }
  if (input.editingMapSketch) {
    form.mapSketchPolygon = input.mapSketchDraft.map((vertex) => ({ ...vertex }))
  }
  if (input.editingActions) {
    form.actions = input.actionsDraft.map((action) => ({ ...action }))
  }
  if (input.editingOrgChart) {
    form.orgChart = {
      ...input.orgChartDraft,
      commandNames: [...input.orgChartDraft.commandNames],
    }
  }
  if (input.editingResources) {
    form.resources = input.resourcesDraft.map((resource) => ({ ...resource }))
  }
  if (input.editingSafetyAnalysis) {
    form.safetyAnalysisBox13 = cloneSafetyAnalysisBox13(input.safetyAnalysisBox13Draft)
  }
  if (input.editingHazmatAssessment) {
    form.hazmatAssessmentBox15 = cloneHazmatAssessmentBox15(input.hazmatAssessmentBox15Draft)
  }

  return form
}
