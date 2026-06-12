import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  ICS215A_DEFAULT_SAFETY_ANALYSIS_ROW_COUNT,
  ICS215A_RISK_GAIN_LEVELS,
} from '@/features/ics215a/constants'
import type {
  Ics215aFormSectionDrafts,
  Ics215aFormState,
  Ics215aIncidentInfoDraft,
  Ics215aOperationalPeriodDraft,
  Ics215aPreparedByDraft,
  Ics215aRiskGainLevel,
  Ics215aSafetyAnalysisRow,
  Ics215aSectionId,
  Ics215aVersion,
  Ics215aVersionRow,
} from '@/features/ics215a/types'

function normalizeRiskGainLevel(value: unknown): Ics215aRiskGainLevel {
  if (value === 'L' || value === 'M' || value === 'H') return value
  return ''
}

export function formatIcs215aRiskGain(row: Ics215aSafetyAnalysisRow): string {
  const risk = row.riskLevel || '—'
  const gain = row.gainLevel || '—'
  if (risk === '—' && gain === '—') return ''
  return `(${risk})/(${gain})`
}

export function cloneIcs215aSafetyAnalysisRows(
  rows: Ics215aSafetyAnalysisRow[]
): Ics215aSafetyAnalysisRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs215aFormState(form: Ics215aFormState): Ics215aFormState {
  return {
    ...form,
    safetyAnalysisRows: cloneIcs215aSafetyAnalysisRows(form.safetyAnalysisRows),
  }
}

export function createDefaultIcs215aSafetyAnalysisRows(
  count = ICS215A_DEFAULT_SAFETY_ANALYSIS_ROW_COUNT
): Ics215aSafetyAnalysisRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    incidentArea: '',
    hazardsRisks: '',
    mitigations: '',
    riskLevel: '',
    gainLevel: '',
  }))
}

function normalizeSafetyAnalysisRow(
  row: Ics215aSafetyAnalysisRow,
  index: number
): Ics215aSafetyAnalysisRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    incidentArea: String(row.incidentArea ?? ''),
    hazardsRisks: String(row.hazardsRisks ?? ''),
    mitigations: String(row.mitigations ?? ''),
    riskLevel: normalizeRiskGainLevel(row.riskLevel),
    gainLevel: normalizeRiskGainLevel(row.gainLevel),
  }
}

export function normalizeIcs215aFormState(form: Ics215aFormState): Ics215aFormState {
  const safetyAnalysisRows =
    (form.safetyAnalysisRows ?? []).length > 0
      ? form.safetyAnalysisRows.map(normalizeSafetyAnalysisRow)
      : createDefaultIcs215aSafetyAnalysisRows()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    incidentLocation: String(form.incidentLocation ?? ''),
    preparedDate: String(form.preparedDate ?? ''),
    preparedTime: String(form.preparedTime ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    safetyAnalysisRows,
    preparedByName: String(form.preparedByName ?? ''),
    preparedByPositionTitle: String(form.preparedByPositionTitle ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedDateTime: String(form.preparedDateTime ?? ''),
  }
}

export function mapIcs215aVersionRow(row: Ics215aVersionRow): Ics215aVersion {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs215aFormState(normalizeIcs215aFormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs215aForm(
  id: string,
  partial?: Partial<Ics215aFormState>
): Ics215aFormState {
  return normalizeIcs215aFormState({
    id,
    incidentName: partial?.incidentName ?? '',
    incidentLocation: partial?.incidentLocation ?? '',
    preparedDate: partial?.preparedDate ?? '',
    preparedTime: partial?.preparedTime ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    safetyAnalysisRows:
      partial?.safetyAnalysisRows ?? createDefaultIcs215aSafetyAnalysisRows(),
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
  })
}

export function createLocalIcs215aDocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics215aAuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(
  documentId: string,
  form: Ics215aFormState
): Ics215aFormState {
  return cloneIcs215aFormState({ ...normalizeIcs215aFormState(form), id: documentId })
}

export function extractIcs215aIncidentInfoDraft(form: Ics215aFormState): Ics215aIncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    incidentLocation: form.incidentLocation,
    preparedDate: form.preparedDate,
    preparedTime: form.preparedTime,
  }
}

export function extractIcs215aOperationalPeriodDraft(
  form: Ics215aFormState
): Ics215aOperationalPeriodDraft {
  return {
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs215aPreparedByDraft(form: Ics215aFormState): Ics215aPreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedByPositionTitle: form.preparedByPositionTitle,
    preparedBySignature: form.preparedBySignature,
    preparedDateTime: form.preparedDateTime,
  }
}

export function extractIcs215aSectionDraft(
  form: Ics215aFormState,
  section: Ics215aSectionId
): Ics215aFormSectionDrafts[Ics215aSectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs215aIncidentInfoDraft(form)
    case 'operational-period':
      return extractIcs215aOperationalPeriodDraft(form)
    case 'safety-analysis':
      return cloneIcs215aSafetyAnalysisRows(form.safetyAnalysisRows)
    case 'prepared-by':
      return extractIcs215aPreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs215aSectionDraft(
  form: Ics215aFormState,
  section: Ics215aSectionId,
  draft: Ics215aFormSectionDrafts[Ics215aSectionId]
): Ics215aFormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics215aIncidentInfoDraft),
      }
    case 'operational-period':
      return {
        ...form,
        ...(draft as Ics215aOperationalPeriodDraft),
      }
    case 'safety-analysis':
      return {
        ...form,
        safetyAnalysisRows: cloneIcs215aSafetyAnalysisRows(draft as Ics215aSafetyAnalysisRow[]),
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics215aPreparedByDraft),
      }
    default:
      return form
  }
}

export function getIcs215aFormForExport(
  form: Ics215aFormState,
  sectionDrafts: Ics215aFormSectionDrafts
): Ics215aFormState {
  let exportForm = cloneIcs215aFormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics215aSectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs215aSectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export { ICS215A_RISK_GAIN_LEVELS }
