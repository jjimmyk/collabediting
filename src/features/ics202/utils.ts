import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics202FormSectionDrafts,
  Ics202FormState,
  Ics202IncidentInfoDraft,
  Ics202ObjectiveRow,
  Ics202PreparedByDraft,
  Ics202SectionId,
  Ics202SiteSafetyPlanDraft,
  Ics202Version,
  Ics202VersionRow,
} from '@/features/ics202/types'

export function cloneIcs202FormState(form: Ics202FormState): Ics202FormState {
  return {
    ...form,
    objectives: form.objectives.map((row) => ({ ...row })),
  }
}

export function normalizeIcs202FormState(form: Ics202FormState): Ics202FormState {
  return {
    ...form,
    objectives: (form.objectives ?? []).map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : index + 1,
      kind: row.kind === 'O' || row.kind === 'M' ? row.kind : '',
      label: String(row.label ?? ''),
      objective: String(row.objective ?? ''),
    })),
    siteSafetyPlanRequired: Boolean(form.siteSafetyPlanRequired),
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
    objectives: partial?.objectives ?? [],
    commandEmphasis: partial?.commandEmphasis ?? '',
    siteSafetyPlanRequired: partial?.siteSafetyPlanRequired ?? false,
    siteSafetyPlanLocation: partial?.siteSafetyPlanLocation ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
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
    case 'objectives':
      return cloneIcs202ObjectiveRows(form.objectives)
    case 'command-emphasis':
      return form.commandEmphasis
    case 'site-safety-plan':
      return extractIcs202SiteSafetyPlanDraft(form)
    case 'prepared-by':
      return extractIcs202PreparedByDraft(form)
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
