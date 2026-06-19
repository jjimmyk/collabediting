import { ICS202_COMMUNITY_LIFELINES } from '@/features/ics202/constants'
import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics202CommunityLifelines,
  Ics202FormSectionDrafts,
  Ics202FormState,
  Ics202IncidentInfoDraft,
  Ics202ObjectiveKind,
  Ics202ObjectiveRow,
  Ics202PreparedByDraft,
  Ics202SectionId,
  Ics202SiteSafetyPlanDraft,
  Ics202Version,
  Ics202VersionRow,
} from '@/features/ics202/types'

export function createEmptyIcs202CommunityLifelines(
  partial?: Partial<Ics202CommunityLifelines>
): Ics202CommunityLifelines {
  return ICS202_COMMUNITY_LIFELINES.reduce<Ics202CommunityLifelines>((acc, item) => {
    acc[item.id] = partial?.[item.id] ?? false
    return acc
  }, {} as Ics202CommunityLifelines)
}

export function cloneIcs202FormState(form: Ics202FormState): Ics202FormState {
  return {
    ...form,
    communityLifelines: { ...form.communityLifelines },
    objectives: form.objectives.map((row) => ({ ...row })),
  }
}

export function normalizeIcs202ObjectiveKind(kind: unknown): Ics202ObjectiveKind {
  if (kind === 'O' || kind === 'M' || kind === 'O&M') {
    return kind
  }
  if (kind === 'O/M') {
    return 'O&M'
  }
  return ''
}

export function normalizeIcs202FormState(form: Ics202FormState): Ics202FormState {
  const lifelines = createEmptyIcs202CommunityLifelines(form.communityLifelines ?? {})
  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    incidentLocation: String(form.incidentLocation ?? ''),
    operationalPeriodFrom: String(form.operationalPeriodFrom ?? ''),
    operationalPeriodTo: String(form.operationalPeriodTo ?? ''),
    communityLifelines: lifelines,
    incidentPriorities: String(form.incidentPriorities ?? ''),
    objectives: (form.objectives ?? []).map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : index + 1,
      kind: normalizeIcs202ObjectiveKind(row.kind),
      objective: String(row.objective ?? ''),
    })),
    commandEmphasis: String(form.commandEmphasis ?? ''),
    siteSafetyPlanRequired: Boolean(form.siteSafetyPlanRequired),
    siteSafetyPlanLocation: String(form.siteSafetyPlanLocation ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(
      form.preparedByPositionTitle ?? 'Planning Section Chief'
    ),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedDateTime: String(form.preparedDateTime ?? ''),
    criticalInformationRequirements: String(form.criticalInformationRequirements ?? ''),
    limitationsAndConstraints: String(form.limitationsAndConstraints ?? ''),
    keyDecisionsAndProcedures: String(form.keyDecisionsAndProcedures ?? ''),
  }
}

export function mapIcs202VersionRow(row: Ics202VersionRow): Ics202Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs202FormState(normalizeIcs202FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs202Form(id: string, partial?: Partial<Ics202FormState>): Ics202FormState {
  return normalizeIcs202FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    incidentLocation: partial?.incidentLocation ?? '',
    operationalPeriodFrom: partial?.operationalPeriodFrom ?? '',
    operationalPeriodTo: partial?.operationalPeriodTo ?? '',
    communityLifelines: createEmptyIcs202CommunityLifelines(partial?.communityLifelines),
    incidentPriorities: partial?.incidentPriorities ?? '',
    objectives: partial?.objectives ?? [],
    commandEmphasis: partial?.commandEmphasis ?? '',
    siteSafetyPlanRequired: partial?.siteSafetyPlanRequired ?? false,
    siteSafetyPlanLocation: partial?.siteSafetyPlanLocation ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? 'Planning Section Chief',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
    criticalInformationRequirements: partial?.criticalInformationRequirements ?? '',
    limitationsAndConstraints: partial?.limitationsAndConstraints ?? '',
    keyDecisionsAndProcedures: partial?.keyDecisionsAndProcedures ?? '',
  })
}

export function createLocalIcs202DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics202AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics202FormState): Ics202FormState {
  return cloneIcs202FormState({ ...normalizeIcs202FormState(form), id: documentId })
}

export function extractIcs202IncidentInfoDraft(form: Ics202FormState): Ics202IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    incidentLocation: form.incidentLocation,
    operationalPeriodFrom: form.operationalPeriodFrom,
    operationalPeriodTo: form.operationalPeriodTo,
  }
}

export function extractIcs202SiteSafetyPlanDraft(form: Ics202FormState): Ics202SiteSafetyPlanDraft {
  return {
    siteSafetyPlanRequired: form.siteSafetyPlanRequired,
    siteSafetyPlanLocation: form.siteSafetyPlanLocation,
  }
}

export function extractIcs202PreparedByDraft(form: Ics202FormState): Ics202PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
    preparedBySignature: form.preparedBySignature,
    preparedDateTime: form.preparedDateTime,
  }
}

export function cloneIcs202ObjectiveRows(rows: Ics202ObjectiveRow[]): Ics202ObjectiveRow[] {
  return rows.map((row) => ({ ...row }))
}

export function extractIcs202SectionDraft(
  form: Ics202FormState,
  section: Ics202SectionId
): Ics202FormSectionDrafts[Ics202SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs202IncidentInfoDraft(form)
    case 'community-lifelines':
      return { ...form.communityLifelines }
    case 'incident-priorities':
      return form.incidentPriorities
    case 'objectives':
      return cloneIcs202ObjectiveRows(form.objectives)
    case 'command-emphasis':
      return form.commandEmphasis
    case 'site-safety-plan':
      return extractIcs202SiteSafetyPlanDraft(form)
    case 'prepared-by':
      return extractIcs202PreparedByDraft(form)
    case 'critical-information-requirements':
      return form.criticalInformationRequirements
    case 'limitations-constraints':
      return form.limitationsAndConstraints
    case 'key-decisions-procedures':
      return form.keyDecisionsAndProcedures
    default:
      return undefined
  }
}

export function applyIcs202SectionDraft(
  form: Ics202FormState,
  section: Ics202SectionId,
  draft: Ics202FormSectionDrafts[Ics202SectionId]
): Ics202FormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics202IncidentInfoDraft),
      }
    case 'community-lifelines':
      return {
        ...form,
        communityLifelines: createEmptyIcs202CommunityLifelines(
          draft as Ics202CommunityLifelines
        ),
      }
    case 'incident-priorities':
      return {
        ...form,
        incidentPriorities: draft as string,
      }
    case 'objectives':
      return {
        ...form,
        objectives: cloneIcs202ObjectiveRows(draft as Ics202ObjectiveRow[]),
      }
    case 'command-emphasis':
      return {
        ...form,
        commandEmphasis: draft as string,
      }
    case 'site-safety-plan':
      return {
        ...form,
        ...(draft as Ics202SiteSafetyPlanDraft),
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics202PreparedByDraft),
      }
    case 'critical-information-requirements':
      return {
        ...form,
        criticalInformationRequirements: draft as string,
      }
    case 'limitations-constraints':
      return {
        ...form,
        limitationsAndConstraints: draft as string,
      }
    case 'key-decisions-procedures':
      return {
        ...form,
        keyDecisionsAndProcedures: draft as string,
      }
    default:
      return form
  }
}

export function getIcs202FormForExport(
  form: Ics202FormState,
  sectionDrafts: Ics202FormSectionDrafts
): Ics202FormState {
  let exportForm = cloneIcs202FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics202SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs202SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
