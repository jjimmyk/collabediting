import type { Ics201VersionSignature } from '@/features/ics201/types'

export type SitrepActivityRow = {
  id: number
  time: string
  description: string
  status: string
}

export type SitrepResourceRow = {
  id: number
  resource: string
  quantity: string
  status: string
  location: string
}

export type SitrepFormState = {
  reportNumber: string
  preparedDateTime: string
  reportingPeriodStart: string
  reportingPeriodEnd: string
  incidentName: string
  incidentLocation: string
  preparedBy: string
  agency: string
  sectorLno: string
  executiveSummary: string
  readinessAssessment: string
  riskToMission: string
  outstandingRfiRfr: string
  previousCriticalIncidentComms: string
  generalComments: string
  imageryNotes: string
  currentSituationSummary: string
  currentActivities: SitrepActivityRow[]
  resourcesDeployed: SitrepResourceRow[]
  keyIssues: string[]
  nextSteps: string[]
  distribution: string
}

export type SitrepSection =
  | 'executive-summary'
  | 'ongoing-incidents'
  | 'readiness-assessment'
  | 'risk-to-mission'
  | 'outstanding-rfi-rfr'
  | 'previous-critical-incident-comms'
  | 'general-comments'
  | 'imagery'

export type SitrepScopeKind = 'aor' | 'incident' | 'exercise'

export type SitrepViewMode = 'current' | 'historical' | 'drafts' | 'review-queue'

export type SitrepVersionSignature = Ics201VersionSignature

export type SitrepVersion = {
  id: string
  createdAt: number
  creatorCreatedAt: number
  creatorName: string
  creatorColor: string
  creatorRole: string
  authorId?: string | null
  authorName: string
  authorColor: string
  authorRole: string
  snapshot: SitrepFormState
  signatures: SitrepVersionSignature[]
  submittedForReviewTo?: Array<{ name: string; role: string }>
  submittedForReviewAt?: number
  aiGeneratedSections?: SitrepSection[]
  sectionId?: SitrepSection | null
}

export type SitrepDocumentRow = {
  id: string
  workspace_id: string | null
  organization_id: string | null
  fema_aor_id: string | null
  form_data: SitrepFormState
  latest_version_id: string | null
  updated_at: string
  updated_by: string | null
}

export type SitrepVersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  author_role: string
  snapshot: SitrepFormState
  signatures: SitrepVersionSignature[]
  section_id: string | null
  creator_name: string | null
  creator_color: string | null
  creator_role: string | null
  creator_created_at: string | null
  submitted_for_review_to: Array<{ name: string; role: string }> | null
  submitted_for_review_at: string | null
  ai_generated_sections: SitrepSection[] | null
}

export type SitrepScopeRef =
  | {
      kind: 'workspace'
      scopeId: string
      scopeKind: 'incident' | 'exercise'
      workspaceId: string
      label: string
      legacyId: number
    }
  | {
      kind: 'aor'
      scopeId: string
      scopeKind: 'aor'
      organizationId: string
      femaAorId: string
      label: string
    }

export type OngoingIncidentSitrepContent = {
  executiveSummary: string
  readinessAssessment: string
  riskToMission: string
  outstandingRfiRfr: string
  previousCriticalIncidentComms: string
  generalComments: string
  imageryNotes: string
  sources: string[]
}

export type WorkspaceSitrepSource = {
  id: number
  name: string
  type: string
  status: string
  severity: string
  region: string
  lead: string
  summary: string
  resourcesCommitted: string
  startedAt?: string
}
