import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import { ICS205_DEFAULT_RADIO_CHANNEL_COUNT } from '@/features/ics205/constants'
import type {
  Ics205FormSectionDrafts,
  Ics205FormState,
  Ics205IncidentInfoDraft,
  Ics205PreparedByDraft,
  Ics205RadioChannelRow,
  Ics205RadioMode,
  Ics205SectionId,
  Ics205Version,
  Ics205VersionRow,
} from '@/features/ics205/types'

export function cloneIcs205RadioChannelRows(rows: Ics205RadioChannelRow[]): Ics205RadioChannelRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs205FormState(form: Ics205FormState): Ics205FormState {
  return {
    ...form,
    radioChannels: cloneIcs205RadioChannelRows(form.radioChannels),
  }
}

export function createDefaultIcs205RadioChannels(
  count = ICS205_DEFAULT_RADIO_CHANNEL_COUNT
): Ics205RadioChannelRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    zone: '',
    group: '',
    channelNumber: '',
    function: '',
    channelNameTalkgroup: '',
    assignment: '',
    rxFreq: '',
    rxNw: '',
    rxToneNac: '',
    txFreq: '',
    txNw: '',
    txToneNac: '',
    mode: '',
    remarks: '',
  }))
}

function normalizeRadioMode(mode: string | undefined): Ics205RadioMode {
  return mode === 'A' || mode === 'D' || mode === 'M' ? mode : ''
}

function normalizeRadioChannelRow(row: Ics205RadioChannelRow, index: number): Ics205RadioChannelRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    zone: String(row.zone ?? ''),
    group: String(row.group ?? ''),
    channelNumber: String(row.channelNumber ?? ''),
    function: String(row.function ?? ''),
    channelNameTalkgroup: String(row.channelNameTalkgroup ?? ''),
    assignment: String(row.assignment ?? ''),
    rxFreq: String(row.rxFreq ?? ''),
    rxNw: String(row.rxNw ?? ''),
    rxToneNac: String(row.rxToneNac ?? ''),
    txFreq: String(row.txFreq ?? ''),
    txNw: String(row.txNw ?? ''),
    txToneNac: String(row.txToneNac ?? ''),
    mode: normalizeRadioMode(row.mode),
    remarks: String(row.remarks ?? ''),
  }
}

export function normalizeIcs205FormState(form: Ics205FormState): Ics205FormState {
  const radioChannels =
    (form.radioChannels ?? []).length > 0
      ? form.radioChannels.map(normalizeRadioChannelRow)
      : createDefaultIcs205RadioChannels()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    preparedDate: String(form.preparedDate ?? ''),
    preparedTime: String(form.preparedTime ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    radioChannels,
    specialInstructions: String(form.specialInstructions ?? ''),
    preparedByName: String(form.preparedByName ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedByDateTime: String(form.preparedByDateTime ?? ''),
  }
}

export function mapIcs205VersionRow(row: Ics205VersionRow): Ics205Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs205FormState(normalizeIcs205FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs205Form(
  id: string,
  partial?: Partial<Ics205FormState>
): Ics205FormState {
  return normalizeIcs205FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    preparedDate: partial?.preparedDate ?? '',
    preparedTime: partial?.preparedTime ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    radioChannels: partial?.radioChannels ?? createDefaultIcs205RadioChannels(),
    specialInstructions: partial?.specialInstructions ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedByDateTime: partial?.preparedByDateTime ?? '',
  })
}

export function createLocalIcs205DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics205AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics205FormState): Ics205FormState {
  return cloneIcs205FormState({ ...normalizeIcs205FormState(form), id: documentId })
}

export function extractIcs205IncidentInfoDraft(form: Ics205FormState): Ics205IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    preparedDate: form.preparedDate,
    preparedTime: form.preparedTime,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs205PreparedByDraft(form: Ics205FormState): Ics205PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedBySignature: form.preparedBySignature,
    preparedByDateTime: form.preparedByDateTime,
  }
}

export function extractIcs205SectionDraft(
  form: Ics205FormState,
  section: Ics205SectionId
): Ics205FormSectionDrafts[Ics205SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs205IncidentInfoDraft(form)
    case 'basic-radio-channels':
      return cloneIcs205RadioChannelRows(form.radioChannels)
    case 'special-instructions':
      return form.specialInstructions
    case 'prepared-by':
      return extractIcs205PreparedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs205SectionDraft(
  form: Ics205FormState,
  section: Ics205SectionId,
  draft: Ics205FormSectionDrafts[Ics205SectionId]
): Ics205FormState {
  switch (section) {
    case 'incident-info':
      return {
        ...form,
        ...(draft as Ics205IncidentInfoDraft),
      }
    case 'basic-radio-channels':
      return {
        ...form,
        radioChannels: cloneIcs205RadioChannelRows(draft as Ics205RadioChannelRow[]),
      }
    case 'special-instructions':
      return {
        ...form,
        specialInstructions: draft as string,
      }
    case 'prepared-by':
      return {
        ...form,
        ...(draft as Ics205PreparedByDraft),
      }
    default:
      return form
  }
}

export function getIcs205FormForExport(
  form: Ics205FormState,
  sectionDrafts: Ics205FormSectionDrafts
): Ics205FormState {
  let exportForm = cloneIcs205FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics205SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs205SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}
