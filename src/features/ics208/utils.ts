import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics208FormSectionDrafts,
  Ics208FormState,
  Ics208IncidentInfoDraft,
  Ics208PreparedByDraft,
  Ics208SafetyMessagePlanDraft,
  Ics208SectionId,
  Ics208SiteSafetyPlanDraft,
  Ics208Version,
  Ics208VersionRow,
  Ics208YesNo,
} from '@/features/ics208/types'

function normalizeYesNo(value: unknown): Ics208YesNo {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'yes') return 'yes'
  if (normalized === 'no') return 'no'
  return ''
}

export function cloneIcs208FormState(form: Ics208FormState): Ics208FormState {
  return { ...form }
}

export function normalizeIcs208FormState(form: Ics208FormState): Ics208FormState {
  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    safetyMessagePlan: String(form.safetyMessagePlan ?? ''),
    siteSafetyPlanRequired: normalizeYesNo(form.siteSafetyPlanRequired),
    approvedSiteSafetyPlanLocatedAt: String(form.approvedSiteSafetyPlanLocatedAt ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedByDateTime: String(form.preparedByDateTime ?? ''),
  }
}

export function mapIcs208VersionRow(row: Ics208VersionRow): Ics208Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs208FormState(normalizeIcs208FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs208Form(
  id: string,
  partial?: Partial<Ics208FormState>
): Ics208FormState {
  return normalizeIcs208FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    safetyMessagePlan: partial?.safetyMessagePlan ?? '',
    siteSafetyPlanRequired: partial?.siteSafetyPlanRequired ?? '',
    approvedSiteSafetyPlanLocatedAt: partial?.approvedSiteSafetyPlanLocatedAt ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedByDateTime: partial?.preparedByDateTime ?? '',
  })
}

export function createLocalIcs208DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics208AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics208FormState): Ics208FormState {
  return cloneIcs208FormState({ ...normalizeIcs208FormState(form), id: documentId })
}

export function extractIcs208IncidentInfoDraft(form: Ics208FormState): Ics208IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs208SafetyMessagePlanDraft(form: Ics208FormState): Ics208SafetyMessagePlanDraft {
  return { safetyMessagePlan: form.safetyMessagePlan }
}

export function extractIcs208SiteSafetyPlanDraft(form: Ics208FormState): Ics208SiteSafetyPlanDraft {
  return {
    siteSafetyPlanRequired: form.siteSafetyPlanRequired,
    approvedSiteSafetyPlanLocatedAt: form.approvedSiteSafetyPlanLocatedAt,
  }
}

export function extractIcs208PreparedByDraft(form: Ics208FormState): Ics208PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
    preparedBySignature: form.preparedBySignature,
    preparedByDateTime: form.preparedByDateTime,
  }
}

export function extractIcs208SectionDraft(
  form: Ics208FormState,
  section: Ics208SectionId
): Ics208FormSectionDrafts[Ics208SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs208IncidentInfoDraft(form)
    case 'safety-message-plan':
      return extractIcs208SafetyMessagePlanDraft(form)
    case 'site-safety-plan':
      return extractIcs208SiteSafetyPlanDraft(form)
    case 'prepared-by':
      return extractIcs208PreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs208SectionDraft(
  form: Ics208FormState,
  section: Ics208SectionId,
  draft: Ics208FormSectionDrafts[Ics208SectionId]
): Ics208FormState {
  switch (section) {
    case 'incident-info':
      return { ...form, ...(draft as Ics208IncidentInfoDraft) }
    case 'safety-message-plan':
      return { ...form, ...(draft as Ics208SafetyMessagePlanDraft) }
    case 'site-safety-plan':
      return { ...form, ...(draft as Ics208SiteSafetyPlanDraft) }
    case 'prepared-by':
      return { ...form, ...(draft as Ics208PreparedByDraft) }
    default:
      return form
  }
}

export function getIcs208FormForExport(
  form: Ics208FormState,
  sectionDrafts: Ics208FormSectionDrafts
): Ics208FormState {
  let exportForm = cloneIcs208FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics208SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs208SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function formatIcs208YesNo(value: Ics208YesNo): string {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return ''
}
