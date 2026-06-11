import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  ICS206_DEFAULT_HOSPITAL_COUNT,
  ICS206_DEFAULT_MEDICAL_AID_STATION_COUNT,
  ICS206_DEFAULT_TRANSPORTATION_COUNT,
} from '@/features/ics206/constants'
import type {
  Ics206ApprovedByDraft,
  Ics206FormSectionDrafts,
  Ics206FormState,
  Ics206HospitalRow,
  Ics206IncidentInfoDraft,
  Ics206LevelOfService,
  Ics206MedicalAidStationRow,
  Ics206PreparedByDraft,
  Ics206SectionId,
  Ics206SpecialProceduresDraft,
  Ics206TransportationRow,
  Ics206Version,
  Ics206VersionRow,
  Ics206YesNo,
} from '@/features/ics206/types'

function normalizeYesNo(value: unknown): Ics206YesNo {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'yes') return 'yes'
  if (normalized === 'no') return 'no'
  return ''
}

function normalizeLevelOfService(value: unknown): Ics206LevelOfService {
  const normalized = String(value ?? '').toUpperCase()
  if (normalized === 'ALS') return 'ALS'
  if (normalized === 'BLS') return 'BLS'
  return ''
}

export function cloneIcs206MedicalAidStationRows(
  rows: Ics206MedicalAidStationRow[]
): Ics206MedicalAidStationRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs206TransportationRows(
  rows: Ics206TransportationRow[]
): Ics206TransportationRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs206HospitalRows(rows: Ics206HospitalRow[]): Ics206HospitalRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs206FormState(form: Ics206FormState): Ics206FormState {
  return {
    ...form,
    medicalAidStations: cloneIcs206MedicalAidStationRows(form.medicalAidStations),
    transportation: cloneIcs206TransportationRows(form.transportation),
    hospitals: cloneIcs206HospitalRows(form.hospitals),
  }
}

export function createDefaultIcs206MedicalAidStationRows(
  count = ICS206_DEFAULT_MEDICAL_AID_STATION_COUNT
): Ics206MedicalAidStationRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: '',
    location: '',
    contactNumbersFrequency: '',
    paramedicsOnSite: '',
  }))
}

export function createDefaultIcs206TransportationRows(
  count = ICS206_DEFAULT_TRANSPORTATION_COUNT
): Ics206TransportationRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    ambulanceService: '',
    location: '',
    contactNumbersFrequency: '',
    levelOfService: '',
  }))
}

export function createDefaultIcs206HospitalRows(
  count = ICS206_DEFAULT_HOSPITAL_COUNT
): Ics206HospitalRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    hospitalName: '',
    addressLatLong: '',
    contactNumbersFrequency: '',
    travelTimeAir: '',
    travelTimeGround: '',
    traumaCenterYes: '',
    traumaCenterLevel: '',
    burnCenterYes: '',
    helipadYes: '',
  }))
}

function normalizeMedicalAidStationRow(
  row: Ics206MedicalAidStationRow,
  index: number
): Ics206MedicalAidStationRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    name: String(row.name ?? ''),
    location: String(row.location ?? ''),
    contactNumbersFrequency: String(row.contactNumbersFrequency ?? ''),
    paramedicsOnSite: normalizeYesNo(row.paramedicsOnSite),
  }
}

function normalizeTransportationRow(
  row: Ics206TransportationRow,
  index: number
): Ics206TransportationRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    ambulanceService: String(row.ambulanceService ?? ''),
    location: String(row.location ?? ''),
    contactNumbersFrequency: String(row.contactNumbersFrequency ?? ''),
    levelOfService: normalizeLevelOfService(row.levelOfService),
  }
}

function normalizeHospitalRow(row: Ics206HospitalRow, index: number): Ics206HospitalRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    hospitalName: String(row.hospitalName ?? ''),
    addressLatLong: String(row.addressLatLong ?? ''),
    contactNumbersFrequency: String(row.contactNumbersFrequency ?? ''),
    travelTimeAir: String(row.travelTimeAir ?? ''),
    travelTimeGround: String(row.travelTimeGround ?? ''),
    traumaCenterYes: normalizeYesNo(row.traumaCenterYes),
    traumaCenterLevel: String(row.traumaCenterLevel ?? ''),
    burnCenterYes: normalizeYesNo(row.burnCenterYes),
    helipadYes: normalizeYesNo(row.helipadYes),
  }
}

export function normalizeIcs206FormState(form: Ics206FormState): Ics206FormState {
  const medicalAidStations =
    (form.medicalAidStations ?? []).length > 0
      ? form.medicalAidStations.map(normalizeMedicalAidStationRow)
      : createDefaultIcs206MedicalAidStationRows()
  const transportation =
    (form.transportation ?? []).length > 0
      ? form.transportation.map(normalizeTransportationRow)
      : createDefaultIcs206TransportationRows()
  const hospitals =
    (form.hospitals ?? []).length > 0
      ? form.hospitals.map(normalizeHospitalRow)
      : createDefaultIcs206HospitalRows()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    medicalAidStations,
    transportation,
    hospitals,
    specialMedicalEmergencyProcedures: String(form.specialMedicalEmergencyProcedures ?? ''),
    aviationAssetsUtilized: Boolean(form.aviationAssetsUtilized),
    preparedByName: String(form.preparedByName ?? ''),
    preparedBySignature: String(form.preparedBySignature ?? ''),
    preparedByDateTime: String(form.preparedByDateTime ?? ''),
    approvedByName: String(form.approvedByName ?? ''),
    approvedBySignature: String(form.approvedBySignature ?? ''),
    approvedByDateTime: String(form.approvedByDateTime ?? ''),
  }
}

export function mapIcs206VersionRow(row: Ics206VersionRow): Ics206Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs206FormState(normalizeIcs206FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs206Form(
  id: string,
  partial?: Partial<Ics206FormState>
): Ics206FormState {
  return normalizeIcs206FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    medicalAidStations: partial?.medicalAidStations ?? createDefaultIcs206MedicalAidStationRows(),
    transportation: partial?.transportation ?? createDefaultIcs206TransportationRows(),
    hospitals: partial?.hospitals ?? createDefaultIcs206HospitalRows(),
    specialMedicalEmergencyProcedures: partial?.specialMedicalEmergencyProcedures ?? '',
    aviationAssetsUtilized: partial?.aviationAssetsUtilized ?? false,
    preparedByName: partial?.preparedByName ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedByDateTime: partial?.preparedByDateTime ?? '',
    approvedByName: partial?.approvedByName ?? '',
    approvedBySignature: partial?.approvedBySignature ?? '',
    approvedByDateTime: partial?.approvedByDateTime ?? '',
  })
}

export function createLocalIcs206DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics206AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(documentId: string, form: Ics206FormState): Ics206FormState {
  return cloneIcs206FormState({ ...normalizeIcs206FormState(form), id: documentId })
}

export function extractIcs206IncidentInfoDraft(form: Ics206FormState): Ics206IncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs206SpecialProceduresDraft(form: Ics206FormState): Ics206SpecialProceduresDraft {
  return {
    specialMedicalEmergencyProcedures: form.specialMedicalEmergencyProcedures,
    aviationAssetsUtilized: form.aviationAssetsUtilized,
  }
}

export function extractIcs206PreparedByDraft(form: Ics206FormState): Ics206PreparedByDraft {
  return {
    preparedByName: form.preparedByName,
    preparedBySignature: form.preparedBySignature,
    preparedByDateTime: form.preparedByDateTime,
  }
}

export function extractIcs206ApprovedByDraft(form: Ics206FormState): Ics206ApprovedByDraft {
  return {
    approvedByName: form.approvedByName,
    approvedBySignature: form.approvedBySignature,
    approvedByDateTime: form.approvedByDateTime,
  }
}

export function extractIcs206SectionDraft(
  form: Ics206FormState,
  section: Ics206SectionId
): Ics206FormSectionDrafts[Ics206SectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs206IncidentInfoDraft(form)
    case 'medical-aid-stations':
      return cloneIcs206MedicalAidStationRows(form.medicalAidStations)
    case 'transportation':
      return cloneIcs206TransportationRows(form.transportation)
    case 'hospitals':
      return cloneIcs206HospitalRows(form.hospitals)
    case 'special-medical-emergency-procedures':
      return extractIcs206SpecialProceduresDraft(form)
    case 'prepared-by':
      return extractIcs206PreparedByDraft(form)
    case 'approved-by':
      return extractIcs206ApprovedByDraft(form)
    default:
      return undefined
  }
}

export function applyIcs206SectionDraft(
  form: Ics206FormState,
  section: Ics206SectionId,
  draft: Ics206FormSectionDrafts[Ics206SectionId]
): Ics206FormState {
  switch (section) {
    case 'incident-info':
      return { ...form, ...(draft as Ics206IncidentInfoDraft) }
    case 'medical-aid-stations':
      return {
        ...form,
        medicalAidStations: cloneIcs206MedicalAidStationRows(draft as Ics206MedicalAidStationRow[]),
      }
    case 'transportation':
      return {
        ...form,
        transportation: cloneIcs206TransportationRows(draft as Ics206TransportationRow[]),
      }
    case 'hospitals':
      return {
        ...form,
        hospitals: cloneIcs206HospitalRows(draft as Ics206HospitalRow[]),
      }
    case 'special-medical-emergency-procedures':
      return { ...form, ...(draft as Ics206SpecialProceduresDraft) }
    case 'prepared-by':
      return { ...form, ...(draft as Ics206PreparedByDraft) }
    case 'approved-by':
      return { ...form, ...(draft as Ics206ApprovedByDraft) }
    default:
      return form
  }
}

export function getIcs206FormForExport(
  form: Ics206FormState,
  sectionDrafts: Ics206FormSectionDrafts
): Ics206FormState {
  let exportForm = cloneIcs206FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics206SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs206SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function formatIcs206YesNo(value: Ics206YesNo): string {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return ''
}
