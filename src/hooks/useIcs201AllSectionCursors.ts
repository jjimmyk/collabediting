import { useMemo } from 'react'
import type { Ics201SectionId } from '@/features/ics201/types'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { useIcs201CursorSync } from '@/hooks/useIcs201CursorSync'

export type Ics201SectionCursorApi = {
  remoteCursors: Ics201CursorState[]
  publishCursor: (fieldKey: string, anchor: number, head: number) => void
  clearCursor: () => void
}

export type Ics201SectionEditingFlags = {
  reportInfo: boolean
  incidentBriefing: boolean
  mapSketch: boolean
  currentSituation: boolean
  objectives: boolean
  actions: boolean
  orgChart: boolean
  resources: boolean
  safetyAnalysis: boolean
  hazmatAssessment: boolean
}

type UseIcs201AllSectionCursorsOptions = {
  baseEnabled: boolean
  documentId: string | null
  activeTab: string
  editingFlags: Ics201SectionEditingFlags
  selfUserId: string | null
  selfColor: string
  selfInitials: string
}

function sectionEnabled(
  baseEnabled: boolean,
  briefingActive: boolean,
  localEditing: boolean
) {
  return baseEnabled && (localEditing || briefingActive)
}

export function useIcs201AllSectionCursors({
  baseEnabled,
  documentId,
  activeTab,
  editingFlags,
  selfUserId,
  selfColor,
  selfInitials,
}: UseIcs201AllSectionCursorsOptions): Record<Ics201SectionId, Ics201SectionCursorApi> {
  const briefingActive = activeTab === 'briefing'
  const shared = { documentId, selfUserId, selfColor, selfInitials }

  const reportInfo = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.reportInfo),
    sectionId: 'report-info',
  })
  const incidentBriefing = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.incidentBriefing),
    sectionId: 'incident-briefing',
  })
  const mapSketch = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.mapSketch),
    sectionId: 'map-sketch',
  })
  const currentSituation = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.currentSituation),
    sectionId: 'current-situation',
  })
  const objectives = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.objectives),
    sectionId: 'objectives',
  })
  const actions = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.actions),
    sectionId: 'actions',
  })
  const orgChart = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.orgChart),
    sectionId: 'org-chart',
  })
  const resources = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.resources),
    sectionId: 'resources',
  })
  const safetyAnalysis = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.safetyAnalysis),
    sectionId: 'safety-analysis',
  })
  const hazmatAssessment = useIcs201CursorSync({
    ...shared,
    enabled: sectionEnabled(baseEnabled, briefingActive, editingFlags.hazmatAssessment),
    sectionId: 'hazmat-assessment',
  })

  return useMemo(
    () => ({
      'report-info': reportInfo,
      'incident-briefing': incidentBriefing,
      'map-sketch': mapSketch,
      'current-situation': currentSituation,
      objectives,
      actions,
      'org-chart': orgChart,
      resources,
      'safety-analysis': safetyAnalysis,
      'hazmat-assessment': hazmatAssessment,
    }),
    [
      actions,
      currentSituation,
      hazmatAssessment,
      incidentBriefing,
      mapSketch,
      objectives,
      orgChart,
      reportInfo,
      resources,
      safetyAnalysis,
    ]
  )
}
