import type {
  Ics201ActionRow,
  Ics201FormState,
  Ics201MapSketchVertex,
  Ics201ObjectiveRow,
  Ics201ResourceSummaryRow,
  Ics201SafetyRow,
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
  safetyAnalysisDraft: Ics201SafetyRow[]
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
    form.orgChart = { ...input.orgChartDraft }
  }
  if (input.editingResources) {
    form.resources = input.resourcesDraft.map((resource) => ({ ...resource }))
  }
  if (input.editingSafetyAnalysis) {
    form.safetyAnalysis = input.safetyAnalysisDraft.map((row) => ({ ...row }))
  }

  return form
}
