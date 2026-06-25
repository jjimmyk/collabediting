import { findAccessibleWorkspaceUuid } from '@/lib/workspace-service'
import type { AccessibleWorkspace } from '@/lib/workspace-types'
import {
  SITREP_SECTIONS_AOR,
  SITREP_SECTIONS_WORKSPACE,
  createInitialSitrepForm,
} from './constants'
import type {
  OngoingIncidentSitrepContent,
  SitrepFormState,
  SitrepScopeKind,
  SitrepScopeRef,
  SitrepSection,
  SitrepVersion,
  SitrepVersionRow,
  SitrepVersionSignature,
  WorkspaceSitrepSource,
} from './types'

const AUTHOR_COLORS = [
  '#16a34a',
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export function cloneSitrepFormState(form: SitrepFormState): SitrepFormState {
  return {
    ...form,
    currentActivities: form.currentActivities.map((row) => ({ ...row })),
    resourcesDeployed: form.resourcesDeployed.map((row) => ({ ...row })),
    keyIssues: [...form.keyIssues],
    nextSteps: [...form.nextSteps],
  }
}

export function sitrepAuthorColorFromId(userId: string): string {
  let hash = 0
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index)
    hash |= 0
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length]
}

export function getSitrepSectionsForScope(
  kind: SitrepScopeKind | undefined
): { id: SitrepSection; label: string }[] {
  if (kind === 'incident' || kind === 'exercise') {
    return SITREP_SECTIONS_WORKSPACE
  }
  return SITREP_SECTIONS_AOR
}

export function isSitrepSectionAllowedForScope(
  section: SitrepSection,
  kind: SitrepScopeKind | undefined
): boolean {
  if (section === 'ongoing-incidents') {
    return kind === 'aor' || kind === undefined
  }
  return true
}

export function resolveDefaultSitrepActiveSection(
  kind: SitrepScopeKind | undefined,
  current: SitrepSection
): SitrepSection {
  if (!isSitrepSectionAllowedForScope(current, kind)) {
    return 'executive-summary'
  }
  return current
}

type SitrepScopeOptionInput = {
  id: string
  kind: SitrepScopeKind
  label: string
  workspace?: { id: number }
}

export function resolveSitrepScopeRef(
  scopeId: string,
  options: {
    accessibleWorkspaces: AccessibleWorkspace[]
    organizationId: string | null
    scopeOptions: SitrepScopeOptionInput[]
  }
): SitrepScopeRef | null {
  const scope = options.scopeOptions.find((entry) => entry.id === scopeId)
  if (!scope) {
    return null
  }

  if (scope.kind === 'aor') {
    const femaAorId = scopeId.replace(/^aor-fema-/, '')
    if (!options.organizationId || !femaAorId) {
      return null
    }
    return {
      kind: 'aor',
      scopeId,
      scopeKind: 'aor',
      organizationId: options.organizationId,
      femaAorId,
      label: scope.label,
    }
  }

  const legacyMatch = scopeId.match(/^(incident|exercise)-(\d+)$/)
  if (!legacyMatch || !scope.workspace) {
    return null
  }

  const scopeKind = legacyMatch[1] === 'exercise' ? 'exercise' : 'incident'
  const legacyId = Number.parseInt(legacyMatch[2] ?? '', 10)
  const workspaceId = findAccessibleWorkspaceUuid(
    options.accessibleWorkspaces,
    scopeKind,
    legacyId
  )
  if (!workspaceId) {
    return null
  }

  return {
    kind: 'workspace',
    scopeId,
    scopeKind,
    workspaceId,
    label: scope.label,
    legacyId,
  }
}

export function buildDefaultSitrepForWorkspace(
  workspace: WorkspaceSitrepSource,
  kind: 'incident' | 'exercise',
  baseForm: SitrepFormState,
  ongoingContent?: OngoingIncidentSitrepContent
): SitrepFormState {
  const workspaceKindLabel = kind === 'exercise' ? 'Exercise' : 'Incident'
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

  if (ongoingContent) {
    return {
      ...baseForm,
      reportNumber: `SITREP-${workspace.id}-${new Date().getFullYear()}`,
      preparedDateTime: stamp,
      reportingPeriodStart: workspace.startedAt ?? stamp,
      reportingPeriodEnd: stamp,
      incidentName: workspace.name,
      incidentLocation: workspace.region,
      preparedBy: workspace.lead,
      agency: workspace.region,
      executiveSummary: ongoingContent.executiveSummary,
      readinessAssessment: ongoingContent.readinessAssessment,
      riskToMission: ongoingContent.riskToMission,
      outstandingRfiRfr: ongoingContent.outstandingRfiRfr,
      previousCriticalIncidentComms: ongoingContent.previousCriticalIncidentComms,
      generalComments: ongoingContent.generalComments,
      imageryNotes: ongoingContent.imageryNotes,
      currentSituationSummary: workspace.summary,
    }
  }

  return {
    ...baseForm,
    reportNumber: `SITREP-${kind === 'exercise' ? 'EX' : 'IN'}-${workspace.id}-${new Date().getFullYear()}`,
    preparedDateTime: stamp,
    reportingPeriodStart: workspace.startedAt ?? stamp,
    reportingPeriodEnd: stamp,
    incidentName: workspace.name,
    incidentLocation: workspace.region,
    preparedBy: workspace.lead,
    agency: workspace.region,
    executiveSummary:
      workspace.summary ||
      `${workspaceKindLabel} ${workspace.name} is ${workspace.status} with ${workspace.severity} severity in ${workspace.region}.`,
    readinessAssessment:
      kind === 'exercise'
        ? `Exercise planning posture for ${workspace.name}: ${workspace.resourcesCommitted}. Objectives and MSEL injects aligned to the current exercise timeline.`
        : `Operational readiness for ${workspace.name}: ${workspace.resourcesCommitted}. Status ${workspace.status}; severity ${workspace.severity}.`,
    riskToMission:
      kind === 'exercise'
        ? 'Primary exercise risks include scenario inject timing, evaluator coverage gaps, and controller-to-player communications. Mitigations: MSEL synchronization, dedicated evaluators, and redundant comms checks.'
        : `Primary operational risks for ${workspace.name} include sustained resource demand, weather impacts, and coordination across ${workspace.region}. Mitigations tracked through the incident action plan.`,
    outstandingRfiRfr:
      kind === 'exercise'
        ? `RFI-EX-${workspace.id}: Confirm exercise evaluation criteria for ${workspace.name}.\nRFR-EX-${workspace.id}: Additional simulation cell support for the next exercise period.`
        : `RFI-IN-${workspace.id}: Updated situational assessment for ${workspace.name}.\nRFR-IN-${workspace.id}: Additional resources for ${workspace.region}.`,
    previousCriticalIncidentComms:
      kind === 'exercise'
        ? `${workspaceKindLabel} workspace activated for ${workspace.name}. Initial coordination with exercise controllers and participating agencies complete.`
        : `${workspaceKindLabel} workspace activated for ${workspace.name}. Unified command coordination established for ${workspace.region}.`,
    generalComments:
      kind === 'exercise'
        ? `${workspace.type} exercise in ${workspace.status} status. ${workspace.resourcesCommitted}. Next exercise period briefing scheduled.`
        : `${workspace.type} in ${workspace.status} status. ${workspace.resourcesCommitted}. Next operational period briefing scheduled.`,
    imageryNotes:
      kind === 'exercise'
        ? `Exercise map overlays and controller logs for ${workspace.name} archived to the workspace file manager.`
        : `Situation map and field imagery for ${workspace.name} archived to the incident workspace file manager.`,
    currentSituationSummary: workspace.summary,
  }
}

export function buildDefaultSitrepForAor(
  aorLabel: string,
  baseForm: SitrepFormState,
  buildRegion1Summary?: (label: string) => string
): SitrepFormState {
  return {
    ...baseForm,
    incidentName: aorLabel,
    incidentLocation: aorLabel,
    executiveSummary: aorLabel.includes('Region 1')
      ? (buildRegion1Summary?.(aorLabel) ??
        `${aorLabel} situational summary for the current reporting period.`)
      : `${aorLabel} situational summary for the current reporting period.`,
  }
}

export function mapSitrepVersionRow(row: SitrepVersionRow): SitrepVersion {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    creatorCreatedAt: row.creator_created_at
      ? Date.parse(row.creator_created_at)
      : Date.parse(row.created_at),
    creatorName: row.creator_name ?? row.author_name,
    creatorColor: row.creator_color ?? row.author_color,
    creatorRole: row.creator_role ?? '',
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    authorRole: row.author_role,
    snapshot: cloneSitrepFormState(row.snapshot),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
    submittedForReviewTo: row.submitted_for_review_to ?? undefined,
    submittedForReviewAt: row.submitted_for_review_at
      ? Date.parse(row.submitted_for_review_at)
      : undefined,
    aiGeneratedSections: row.ai_generated_sections ?? undefined,
    sectionId: (row.section_id as SitrepSection | null) ?? null,
  }
}

export function createLocalSitrepVersion(
  snapshot: SitrepFormState,
  authorName: string,
  authorColor: string,
  options?: {
    signatures?: SitrepVersionSignature[]
    sectionId?: SitrepSection
    authorRole?: string
    creatorName?: string
    creatorColor?: string
    creatorRole?: string
    creatorCreatedAt?: number
    submittedForReviewTo?: Array<{ name: string; role: string }>
    submittedForReviewAt?: number
    aiGeneratedSections?: SitrepSection[]
    authorId?: string | null
  }
): SitrepVersion {
  const now = Date.now()
  return {
    id: `${now}-${(options?.signatures?.length ?? 0) > 0 ? 'signed' : 'draft'}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    createdAt: now,
    creatorCreatedAt: options?.creatorCreatedAt ?? now,
    creatorName: options?.creatorName ?? authorName,
    creatorColor: options?.creatorColor ?? authorColor,
    creatorRole: options?.creatorRole ?? options?.authorRole ?? '',
    authorId: options?.authorId ?? null,
    authorName,
    authorColor,
    authorRole: options?.authorRole ?? '',
    snapshot: cloneSitrepFormState(snapshot),
    signatures: options?.signatures ?? [],
    submittedForReviewTo: options?.submittedForReviewTo,
    submittedForReviewAt: options?.submittedForReviewAt,
    aiGeneratedSections: options?.aiGeneratedSections,
    sectionId: options?.sectionId ?? null,
  }
}

export function createSeedSitrepVersions(initialForm: SitrepFormState): SitrepVersion[] {
  const now = Date.now()
  const authors: Array<{ name: string; color: string; role: string }> = [
    { name: 'You', color: '#16a34a', role: 'Technical Specialist' },
    { name: 'Maya Chen', color: '#ef4444', role: 'Operations Section Chief' },
    { name: 'Diego Alvarez', color: '#3b82f6', role: 'Logistics Section Chief' },
    { name: 'A. Rivera', color: '#16a34a', role: 'Liaison Officer' },
  ]
  const signers: Array<{ name: string; role: string }> = [
    { name: 'R. Morgan', role: 'Incident Commander' },
    { name: 'A. Rivera', role: 'Planning Section Chief' },
    { name: 'T. Hale', role: 'Operations Section Chief' },
  ]
  const signedIndices = new Set([0, 2, 4, 6])
  let signedCursor = 0
  const totalSeedVersions = 8
  let latestUnsignedIndex = -1
  for (let index = totalSeedVersions - 1; index >= 0; index -= 1) {
    if (!signedIndices.has(index)) {
      latestUnsignedIndex = index
      break
    }
  }

  return Array.from({ length: totalSeedVersions }, (_, index) => {
    const minutesAgo = (totalSeedVersions - index) * 3
    const createdAt = now - minutesAgo * 60_000
    const author = authors[index % authors.length]
    const isSigned = signedIndices.has(index)
    const signatures: SitrepVersionSignature[] = []
    if (isSigned) {
      const signer = signers[signedCursor % signers.length]
      signedCursor += 1
      signatures.push({
        name: signer.name,
        role: signer.role,
        signedAt: createdAt + 30_000,
      })
    }
    const creator = authors[(index + 2) % authors.length]
    const isSubmittedSeed = !isSigned && index === latestUnsignedIndex
    return createLocalSitrepVersion(cloneSitrepFormState(initialForm), author.name, author.color, {
      signatures,
      authorRole: author.role,
      creatorName: creator.name,
      creatorColor: creator.color,
      creatorRole: creator.role,
      creatorCreatedAt: createdAt - 8 * 60 * 1000,
      submittedForReviewTo: isSubmittedSeed
        ? [
            { name: 'D. Alvarez', role: 'Situation Unit Leader' },
            { name: 'M. Tanaka', role: 'Situation Unit Leader' },
            { name: 'A. Rivera', role: 'Planning Section Chief' },
            { name: 'Maya Chen', role: 'Planning Section Chief' },
          ]
        : undefined,
      submittedForReviewAt: isSubmittedSeed ? createdAt + 60_000 : undefined,
    })
  }).map((version, index) => ({
    ...version,
    id: `seed-sitrep-v${index + 1}`,
    createdAt: now - (totalSeedVersions - index) * 3 * 60_000,
  }))
}

export function isSitrepEditingAnySection(
  sectionEdits: Partial<Record<SitrepSection, string | null>>
): boolean {
  return Object.values(sectionEdits).some((value) => value !== null && value !== undefined)
}

export function summarizeSitrepForMap(form: SitrepFormState): string {
  const summary = form.executiveSummary.trim()
  if (summary.length === 0) {
    return 'No executive summary recorded.'
  }
  return summary.length > 240 ? `${summary.slice(0, 237)}…` : summary
}

export { createInitialSitrepForm }
