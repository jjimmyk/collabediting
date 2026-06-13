export type WorkspaceLocationMethod =
  | ''
  | 'draw-point'
  | 'draw-polygon'
  | 'enter-coordinates'
  | 'enter-address'

export type WorkspaceMetadata = {
  category?: string
  templateId?: string
  relatedEventIds?: number[]
  locationMethod?: WorkspaceLocationMethod
  geometrySummary?: string
  aors?: string[]
  address?: string
  location?: [number, number]
}

export type WorkspaceNameLocationDraft = {
  name: string
  category: string
  relatedEventIds: number[]
  workflow: string
  incidentComplexity: string
  templateId: string
  startTime: string
  locationMethod: WorkspaceLocationMethod
  geometrySummary: string
  latitude: string
  longitude: string
  address: string
  aors: string[]
  summary: string
}

export type WorkspaceSettingsTarget = {
  id: number
  workspaceId?: string
  kind: 'incident' | 'exercise'
}
