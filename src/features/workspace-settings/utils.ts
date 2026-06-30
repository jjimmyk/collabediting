import {
  DEFAULT_INCIDENT_COMPLEXITY,
  getWorkspaceSequentialWorkflowMetadata,
  normalizeIncidentComplexityForWorkflow,
} from '@/lib/workspace-format'
import {
  INCIDENT_TEMPLATE_OPTIONS,
  INCIDENT_WORKFLOW_OPTIONS,
  EXERCISE_WORKFLOW_OPTIONS,
} from '@/features/workspace-settings/constants'
import type { WorkspaceMetadataRecord } from '@/lib/workspace-types'
import type {
  WorkspaceLocationMethod,
  WorkspaceNameLocationDraft,
} from '@/features/workspace-settings/types'

export type WorkspaceListItem = {
  id: number
  workspaceId?: string
  name: string
  type: string
  category: string
  region: string
  location: [number, number]
  startedAt: string
  lastUpdate: string
  summary: string
  relatedEventIds: number[]
  workspaceFormat?: string
  incidentComplexity?: string
  hasSequentialWorkflow?: boolean
  sequentialWorkflowType?: string | null
  templateId?: string
  locationMethod?: WorkspaceLocationMethod
  geometrySummary?: string
  address?: string
  aors?: string[]
}

const FALLBACK_LOCATION: [number, number] = [-98.5795, 39.8283]

export function asWorkspaceLocationMethod(value?: string): WorkspaceLocationMethod | undefined {
  if (
    value === '' ||
    value === 'draw-point' ||
    value === 'draw-polygon' ||
    value === 'enter-coordinates' ||
    value === 'enter-address' ||
    value === 'select-aor'
  ) {
    return value
  }
  return undefined
}

export function parseCoordsFromGeometrySummary(summary: string): [number, number] | null {
  const coordsMatch = summary.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (!coordsMatch) {
    return null
  }
  const lat = Number.parseFloat(coordsMatch[1])
  const lng = Number.parseFloat(coordsMatch[2])
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null
  }
  return [lng, lat]
}

export function formatTimestampFromDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function datetimeLocalFromStartedAt(startedAt: string): string {
  const match = startedAt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})/)
  if (!match) {
    return ''
  }
  const [, month, day, year, hour, minute] = match
  const paddedMonth = month.padStart(2, '0')
  const paddedDay = day.padStart(2, '0')
  const paddedHour = hour.padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}T${paddedHour}:${minute}`
}

export function inferTemplateIdFromType(type: string): string {
  for (const template of INCIDENT_TEMPLATE_OPTIONS) {
    if (type.includes(template.label)) {
      return template.id
    }
  }
  return ''
}

export function buildWorkspaceTypeFromDraft(draft: WorkspaceNameLocationDraft): string {
  const templateLabel = INCIDENT_TEMPLATE_OPTIONS.find(
    (option) => option.id === draft.templateId
  )?.label
  const typeParts = [
    draft.category.trim().length > 0 ? draft.category : null,
    templateLabel ?? null,
  ].filter((entry): entry is string => Boolean(entry))
  return typeParts.length > 0 ? typeParts.join(' · ') : 'Workspace'
}

export function locationFromDraft(draft: WorkspaceNameLocationDraft): [number, number] {
  if (draft.locationMethod === 'enter-coordinates') {
    const lat = Number.parseFloat(draft.latitude)
    const lng = Number.parseFloat(draft.longitude)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return [lng, lat]
    }
  }

  const fromSummary = parseCoordsFromGeometrySummary(draft.geometrySummary)
  if (fromSummary) {
    return fromSummary
  }

  return FALLBACK_LOCATION
}

export function geometrySummaryFromLocation(
  location: [number, number],
  locationMethod?: WorkspaceLocationMethod,
  existingSummary?: string
): string {
  if (existingSummary?.trim()) {
    return existingSummary
  }
  const [lng, lat] = location
  if (locationMethod === 'draw-polygon') {
    return `Polygon selected near ${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
  return `Point at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export function aorsFromRegion(region: string, storedAors?: string[]): string[] {
  if (storedAors && storedAors.length > 0) {
    return storedAors
  }
  if (!region || region === 'Unassigned AOR') {
    return []
  }
  return region.split(',').map((entry) => entry.trim()).filter(Boolean)
}

export function metadataFromDraft(draft: WorkspaceNameLocationDraft): WorkspaceMetadataRecord {
  return {
    category: draft.category.trim() || undefined,
    templateId: draft.templateId || undefined,
    relatedEventIds: draft.relatedEventIds.length > 0 ? [...draft.relatedEventIds] : undefined,
    locationMethod: draft.locationMethod || undefined,
    geometrySummary: draft.geometrySummary.trim() || undefined,
    aors: draft.aors.length > 0 ? [...draft.aors] : undefined,
    address: draft.address.trim() || undefined,
    location: locationFromDraft(draft),
  }
}

export function metadataToDraftFields(
  metadata: WorkspaceMetadataRecord | null | undefined,
  workspace: WorkspaceListItem
): Partial<WorkspaceNameLocationDraft> {
  const location = metadata?.location ?? workspace.location
  const locationMethod =
    asWorkspaceLocationMethod(metadata?.locationMethod ?? workspace.locationMethod) ??
    (workspace.geometrySummary ? 'draw-point' : 'enter-coordinates')

  return {
    templateId: metadata?.templateId ?? workspace.templateId ?? inferTemplateIdFromType(workspace.type),
    locationMethod,
    geometrySummary:
      metadata?.geometrySummary ??
      workspace.geometrySummary ??
      geometrySummaryFromLocation(location, locationMethod),
    latitude: location[1].toFixed(5),
    longitude: location[0].toFixed(5),
    address: metadata?.address ?? workspace.address ?? '',
    aors: metadata?.aors ?? aorsFromRegion(workspace.region, workspace.aors),
    relatedEventIds: metadata?.relatedEventIds ?? [...workspace.relatedEventIds],
    category: metadata?.category ?? workspace.category,
  }
}

export function workspaceToNameLocationDraft(
  workspace: WorkspaceListItem,
  metadata?: WorkspaceMetadataRecord | null
): WorkspaceNameLocationDraft {
  const metaFields = metadataToDraftFields(metadata, workspace)
  const workflow = workspace.workspaceFormat ?? 'ipieca-ims'
  const incidentComplexity = normalizeIncidentComplexityForWorkflow(
    workflow,
    workspace.incidentComplexity ?? DEFAULT_INCIDENT_COMPLEXITY
  )

  return {
    name: workspace.name,
    category: metaFields.category ?? workspace.category,
    relatedEventIds: metaFields.relatedEventIds ?? [],
    workflow,
    incidentComplexity,
    templateId: metaFields.templateId ?? '',
    startTime: datetimeLocalFromStartedAt(workspace.startedAt),
    locationMethod: metaFields.locationMethod ?? '',
    geometrySummary: metaFields.geometrySummary ?? '',
    latitude: metaFields.latitude ?? '',
    longitude: metaFields.longitude ?? '',
    address: metaFields.address ?? '',
    aors: metaFields.aors ?? [],
    summary: workspace.summary,
  }
}

export function applyNameLocationDraftToWorkspace<T extends WorkspaceListItem>(
  draft: WorkspaceNameLocationDraft,
  workspace: T,
  kind: 'incident' | 'exercise'
): T {
  const nowLabel = new Date().toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const displayName = draft.name.trim() || workspace.name
  const region = draft.aors.length > 0 ? draft.aors.join(', ') : 'Unassigned AOR'
  const location = locationFromDraft(draft)
  const startedAt = formatTimestampFromDatetimeLocal(draft.startTime) || workspace.startedAt
  const workflowMetadata = getWorkspaceSequentialWorkflowMetadata({
    workspaceFormat: draft.workflow,
    incidentComplexity: draft.incidentComplexity,
    kind,
  })
  const meta = metadataFromDraft(draft)

  return {
    ...workspace,
    name: displayName,
    type: buildWorkspaceTypeFromDraft(draft),
    category: draft.category.trim() || workspace.category,
    region,
    location,
    startedAt,
    lastUpdate: nowLabel,
    summary: draft.summary.trim(),
    relatedEventIds: kind === 'incident' ? [...draft.relatedEventIds] : workspace.relatedEventIds,
    workspaceFormat: workflowMetadata.workspaceFormat ?? draft.workflow,
    incidentComplexity:
      workflowMetadata.incidentComplexity ?? draft.incidentComplexity,
    hasSequentialWorkflow: workflowMetadata.hasSequentialWorkflow,
    sequentialWorkflowType: workflowMetadata.sequentialWorkflowType,
    templateId: meta.templateId,
    locationMethod: meta.locationMethod,
    geometrySummary: meta.geometrySummary,
    address: meta.address,
    aors: meta.aors,
  }
}

export function mergeWorkspaceMetadataFromAccessible<T extends WorkspaceListItem>(
  workspace: T,
  metadata: WorkspaceMetadataRecord | null | undefined,
  accessibleFields: {
    name: string
    region: string | null
    summary: string | null
    workspaceFormat: string | null
    incidentComplexity: string | null
    hasSequentialWorkflow: boolean
    sequentialWorkflowType: string | null
  }
): T {
  const metaFields = metadataToDraftFields(metadata, workspace)

  return {
    ...workspace,
    name: accessibleFields.name,
    region: accessibleFields.region ?? workspace.region,
    summary: accessibleFields.summary ?? workspace.summary,
    workspaceFormat: accessibleFields.workspaceFormat ?? workspace.workspaceFormat,
    incidentComplexity: accessibleFields.incidentComplexity ?? workspace.incidentComplexity,
    hasSequentialWorkflow:
      accessibleFields.hasSequentialWorkflow || workspace.hasSequentialWorkflow === true,
    sequentialWorkflowType:
      accessibleFields.sequentialWorkflowType ?? workspace.sequentialWorkflowType ?? null,
    category: metaFields.category ?? workspace.category,
    relatedEventIds: metaFields.relatedEventIds ?? workspace.relatedEventIds,
    templateId: metaFields.templateId,
    locationMethod: asWorkspaceLocationMethod(metaFields.locationMethod),
    geometrySummary: metaFields.geometrySummary,
    address: metaFields.address,
    aors: metaFields.aors,
    location: metadata?.location ?? workspace.location,
    type:
      metaFields.templateId && metaFields.templateId !== workspace.templateId
        ? buildWorkspaceTypeFromDraft({
            ...workspaceToNameLocationDraft(workspace, metadata),
            templateId: metaFields.templateId,
          })
        : workspace.type,
  }
}

export function getWorkflowLabel(workflow: string): string {
  return (
    INCIDENT_WORKFLOW_OPTIONS.find((option) => option.value === workflow)?.label ??
    EXERCISE_WORKFLOW_OPTIONS.find((option) => option.value === workflow)?.label ??
    workflow
  )
}
