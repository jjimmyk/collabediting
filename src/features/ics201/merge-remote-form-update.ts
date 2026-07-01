import type {
  Ics201FormState,
  Ics201ObjectiveRow,
} from '@/features/ics201/types'
import { applyIcs201DraftLiveOverlay, type Ics201DraftLiveOverlay } from '@/features/ics201/draft-live-overlay'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import type { Ics201SectionEditingFlags } from '@/hooks/useIcs201AllSectionCursors'

export type Ics201LiveYjsOverrides = {
  currentSituationConnected?: boolean
  currentSituation?: string
  objectivesConnected?: boolean
  objectives?: Ics201ObjectiveRow[]
  draftLiveOverlay?: Ics201DraftLiveOverlay
}

export function mergeRemoteIcs201FormUpdate(
  local: Ics201FormState,
  remote: Ics201FormState,
  editingFlags: Ics201SectionEditingFlags,
  liveYjs: Ics201LiveYjsOverrides = {}
): Ics201FormState {
  const next = cloneIcs201FormState(remote)

  if (editingFlags.reportInfo) {
    next.incidentName = local.incidentName
    next.incidentLocation = local.incidentLocation
    next.dateInitiated = local.dateInitiated
    next.timeInitiated = local.timeInitiated
    next.preparedByName = local.preparedByName
    next.preparedByPositionTitle = local.preparedByPositionTitle
    next.preparedBySignature = local.preparedBySignature
    next.preparedDateTime = local.preparedDateTime
  }

  if (editingFlags.incidentBriefing) {
    next.incidentName = local.incidentName
    next.incidentNumber = local.incidentNumber
    next.preparedDateTime = local.preparedDateTime
    next.preparedBy = local.preparedBy
    next.operationalPeriodStart = local.operationalPeriodStart
    next.operationalPeriodEnd = local.operationalPeriodEnd
    next.jurisdiction = local.jurisdiction
  }

  if (editingFlags.mapSketch) {
    next.mapSketchPolygon = local.mapSketchPolygon.map((vertex) => ({ ...vertex }))
  }

  if (editingFlags.currentSituation) {
    next.currentSituationSummary = local.currentSituationSummary
  } else if (liveYjs.currentSituationConnected && liveYjs.currentSituation !== undefined) {
    next.currentSituationSummary = liveYjs.currentSituation
  }

  if (editingFlags.objectives) {
    next.objectives = local.objectives.map((row) => ({ ...row }))
  } else if (liveYjs.objectivesConnected && liveYjs.objectives !== undefined) {
    next.objectives = liveYjs.objectives.map((row) => ({ ...row }))
  }

  if (editingFlags.actions) {
    next.actions = local.actions.map((action) => ({ ...action }))
  }

  if (editingFlags.orgChart) {
    next.orgChart = { ...local.orgChart }
  }

  if (editingFlags.resources) {
    next.resources = local.resources.map((resource) => ({ ...resource }))
  }

  if (editingFlags.safetyAnalysis) {
    next.safetyAnalysisBox13 = {
      ...local.safetyAnalysisBox13,
      knownHazards: { ...local.safetyAnalysisBox13.knownHazards },
      weather: { ...local.safetyAnalysisBox13.weather },
      requiredPpe: { ...local.safetyAnalysisBox13.requiredPpe },
    }
  }

  if (editingFlags.hazmatAssessment) {
    next.hazmatAssessmentBox15 = {
      ...local.hazmatAssessmentBox15,
      classification: { ...local.hazmatAssessmentBox15.classification },
      products: local.hazmatAssessmentBox15.products.map((row) => ({ ...row })),
      potentialHazards: { ...local.hazmatAssessmentBox15.potentialHazards },
      requiredProcedures: { ...local.hazmatAssessmentBox15.requiredProcedures },
    }
  }

  if (liveYjs.draftLiveOverlay && Object.keys(liveYjs.draftLiveOverlay).length > 0) {
    return applyIcs201DraftLiveOverlay(next, liveYjs.draftLiveOverlay)
  }

  return next
}
