import { formatIcs201ObjectiveKindLabel } from './constants'
import type {
  Ics201FormState,
  Ics201ObjectiveKind,
  Ics201ObjectiveRow,
  Ics201SectionId,
  Ics201Version,
  Ics201VersionRow,
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

export function normalizeIcs201ObjectiveKind(kind: unknown): Ics201ObjectiveKind {
  if (kind === 'O' || kind === 'M' || kind === 'O&M') {
    return kind
  }
  if (kind === 'O/M') {
    return 'O&M'
  }
  return ''
}

export function normalizeIcs201ObjectiveRows(raw: unknown): Ics201ObjectiveRow[] {
  if (!Array.isArray(raw)) {
    return []
  }
  if (raw.length === 0) {
    return []
  }
  if (typeof raw[0] === 'string') {
    return raw.map((entry, index) => ({
      id: index + 1,
      kind: 'O' as Ics201ObjectiveKind,
      objective: String(entry ?? ''),
    }))
  }
  return raw.map((row, index) => ({
    id: typeof row?.id === 'number' ? row.id : index + 1,
    kind: normalizeIcs201ObjectiveKind(row?.kind),
    objective: String(row?.objective ?? ''),
  }))
}

export function normalizeIcs201FormState(form: Ics201FormState): Ics201FormState {
  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    incidentNumber: String(form.incidentNumber ?? ''),
    incidentLocation: String(form.incidentLocation ?? ''),
    dateInitiated: String(form.dateInitiated ?? ''),
    timeInitiated: String(form.timeInitiated ?? ''),
    preparedDateTime: String(form.preparedDateTime ?? ''),
    operationalPeriodStart: String(form.operationalPeriodStart ?? ''),
    operationalPeriodEnd: String(form.operationalPeriodEnd ?? ''),
    jurisdiction: String(form.jurisdiction ?? ''),
    preparedBy: String(form.preparedBy ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    mapSketchPolygon: Array.isArray(form.mapSketchPolygon)
      ? form.mapSketchPolygon.map((vertex) => ({
          longitude: Number(vertex.longitude),
          latitude: Number(vertex.latitude),
        }))
      : [],
    currentSituationSummary: String(form.currentSituationSummary ?? ''),
    weatherForecast: String(form.weatherForecast ?? ''),
    projectedIncidentCourse: String(form.projectedIncidentCourse ?? ''),
    objectives: normalizeIcs201ObjectiveRows(form.objectives),
    actions: Array.isArray(form.actions)
      ? form.actions.map((action, index) => ({
          id: typeof action.id === 'number' ? action.id : index + 1,
          task: String(action.task ?? ''),
          owner: String(action.owner ?? ''),
          startTime: String(action.startTime ?? ''),
          endTime: String(action.endTime ?? ''),
          status: String(action.status ?? ''),
        }))
      : [],
    orgChart: {
      incidentCommander: String(form.orgChart?.incidentCommander ?? ''),
      operationsSectionChief: String(form.orgChart?.operationsSectionChief ?? ''),
      planningSectionChief: String(form.orgChart?.planningSectionChief ?? ''),
      logisticsSectionChief: String(form.orgChart?.logisticsSectionChief ?? ''),
      financeSectionChief: String(form.orgChart?.financeSectionChief ?? ''),
      publicInformationOfficer: String(form.orgChart?.publicInformationOfficer ?? ''),
      safetyOfficer: String(form.orgChart?.safetyOfficer ?? ''),
      liaisonOfficer: String(form.orgChart?.liaisonOfficer ?? ''),
    },
    resources: Array.isArray(form.resources)
      ? form.resources.map((resource, index) => ({
          id: typeof resource.id === 'number' ? resource.id : index + 1,
          category: String(resource.category ?? ''),
          identifier: String(resource.identifier ?? ''),
          quantity: String(resource.quantity ?? ''),
          status: String(resource.status ?? ''),
          assignment: String(resource.assignment ?? ''),
        }))
      : [],
    safetyAnalysis: Array.isArray(form.safetyAnalysis)
      ? form.safetyAnalysis.map((row, index) => ({
          id: typeof row.id === 'number' ? row.id : index + 1,
          hazard: String(row.hazard ?? ''),
          mitigation: String(row.mitigation ?? ''),
          ppe: String(row.ppe ?? ''),
          medicalPlan: String(row.medicalPlan ?? ''),
        }))
      : [],
  }
}

export function ics201ObjectivesFromStrings(texts: string[]): Ics201ObjectiveRow[] {
  return texts.map((objective, index) => ({
    id: index + 1,
    kind: 'O',
    objective,
  }))
}

export function formatIcs201ObjectiveExportLine(row: Ics201ObjectiveRow, index: number): string {
  const kindLabel = formatIcs201ObjectiveKindLabel(row.kind)
  const prefix = kindLabel ? `[${kindLabel}] ` : ''
  const text = row.objective.trim() || `Objective ${index + 1}`
  return `${index + 1}. ${prefix}${text}`
}

export function cloneIcs201FormState(form: Ics201FormState): Ics201FormState {
  return {
    ...form,
    mapSketchPolygon: form.mapSketchPolygon.map((vertex) => ({ ...vertex })),
    objectives: form.objectives.map((row) => ({ ...row })),
    actions: form.actions.map((action) => ({ ...action })),
    orgChart: { ...form.orgChart },
    resources: form.resources.map((resource) => ({ ...resource })),
    safetyAnalysis: form.safetyAnalysis.map((row) => ({ ...row })),
  }
}

export function ics201AuthorColorFromId(userId: string): string {
  let hash = 0
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index)
    hash |= 0
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length]
}

export function ics201InitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function ics201InitialsFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email
  const parts = localPart.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return localPart.slice(0, 2).toUpperCase()
}

export function ics201VersionAuthorLabel(
  version: {
    authorName: string
    authorEmail?: string | null
    authorId?: string | null
  },
  options?: {
    profileEmail?: string | null
    rosterMembers?: Array<{ userId: string | null; email: string }>
  }
): string {
  if (version.authorEmail) {
    return version.authorEmail
  }
  if (version.authorName.includes('@')) {
    return version.authorName
  }
  if (version.authorId && options?.rosterMembers) {
    const member = options.rosterMembers.find((entry) => entry.userId === version.authorId)
    if (member?.email) {
      return member.email
    }
  }
  if (options?.rosterMembers) {
    for (const member of options.rosterMembers) {
      if (ics201DisplayNameFromEmail(member.email) === version.authorName) {
        return member.email
      }
    }
  }
  if (version.authorName === 'You' && options?.profileEmail) {
    return options.profileEmail
  }
  return version.authorName
}

export function ics201DisplayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function enrichIcs201VersionAuthorEmail(
  version: Ics201Version,
  rosterMembers?: Array<{ userId: string | null; email: string }>
): Ics201Version {
  const authorEmail = ics201VersionAuthorLabel(version, { rosterMembers })
  if (authorEmail === version.authorName && !authorEmail.includes('@')) {
    return version
  }
  return {
    ...version,
    authorEmail,
  }
}

export function mapIcs201VersionRow(row: Ics201VersionRow): Ics201Version {
  const authorEmail = row.author_name.includes('@') ? row.author_name : null
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail,
    authorColor: row.author_color,
    snapshot: cloneIcs201FormState(normalizeIcs201FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
    sectionId: (row.section_id as Ics201SectionId | null) ?? null,
  }
}

export function createSeedIcs201Versions(initialForm: Ics201FormState): Ics201Version[] {
  const now = Date.now()
  const authors: Array<{ name: string; color: string }> = [
    { name: 'You', color: '#16a34a' },
    { name: 'Maya Chen', color: '#ef4444' },
    { name: 'Diego Alvarez', color: '#3b82f6' },
    { name: 'A. Rivera', color: '#16a34a' },
  ]
  const signers: Array<{ name: string; role: string }> = [
    { name: 'R. Morgan', role: 'Incident Commander' },
    { name: 'A. Rivera', role: 'Planning Section Chief' },
    { name: 'T. Hale', role: 'Operations Section Chief' },
    { name: 'K. Simmons', role: 'Safety Officer' },
    { name: 'Maya Chen', role: 'Situation Unit Leader' },
  ]
  const signedIndices = new Set([0, 2, 4, 6, 8])
  let signedCursor = 0

  return Array.from({ length: 10 }, (_, index) => {
    const minutesAgo = (10 - index) * 2
    const createdAt = now - minutesAgo * 60_000
    const author = authors[index % authors.length]
    const isSigned = signedIndices.has(index)
    const signatures: Ics201Version['signatures'] = []
    if (isSigned) {
      const signer = signers[signedCursor % signers.length]
      signedCursor += 1
      signatures.push({
        name: signer.name,
        role: signer.role,
        signedAt: createdAt + 30_000,
      })
    }
    return {
      id: `seed-v${index + 1}`,
      createdAt,
      authorName: author.name,
      authorColor: author.color,
      snapshot: cloneIcs201FormState(initialForm),
      signatures,
    }
  })
}

export function createLocalIcs201Version(
  snapshot: Ics201FormState,
  authorName: string,
  authorColor: string,
  signatures: Ics201Version['signatures'] = [],
  sectionId?: Ics201SectionId,
  authorEmail?: string | null
): Ics201Version {
  return {
    id: `${Date.now()}-${signatures.length > 0 ? 'signed' : 'draft'}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    createdAt: Date.now(),
    authorName,
    authorEmail: authorEmail ?? (authorName.includes('@') ? authorName : null),
    authorColor,
    snapshot: cloneIcs201FormState(snapshot),
    signatures,
    sectionId,
  }
}

export function isIcs201EditingAnySection(flags: {
  reportInfo: boolean
  incidentBriefing: boolean
  mapSketch: boolean
  currentSituation: boolean
  objectives: boolean
  actions: boolean
  orgChart: boolean
  resources: boolean
  safetyAnalysis: boolean
}): boolean {
  return Object.values(flags).some(Boolean)
}

export function resolveActiveIcs201Section(flags: {
  reportInfo: boolean
  incidentBriefing: boolean
  mapSketch: boolean
  currentSituation: boolean
  objectives: boolean
  actions: boolean
  orgChart: boolean
  resources: boolean
  safetyAnalysis: boolean
}): Ics201SectionId | null {
  if (flags.reportInfo) return 'report-info'
  if (flags.incidentBriefing) return 'incident-briefing'
  if (flags.mapSketch) return 'map-sketch'
  if (flags.currentSituation) return 'current-situation'
  if (flags.objectives) return 'objectives'
  if (flags.actions) return 'actions'
  if (flags.orgChart) return 'org-chart'
  if (flags.resources) return 'resources'
  if (flags.safetyAnalysis) return 'safety-analysis'
  return null
}
