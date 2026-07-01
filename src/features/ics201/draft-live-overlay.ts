import type { Ics201FormState } from '@/features/ics201/types'
import {
  applyIcs201DraftFieldPatch,
  ICS201_DRAFT_LIVE_STALE_MS,
} from '@/lib/ics201-draft-live-sync'
import type { Ics201SectionEditingFlags } from '@/hooks/useIcs201AllSectionCursors'

export type Ics201DraftLiveOverlayEntry = {
  value: string
  updatedAt: number
}

export type Ics201DraftLiveOverlay = Record<string, Ics201DraftLiveOverlayEntry>

export function createIcs201DraftLiveOverlayRegistry() {
  const entries: Ics201DraftLiveOverlay = {}

  return {
    set(fieldKey: string, value: string, updatedAt = Date.now()) {
      entries[fieldKey] = { value, updatedAt }
    },
    getActive(now = Date.now()): Ics201DraftLiveOverlay {
      const active: Ics201DraftLiveOverlay = {}
      for (const [fieldKey, entry] of Object.entries(entries)) {
        if (now - entry.updatedAt <= ICS201_DRAFT_LIVE_STALE_MS) {
          active[fieldKey] = entry
        } else {
          delete entries[fieldKey]
        }
      }
      return active
    },
    clear() {
      for (const key of Object.keys(entries)) {
        delete entries[key]
      }
    },
  }
}

export function applyIcs201DraftLiveOverlay(
  form: Ics201FormState,
  overlay: Ics201DraftLiveOverlay,
  now = Date.now()
): Ics201FormState {
  let next = form
  for (const [fieldKey, entry] of Object.entries(overlay)) {
    if (now - entry.updatedAt > ICS201_DRAFT_LIVE_STALE_MS) continue
    next = applyIcs201DraftFieldPatch(next, { fieldKey, value: entry.value })
  }
  return next
}

export type Ics201DraftLiveDraftSetters = {
  setReportInfoDraft?: (
    updater: (draft: {
      incidentName: string
      incidentLocation: string
      dateInitiated: string
      timeInitiated: string
      preparedByName: string
      preparedByPositionTitle: string
      preparedBySignature: string
      preparedDateTime: string
    }) => {
      incidentName: string
      incidentLocation: string
      dateInitiated: string
      timeInitiated: string
      preparedByName: string
      preparedByPositionTitle: string
      preparedBySignature: string
      preparedDateTime: string
    }
  ) => void
  setIncidentBriefingDraft?: (
    updater: (draft: {
      incidentName: string
      incidentNumber: string
      preparedDateTime: string
      preparedBy: string
      operationalPeriodStart: string
      operationalPeriodEnd: string
      jurisdiction: string
    }) => {
      incidentName: string
      incidentNumber: string
      preparedDateTime: string
      preparedBy: string
      operationalPeriodStart: string
      operationalPeriodEnd: string
      jurisdiction: string
    }
  ) => void
  setMapSketchDraft?: (
    updater: (
      draft: { longitude: number; latitude: number }[]
    ) => { longitude: number; latitude: number }[]
  ) => void
  setActionsDraft?: (
    updater: (
      draft: Ics201FormState['actions']
    ) => Ics201FormState['actions']
  ) => void
  setOrgChartDraft?: (
    updater: (draft: Ics201FormState['orgChart']) => Ics201FormState['orgChart']
  ) => void
  setResourcesDraft?: (
    updater: (
      draft: Ics201FormState['resources']
    ) => Ics201FormState['resources']
  ) => void
  setSafetyAnalysisDraft?: (
    updater: (
      draft: Ics201FormState['safetyAnalysis']
    ) => Ics201FormState['safetyAnalysis']
  ) => void
}

export function applyIcs201DraftFieldPatchToDrafts(
  patch: { fieldKey: string; value: string },
  editingFlags: Ics201SectionEditingFlags,
  setters: Ics201DraftLiveDraftSetters
): void {
  const { fieldKey, value } = patch

  if (editingFlags.reportInfo && fieldKey.startsWith('reportInfo.')) {
    const field = fieldKey.slice('reportInfo.'.length)
    setters.setReportInfoDraft?.((draft) => {
      if (!(field in draft)) return draft
      return { ...draft, [field]: value }
    })
    return
  }

  if (editingFlags.incidentBriefing && fieldKey.startsWith('incidentBriefing.')) {
    const field = fieldKey.slice('incidentBriefing.'.length)
    setters.setIncidentBriefingDraft?.((draft) => {
      if (!(field in draft)) return draft
      return { ...draft, [field]: value }
    })
    return
  }

  if (editingFlags.orgChart && fieldKey.startsWith('orgChart.')) {
    const field = fieldKey.slice('orgChart.'.length)
    setters.setOrgChartDraft?.((draft) => {
      if (!(field in draft)) return draft
      return { ...draft, [field]: value }
    })
    return
  }

  if (editingFlags.actions && fieldKey.startsWith('actions:')) {
    const rest = fieldKey.slice('actions:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return
    const id = Number(rest.slice(0, dot))
    const field = rest.slice(dot + 1) as 'task' | 'owner' | 'startTime' | 'endTime'
    setters.setActionsDraft?.((draft) =>
      draft.map((action) => (action.id === id ? { ...action, [field]: value } : action))
    )
    return
  }

  if (editingFlags.resources && fieldKey.startsWith('resources:')) {
    const rest = fieldKey.slice('resources:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return
    const id = Number(rest.slice(0, dot))
    const field = rest.slice(dot + 1) as
      | 'category'
      | 'identifier'
      | 'quantity'
      | 'status'
      | 'assignment'
    setters.setResourcesDraft?.((draft) =>
      draft.map((resource) => (resource.id === id ? { ...resource, [field]: value } : resource))
    )
    return
  }

  if (editingFlags.safetyAnalysis && fieldKey.startsWith('safetyAnalysis:')) {
    const rest = fieldKey.slice('safetyAnalysis:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return
    const id = Number(rest.slice(0, dot))
    const field = rest.slice(dot + 1) as 'hazard' | 'mitigation' | 'ppe' | 'medicalPlan'
    setters.setSafetyAnalysisDraft?.((draft) =>
      draft.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
    return
  }

  if (editingFlags.mapSketch && fieldKey.startsWith('mapSketch:')) {
    const rest = fieldKey.slice('mapSketch:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return
    const index = Number(rest.slice(0, dot))
    const axis = rest.slice(dot + 1)
    const parsed = Number(value)
    if (!Number.isFinite(index) || index < 0) return
    setters.setMapSketchDraft?.((draft) => {
      const vertices = draft.map((vertex) => ({ ...vertex }))
      while (vertices.length <= index) {
        vertices.push({ latitude: 0, longitude: 0 })
      }
      if (axis === 'lat') {
        vertices[index] = {
          ...vertices[index],
          latitude: Number.isFinite(parsed) ? parsed : 0,
        }
      } else if (axis === 'lng') {
        vertices[index] = {
          ...vertices[index],
          longitude: Number.isFinite(parsed) ? parsed : 0,
        }
      }
      return vertices
    })
  }
}
