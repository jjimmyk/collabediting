import type { Ics201FormState, Ics201SectionId } from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import type { Ics201SectionEditingFlags } from '@/hooks/useIcs201AllSectionCursors'
import { getIcs201SyncTransport } from '@/lib/ics201-sync-transport-supabase'

export type Ics201DraftFieldPatch = {
  userId: string
  sectionId: Ics201SectionId
  fieldKey: string
  value: string
  updatedAt: number
}

export const ICS201_DRAFT_LIVE_THROTTLE_MS = 100
export const ICS201_DRAFT_LIVE_STALE_MS = 5000

export function ics201DraftLiveChannelName(documentId: string) {
  return `ics201-draft-live:${documentId}`
}

export function fieldKeyToSectionId(fieldKey: string): Ics201SectionId | null {
  if (fieldKey.startsWith('reportInfo.')) return 'report-info'
  if (fieldKey.startsWith('incidentBriefing.')) return 'incident-briefing'
  if (fieldKey.startsWith('mapSketch:') || fieldKey === 'map:draw') return 'map-sketch'
  if (fieldKey === 'content') return 'current-situation'
  if (fieldKey.startsWith('objective:')) return 'objectives'
  if (fieldKey.startsWith('actions:')) return 'actions'
  if (fieldKey.startsWith('orgChart.')) return 'org-chart'
  if (fieldKey.startsWith('resources:')) return 'resources'
  if (fieldKey.startsWith('safetyAnalysis:')) return 'safety-analysis'
  return null
}

export function applyIcs201DraftFieldPatch(
  form: Ics201FormState,
  patch: Pick<Ics201DraftFieldPatch, 'fieldKey' | 'value'>
): Ics201FormState {
  const next = cloneIcs201FormState(form)
  const { fieldKey, value } = patch

  if (fieldKey.startsWith('reportInfo.')) {
    const field = fieldKey.slice('reportInfo.'.length)
    if (field === 'incidentName') next.incidentName = value
    else if (field === 'incidentLocation') next.incidentLocation = value
    else if (field === 'dateInitiated') next.dateInitiated = value
    else if (field === 'timeInitiated') next.timeInitiated = value
    else if (field === 'preparedByName') next.preparedByName = value
    else if (field === 'preparedByPositionTitle') next.preparedByPositionTitle = value
    else if (field === 'preparedBySignature') next.preparedBySignature = value
    else if (field === 'preparedDateTime') next.preparedDateTime = value
    return next
  }

  if (fieldKey.startsWith('incidentBriefing.')) {
    const field = fieldKey.slice('incidentBriefing.'.length)
    if (field === 'incidentName') next.incidentName = value
    else if (field === 'incidentNumber') next.incidentNumber = value
    else if (field === 'preparedDateTime') next.preparedDateTime = value
    else if (field === 'preparedBy') next.preparedBy = value
    else if (field === 'operationalPeriodStart') next.operationalPeriodStart = value
    else if (field === 'operationalPeriodEnd') next.operationalPeriodEnd = value
    else if (field === 'jurisdiction') next.jurisdiction = value
    return next
  }

  if (fieldKey.startsWith('orgChart.')) {
    const field = fieldKey.slice('orgChart.'.length)
    if (field.startsWith('commandNames.')) {
      const index = Number(field.slice('commandNames.'.length))
      if (Number.isFinite(index) && index >= 0 && index < 5) {
        const commandNames = [...next.orgChart.commandNames]
        commandNames[index] = value
        next.orgChart = { ...next.orgChart, commandNames }
      }
      return next
    }
    if (field === 'incidentCommander') {
      const commandNames = [...next.orgChart.commandNames]
      commandNames[0] = value
      next.orgChart = { ...next.orgChart, commandNames }
      return next
    }
    if (field in next.orgChart) {
      next.orgChart = { ...next.orgChart, [field]: value }
    }
    return next
  }

  if (fieldKey.startsWith('actions:')) {
    const rest = fieldKey.slice('actions:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return next
    const id = Number(rest.slice(0, dot))
    const field = rest.slice(dot + 1) as 'time' | 'action'
    next.actions = next.actions.map((action) =>
      action.id === id ? { ...action, [field]: value } : action
    )
    return next
  }

  if (fieldKey.startsWith('resources:')) {
    const rest = fieldKey.slice('resources:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return next
    const id = Number(rest.slice(0, dot))
    const field = rest.slice(dot + 1) as
      | 'resource'
      | 'resourceIdentifier'
      | 'dateTimeOrdered'
      | 'eta'
      | 'notes'
    next.resources = next.resources.map((resource) => {
      if (resource.id !== id) return resource
      if (
        resource.assetKey &&
        (field === 'resource' || field === 'resourceIdentifier')
      ) {
        return resource
      }
      return { ...resource, [field]: value }
    })
    return next
  }

  if (fieldKey.startsWith('safetyBox13.')) {
    const field = fieldKey.slice('safetyBox13.'.length)
    if (field === 'safetyOfficer') next.safetyAnalysisBox13.safetyOfficer = value
    else if (field === 'safetyNotes') next.safetyAnalysisBox13.safetyNotes = value
    else if (field === 'ppeNotes') next.safetyAnalysisBox13.ppeNotes = value
    else if (field.startsWith('weather.')) {
      const wField = field.slice('weather.'.length) as keyof typeof next.safetyAnalysisBox13.weather
      if (wField in next.safetyAnalysisBox13.weather) {
        next.safetyAnalysisBox13.weather = { ...next.safetyAnalysisBox13.weather, [wField]: value }
      }
    }
    return next
  }

  if (fieldKey.startsWith('hazmatBox15.')) {
    const field = fieldKey.slice('hazmatBox15.'.length)
    if (field === 'sopAndSafeWorkPractices') next.hazmatAssessmentBox15.sopAndSafeWorkPractices = value
    else if (field === 'decontaminationProcedures') next.hazmatAssessmentBox15.decontaminationProcedures = value
    else if (field === 'emergencyProcedures') next.hazmatAssessmentBox15.emergencyProcedures = value
    return next
  }

  if (fieldKey.startsWith('mapSketch:')) {
    const rest = fieldKey.slice('mapSketch:'.length)
    const dot = rest.indexOf('.')
    if (dot === -1) return next
    const index = Number(rest.slice(0, dot))
    const axis = rest.slice(dot + 1)
    const parsed = Number(value)
    if (!Number.isFinite(index) || index < 0) return next
    const vertices = next.mapSketchPolygon.map((vertex) => ({ ...vertex }))
    while (vertices.length <= index) {
      vertices.push({ latitude: 0, longitude: 0 })
    }
    if (axis === 'lat') {
      vertices[index] = { ...vertices[index], latitude: Number.isFinite(parsed) ? parsed : 0 }
    } else if (axis === 'lng') {
      vertices[index] = { ...vertices[index], longitude: Number.isFinite(parsed) ? parsed : 0 }
    }
    next.mapSketchPolygon = vertices
    return next
  }

  return next
}

export function createIcs201DraftLiveChannel(options: {
  documentId: string
  selfUserId: string
  onRemotePatch: (patch: Ics201DraftFieldPatch) => void
}) {
  const transport = getIcs201SyncTransport()
  if (!transport) {
    return {
      publish: (_fieldKey: string, _value: string) => undefined,
      destroy: () => undefined,
    }
  }

  const channelName = ics201DraftLiveChannelName(options.documentId)
  let lastPublishAt = 0
  let pending: { fieldKey: string; value: string } | null = null
  let publishTimer: number | null = null

  const subscription = transport.subscribeBroadcast(channelName, {
    'field-patch': (_event, payload) => {
      const userId = String(payload.userId ?? '')
      if (!userId || userId === options.selfUserId) return
      const fieldKey = String(payload.fieldKey ?? '')
      const sectionId = fieldKeyToSectionId(fieldKey)
      if (!sectionId) return
      options.onRemotePatch({
        userId,
        sectionId,
        fieldKey,
        value: String(payload.value ?? ''),
        updatedAt: Number(payload.updatedAt ?? Date.now()),
      })
    },
  })

  const flushPublish = () => {
    publishTimer = null
    if (!pending) return
    const patch = pending
    pending = null
    const sectionId = fieldKeyToSectionId(patch.fieldKey)
    if (!sectionId) return
    subscription.send('field-patch', {
      userId: options.selfUserId,
      sectionId,
      fieldKey: patch.fieldKey,
      value: patch.value,
      updatedAt: Date.now(),
    })
  }

  const publish = (fieldKey: string, value: string) => {
    pending = { fieldKey, value }
    const now = Date.now()
    const elapsed = now - lastPublishAt
    if (elapsed >= ICS201_DRAFT_LIVE_THROTTLE_MS) {
      lastPublishAt = now
      flushPublish()
      return
    }
    if (publishTimer === null) {
      publishTimer = window.setTimeout(() => {
        lastPublishAt = Date.now()
        flushPublish()
      }, ICS201_DRAFT_LIVE_THROTTLE_MS - elapsed)
    }
  }

  return {
    publish,
    destroy: () => {
      if (publishTimer !== null) {
        window.clearTimeout(publishTimer)
        publishTimer = null
      }
      pending = null
      subscription.unsubscribe()
    },
  }
}

export function isEditingIcs201Section(
  flags: Ics201SectionEditingFlags,
  sectionId: Ics201SectionId
): boolean {
  const map: Record<Ics201SectionId, keyof Ics201SectionEditingFlags> = {
    'report-info': 'reportInfo',
    'incident-briefing': 'incidentBriefing',
    'map-sketch': 'mapSketch',
    'current-situation': 'currentSituation',
    objectives: 'objectives',
    actions: 'actions',
    'org-chart': 'orgChart',
    resources: 'resources',
    'safety-analysis': 'safetyAnalysis',
    'hazmat-assessment': 'hazmatAssessment',
  }
  return Boolean(flags[map[sectionId]])
}
