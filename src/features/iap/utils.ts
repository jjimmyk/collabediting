import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import { IAP_DEFAULT_FORMS_CHECKLIST } from '@/features/iap/constants'
import type {
  IapCoverSheetDraft,
  IapFormChecklistItem,
  IapFormSectionDrafts,
  IapFormState,
  IapIncidentCommanderRow,
  IapSectionId,
  IapVersion,
  IapVersionRow,
} from '@/features/iap/types'

export function cloneIapFormState(form: IapFormState): IapFormState {
  return {
    ...form,
    incidentCommanders: form.incidentCommanders.map((row) => ({ ...row })),
    formsChecklist: form.formsChecklist.map((item) => ({ ...item })),
  }
}

function normalizeChecklist(items: IapFormChecklistItem[] | undefined): IapFormChecklistItem[] {
  const defaults = IAP_DEFAULT_FORMS_CHECKLIST.map((item) => ({ ...item }))
  if (!items?.length) return defaults
  return defaults.map((defaultItem) => {
    const existing = items.find((item) => item.id === defaultItem.id)
    if (!existing) return defaultItem
    return {
      ...defaultItem,
      included: Boolean(existing.included),
      customLabel: existing.customLabel ?? defaultItem.customLabel,
    }
  })
}

export function normalizeIapFormState(form: IapFormState): IapFormState {
  return {
    ...form,
    incidentCommanders: (form.incidentCommanders ?? []).map((row, index) => ({
      id: typeof row.id === 'number' ? row.id : index + 1,
      organization: String(row.organization ?? ''),
      name: String(row.name ?? ''),
      signedAt: typeof row.signedAt === 'number' ? row.signedAt : null,
    })),
    formsChecklist: normalizeChecklist(form.formsChecklist),
  }
}

export function mapIapVersionRow(row: IapVersionRow): IapVersion {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIapFormState(normalizeIapFormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIapForm(id: string, partial?: Partial<IapFormState>): IapFormState {
  return normalizeIapFormState({
    id,
    incidentName: partial?.incidentName ?? '',
    incidentLocation: partial?.incidentLocation ?? '',
    operationalPeriodFrom: partial?.operationalPeriodFrom ?? '',
    operationalPeriodTo: partial?.operationalPeriodTo ?? '',
    incidentCommanders: partial?.incidentCommanders ?? [
      { id: 1, organization: '', name: '', signedAt: null },
    ],
    formsChecklist: partial?.formsChecklist ?? IAP_DEFAULT_FORMS_CHECKLIST.map((item) => ({ ...item })),
  })
}

export function createLocalIapDocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function iapAuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: IapFormState): IapFormState {
  return cloneIapFormState({ ...normalizeIapFormState(form), id: documentId })
}

export function extractIapCoverSheetDraft(form: IapFormState): IapCoverSheetDraft {
  return {
    incidentName: form.incidentName,
    incidentLocation: form.incidentLocation,
    operationalPeriodFrom: form.operationalPeriodFrom,
    operationalPeriodTo: form.operationalPeriodTo,
  }
}

export function cloneIapIncidentCommanderRows(
  rows: IapIncidentCommanderRow[]
): IapIncidentCommanderRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIapFormsChecklist(items: IapFormChecklistItem[]): IapFormChecklistItem[] {
  return items.map((item) => ({ ...item }))
}

export function extractIapSectionDraft(
  form: IapFormState,
  section: IapSectionId
): IapFormSectionDrafts[IapSectionId] {
  switch (section) {
    case 'cover-sheet':
      return extractIapCoverSheetDraft(form)
    case 'incident-commanders':
      return cloneIapIncidentCommanderRows(form.incidentCommanders)
    case 'forms-checklist':
      return cloneIapFormsChecklist(form.formsChecklist)
    default:
      return undefined
  }
}

export function applyIapSectionDraft(
  form: IapFormState,
  section: IapSectionId,
  draft: IapFormSectionDrafts[IapSectionId]
): IapFormState {
  switch (section) {
    case 'cover-sheet':
      return {
        ...form,
        ...(draft as IapCoverSheetDraft),
      }
    case 'incident-commanders':
      return {
        ...form,
        incidentCommanders: cloneIapIncidentCommanderRows(draft as IapIncidentCommanderRow[]),
      }
    case 'forms-checklist':
      return {
        ...form,
        formsChecklist: cloneIapFormsChecklist(draft as IapFormChecklistItem[]),
      }
    default:
      return form
  }
}

export function getIapFormForExport(
  form: IapFormState,
  sectionDrafts: IapFormSectionDrafts
): IapFormState {
  let exportForm = cloneIapFormState(form)
  for (const section of Object.keys(sectionDrafts) as IapSectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIapSectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function nextIapRowId(rows: Array<{ id: number }>): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}
