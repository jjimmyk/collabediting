import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics214ActivityLogRow,
  Ics214FormSectionDrafts,
  Ics214FormState,
  Ics214IncidentInfoDraft,
  Ics214PreparedByDraft,
  Ics214SectionId,
  Ics214Version,
  Ics214VersionRow,
} from '@/features/ics214/types'

export function cloneIcs214FormState(form: Ics214FormState): Ics214FormState {
  return {
    ...form,
    entries: form.entries.map((row) => ({ ...row })),
  }
}

export function normalizeIcs214FormState(form: Ics214FormState): Ics214FormState {
  return {
    ...form,
    entries: (form.entries ?? []).map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : index + 1,
      completedBy: String(row.completedBy ?? ''),
      completedAt: String(row.completedAt ?? ''),
      notableActivities: String(row.notableActivities ?? ''),
    })),
  }
}

export function mapIcs214VersionRow(row: Ics214VersionRow): Ics214Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs214FormState(normalizeIcs214FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs214Form(
  id: string,
  partial?: Partial<Ics214FormState>
): Ics214FormState {
  return normalizeIcs214FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    unitName: partial?.unitName ?? '',
    operationalPeriodFrom: partial?.operationalPeriodFrom ?? '',
    operationalPeriodTo: partial?.operationalPeriodTo ?? '',
    dateOfActivity: partial?.dateOfActivity ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
    entries: partial?.entries ?? [],
  })
}

export function createLocalIcs214DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics214AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics214FormState): Ics214FormState {
  return cloneIcs214FormState({ ...normalizeIcs214FormState(form), id: documentId })
}

export function extractIcs214IncidentInfoDraft(form: Ics214FormState): Ics214IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    unitName: form.unitName,
    operationalPeriodFrom: form.operationalPeriodFrom,
    operationalPeriodTo: form.operationalPeriodTo,
    dateOfActivity: form.dateOfActivity,
  }
}

export function extractIcs214PreparedByDraft(form: Ics214FormState): Ics214PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedDateTime: form.preparedDateTime,
  }
}

export function cloneIcs214ActivityLogRows(rows: Ics214ActivityLogRow[]): Ics214ActivityLogRow[] {
  return rows.map((row) => ({ ...row }))
}

export function extractIcs214SectionDraft(
  form: Ics214FormState,
  section: Ics214SectionId
): Ics214FormSectionDrafts[Ics214SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs214IncidentInfoDraft(form)
    case 'activity-log':
      return cloneIcs214ActivityLogRows(form.entries)
    case 'prepared-by':
      return extractIcs214PreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs214SectionDraft(
  form: Ics214FormState,
  section: Ics214SectionId,
  draft: Ics214FormSectionDrafts[Ics214SectionId]
): Ics214FormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics214IncidentInfoDraft),
      }
    case 'activity-log':
      return {
        ...form,
        entries: cloneIcs214ActivityLogRows(draft as Ics214ActivityLogRow[]),
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics214PreparedByDraft),
      }
    default:
      return form
  }
}

export function getIcs214FormForExport(
  form: Ics214FormState,
  sectionDrafts: Ics214FormSectionDrafts
): Ics214FormState {
  let exportForm = cloneIcs214FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics214SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs214SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function completedAtDatePortion(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10)
  }
  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed)) return ''
  return new Date(parsed).toISOString().slice(0, 10)
}

export function filterIcs214ActivityLogEntries(
  entries: Ics214ActivityLogRow[],
  filters: {
    completedBy: string
    completedAt: string
    notableActivitiesSearch: string
  }
): Ics214ActivityLogRow[] {
  const sorted = [...entries].sort((left, right) => {
    const leftTime = Date.parse(left.completedAt)
    const rightTime = Date.parse(right.completedAt)
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime
    }
    return left.id - right.id
  })

  return sorted.filter((entry) => {
    if (filters.completedBy && filters.completedBy !== 'all') {
      if (entry.completedBy.trim() !== filters.completedBy) return false
    }
    if (filters.completedAt) {
      if (completedAtDatePortion(entry.completedAt) !== filters.completedAt) return false
    }
    if (filters.notableActivitiesSearch.trim()) {
      const query = filters.notableActivitiesSearch.trim().toLowerCase()
      if (!entry.notableActivities.toLowerCase().includes(query)) return false
    }
    return true
  })
}

export function getDistinctCompletedByValues(entries: Ics214ActivityLogRow[]): string[] {
  const values = new Set<string>()
  for (const entry of entries) {
    const trimmed = entry.completedBy.trim()
    if (trimmed.length > 0) {
      values.add(trimmed)
    }
  }
  return [...values].sort((left, right) => left.localeCompare(right))
}
