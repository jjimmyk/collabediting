import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import { ICS205A_DEFAULT_CONTACT_ROW_COUNT } from '@/features/ics205a/constants'
import type {
  Ics205aContactRow,
  Ics205aFormSectionDrafts,
  Ics205aFormState,
  Ics205aIncidentInfoDraft,
  Ics205aPreparedByDraft,
  Ics205aSectionId,
  Ics205aVersion,
  Ics205aVersionRow,
} from '@/features/ics205a/types'

export function cloneIcs205aContactRows(rows: Ics205aContactRow[]): Ics205aContactRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs205aFormState(form: Ics205aFormState): Ics205aFormState {
  return {
    ...form,
    contactRows: cloneIcs205aContactRows(form.contactRows),
  }
}

export function createDefaultIcs205aContactRows(
  count = ICS205A_DEFAULT_CONTACT_ROW_COUNT
): Ics205aContactRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    assignedPosition: '',
    name: '',
    cellPhone: '',
    radioFrequency: '',
    other: '',
  }))
}

type LegacyIcs205aContactRow = Ics205aContactRow & { contactMethods?: string }

function normalizeContactRow(row: LegacyIcs205aContactRow, index: number): Ics205aContactRow {
  const legacyContactMethods = String(row.contactMethods ?? '').trim()
  const other = String(row.other ?? '').trim() || legacyContactMethods

  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    assignedPosition: String(row.assignedPosition ?? ''),
    name: String(row.name ?? ''),
    cellPhone: String(row.cellPhone ?? ''),
    radioFrequency: String(row.radioFrequency ?? ''),
    other,
  }
}

export function normalizeIcs205aFormState(form: Ics205aFormState): Ics205aFormState {
  const contactRows =
    (form.contactRows ?? []).length > 0
      ? form.contactRows.map(normalizeContactRow)
      : createDefaultIcs205aContactRows()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    contactRows,
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedByDateTime: String(form.preparedByDateTime ?? ''),
  }
}

export function mapIcs205aVersionRow(row: Ics205aVersionRow): Ics205aVersion {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs205aFormState(normalizeIcs205aFormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs205aForm(
  id: string,
  partial?: Partial<Ics205aFormState>
): Ics205aFormState {
  return normalizeIcs205aFormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    contactRows: partial?.contactRows ?? createDefaultIcs205aContactRows(),
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedByDateTime: partial?.preparedByDateTime ?? '',
  })
}

export function createLocalIcs205aDocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics205aAuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics205aFormState): Ics205aFormState {
  return cloneIcs205aFormState({ ...normalizeIcs205aFormState(form), id: documentId })
}

export function extractIcs205aIncidentInfoDraft(form: Ics205aFormState): Ics205aIncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs205aPreparedByDraft(form: Ics205aFormState): Ics205aPreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
    preparedBySignature: form.preparedBySignature,
    preparedByDateTime: form.preparedByDateTime,
  }
}

export function extractIcs205aSectionDraft(
  form: Ics205aFormState,
  section: Ics205aSectionId
): Ics205aFormSectionDrafts[Ics205aSectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs205aIncidentInfoDraft(form)
    case 'local-communications-info':
      return cloneIcs205aContactRows(form.contactRows)
    case 'prepared-by':
      return extractIcs205aPreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs205aSectionDraft(
  form: Ics205aFormState,
  section: Ics205aSectionId,
  draft: Ics205aFormSectionDrafts[Ics205aSectionId]
): Ics205aFormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics205aIncidentInfoDraft),
      }
    case 'local-communications-info':
      return {
        ...form,
        contactRows: cloneIcs205aContactRows(draft as Ics205aContactRow[]),
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics205aPreparedByDraft),
      }
    default:
      return form
  }
}

export function getIcs205aFormForExport(
  form: Ics205aFormState,
  sectionDrafts: Ics205aFormSectionDrafts
): Ics205aFormState {
  let exportForm = cloneIcs205aFormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics205aSectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs205aSectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
