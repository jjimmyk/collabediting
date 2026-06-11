import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import {
  ICS208HM_DEFAULT_ENTRY_TEAM_COUNT,
  ICS208HM_DEFAULT_MATERIAL_COUNT,
} from '@/features/ics208hm/constants'
import type {
  Ics208hmDecontaminationProceduresDraft,
  Ics208hmEntryTeamRow,
  Ics208hmFormSectionDrafts,
  Ics208hmFormState,
  Ics208hmHazardMonitoringDraft,
  Ics208hmIncidentInfoDraft,
  Ics208hmMaterialRow,
  Ics208hmMedicalAssistanceDraft,
  Ics208hmOrganizationAssignments,
  Ics208hmOrganizationDraft,
  Ics208hmSafetyBriefingDraft,
  Ics208hmSectionId,
  Ics208hmSiteCommunicationsDraft,
  Ics208hmSiteInformationDraft,
  Ics208hmSiteMapDraft,
  Ics208hmSiteMapIncludes,
  Ics208hmSopSafeWorkPracticesDraft,
  Ics208hmVersion,
  Ics208hmVersionRow,
  Ics208hmYesNo,
} from '@/features/ics208hm/types'

function normalizeYesNo(value: unknown): Ics208hmYesNo {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized === 'yes') return 'yes'
  if (normalized === 'no') return 'no'
  return ''
}

function normalizeOrganization(
  org: Partial<Ics208hmOrganizationAssignments> | undefined
): Ics208hmOrganizationAssignments {
  return {
    incidentCommander: String(org?.incidentCommander ?? ''),
    hmGroupSupervisor: String(org?.hmGroupSupervisor ?? ''),
    techSpecialistHmReference: String(org?.techSpecialistHmReference ?? ''),
    safetyOfficer: String(org?.safetyOfficer ?? ''),
    entryLeader: String(org?.entryLeader ?? ''),
    siteAccessControlLeader: String(org?.siteAccessControlLeader ?? ''),
    asstSafetyOfficerHm: String(org?.asstSafetyOfficerHm ?? ''),
    decontaminationLeader: String(org?.decontaminationLeader ?? ''),
    safeRefugeAreaMgr: String(org?.safeRefugeAreaMgr ?? ''),
    environmentalHealth: String(org?.environmentalHealth ?? ''),
    orgFunction15: String(org?.orgFunction15 ?? ''),
    orgFunction16: String(org?.orgFunction16 ?? ''),
  }
}

function normalizeEntryTeamRow(row: Ics208hmEntryTeamRow, index: number): Ics208hmEntryTeamRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    entryName: String(row.entryName ?? ''),
    entryPpeLevel: String(row.entryPpeLevel ?? ''),
    deconName: String(row.deconName ?? ''),
    deconPpeLevel: String(row.deconPpeLevel ?? ''),
  }
}

function normalizeMaterialRow(row: Ics208hmMaterialRow, index: number): Ics208hmMaterialRow {
  return {
    id: typeof row.id === 'number' ? row.id : index + 1,
    material: String(row.material ?? ''),
    containerType: String(row.containerType ?? ''),
    qty: String(row.qty ?? ''),
    physState: String(row.physState ?? ''),
    ph: String(row.ph ?? ''),
    idlh: String(row.idlh ?? ''),
    fp: String(row.fp ?? ''),
    it: String(row.it ?? ''),
    vp: String(row.vp ?? ''),
    vd: String(row.vd ?? ''),
    sg: String(row.sg ?? ''),
    lel: String(row.lel ?? ''),
    uel: String(row.uel ?? ''),
    comment: String(row.comment ?? ''),
  }
}

function normalizeSiteMapIncludes(
  includes: Partial<Ics208hmSiteMapIncludes> | undefined
): Ics208hmSiteMapIncludes {
  return {
    weather: Boolean(includes?.weather),
    commandPost: Boolean(includes?.commandPost),
    zones: Boolean(includes?.zones),
    assemblyAreas: Boolean(includes?.assemblyAreas),
    escapeRoutes: Boolean(includes?.escapeRoutes),
    other: Boolean(includes?.other),
  }
}

export function cloneIcs208hmEntryTeamRows(rows: Ics208hmEntryTeamRow[]): Ics208hmEntryTeamRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs208hmMaterialRows(rows: Ics208hmMaterialRow[]): Ics208hmMaterialRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs208hmFormState(form: Ics208hmFormState): Ics208hmFormState {
  return {
    ...form,
    organization: { ...form.organization },
    entryTeam: cloneIcs208hmEntryTeamRows(form.entryTeam),
    materials: cloneIcs208hmMaterialRows(form.materials),
    siteMapIncludes: { ...form.siteMapIncludes },
  }
}

export function createDefaultIcs208hmEntryTeamRows(
  count = ICS208HM_DEFAULT_ENTRY_TEAM_COUNT
): Ics208hmEntryTeamRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    entryName: '',
    entryPpeLevel: '',
    deconName: '',
    deconPpeLevel: '',
  }))
}

export function createDefaultIcs208hmMaterialRows(
  count = ICS208HM_DEFAULT_MATERIAL_COUNT
): Ics208hmMaterialRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    material: '',
    containerType: '',
    qty: '',
    physState: '',
    ph: '',
    idlh: '',
    fp: '',
    it: '',
    vp: '',
    vd: '',
    sg: '',
    lel: '',
    uel: '',
    comment: '',
  }))
}

export function normalizeIcs208hmFormState(form: Ics208hmFormState): Ics208hmFormState {
  const entryTeam =
    (form.entryTeam ?? []).length > 0
      ? form.entryTeam.map(normalizeEntryTeamRow)
      : createDefaultIcs208hmEntryTeamRows()
  const materials =
    (form.materials ?? []).length > 0
      ? form.materials.map(normalizeMaterialRow)
      : createDefaultIcs208hmMaterialRows()

  return {
    ...form,
    incidentName: String(form.incidentName ?? ''),
    datePrepared: String(form.datePrepared ?? ''),
    operationalPeriodDateFrom: String(form.operationalPeriodDateFrom ?? ''),
    operationalPeriodDateTo: String(form.operationalPeriodDateTo ?? ''),
    operationalPeriodTimeFrom: String(form.operationalPeriodTimeFrom ?? ''),
    operationalPeriodTimeTo: String(form.operationalPeriodTimeTo ?? ''),
    incidentLocation: String(form.incidentLocation ?? ''),
    organization: normalizeOrganization(form.organization),
    entryTeam,
    materials,
    lelInstruments: String(form.lelInstruments ?? ''),
    o2Instruments: String(form.o2Instruments ?? ''),
    toxicityPpmInstruments: String(form.toxicityPpmInstruments ?? ''),
    radiologicalInstruments: String(form.radiologicalInstruments ?? ''),
    hazardMonitoringComment: String(form.hazardMonitoringComment ?? ''),
    standardDeconProceduresYesNo: normalizeYesNo(form.standardDeconProceduresYesNo),
    decontaminationProceduresComment: String(form.decontaminationProceduresComment ?? ''),
    commandFrequency: String(form.commandFrequency ?? ''),
    tacticalFrequency: String(form.tacticalFrequency ?? ''),
    entryFrequency: String(form.entryFrequency ?? ''),
    medicalMonitoringYesNo: normalizeYesNo(form.medicalMonitoringYesNo),
    medicalTreatmentTransportInPlaceYesNo: normalizeYesNo(
      form.medicalTreatmentTransportInPlaceYesNo
    ),
    medicalAssistanceComment: String(form.medicalAssistanceComment ?? ''),
    siteMap: String(form.siteMap ?? ''),
    siteMapIncludes: normalizeSiteMapIncludes(form.siteMapIncludes),
    entryObjectives: String(form.entryObjectives ?? ''),
    sopModificationsYesNo: normalizeYesNo(form.sopModificationsYesNo),
    sopModificationsComment: String(form.sopModificationsComment ?? ''),
    emergencyProcedures: String(form.emergencyProcedures ?? ''),
    asstSafetyOfficerHmSignature: String(form.asstSafetyOfficerHmSignature ?? ''),
    safetyBriefingCompletedTime: String(form.safetyBriefingCompletedTime ?? ''),
    hmGroupSupervisorSignature: String(form.hmGroupSupervisorSignature ?? ''),
    incidentCommanderSignature: String(form.incidentCommanderSignature ?? ''),
  }
}

export function mapIcs208hmVersionRow(row: Ics208hmVersionRow): Ics208hmVersion {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs208hmFormState(normalizeIcs208hmFormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs208hmForm(
  id: string,
  partial?: Partial<Ics208hmFormState>
): Ics208hmFormState {
  return normalizeIcs208hmFormState({
    id,
    incidentName: partial?.incidentName ?? '',
    datePrepared: partial?.datePrepared ?? '',
    operationalPeriodDateFrom: partial?.operationalPeriodDateFrom ?? '',
    operationalPeriodDateTo: partial?.operationalPeriodDateTo ?? '',
    operationalPeriodTimeFrom: partial?.operationalPeriodTimeFrom ?? '',
    operationalPeriodTimeTo: partial?.operationalPeriodTimeTo ?? '',
    incidentLocation: partial?.incidentLocation ?? '',
    organization: partial?.organization ?? normalizeOrganization(undefined),
    entryTeam: partial?.entryTeam ?? createDefaultIcs208hmEntryTeamRows(),
    materials: partial?.materials ?? createDefaultIcs208hmMaterialRows(),
    lelInstruments: partial?.lelInstruments ?? '',
    o2Instruments: partial?.o2Instruments ?? '',
    toxicityPpmInstruments: partial?.toxicityPpmInstruments ?? '',
    radiologicalInstruments: partial?.radiologicalInstruments ?? '',
    hazardMonitoringComment: partial?.hazardMonitoringComment ?? '',
    standardDeconProceduresYesNo: partial?.standardDeconProceduresYesNo ?? '',
    decontaminationProceduresComment: partial?.decontaminationProceduresComment ?? '',
    commandFrequency: partial?.commandFrequency ?? '',
    tacticalFrequency: partial?.tacticalFrequency ?? '',
    entryFrequency: partial?.entryFrequency ?? '',
    medicalMonitoringYesNo: partial?.medicalMonitoringYesNo ?? '',
    medicalTreatmentTransportInPlaceYesNo:
      partial?.medicalTreatmentTransportInPlaceYesNo ?? '',
    medicalAssistanceComment: partial?.medicalAssistanceComment ?? '',
    siteMap: partial?.siteMap ?? '',
    siteMapIncludes: partial?.siteMapIncludes ?? normalizeSiteMapIncludes(undefined),
    entryObjectives: partial?.entryObjectives ?? '',
    sopModificationsYesNo: partial?.sopModificationsYesNo ?? '',
    sopModificationsComment: partial?.sopModificationsComment ?? '',
    emergencyProcedures: partial?.emergencyProcedures ?? '',
    asstSafetyOfficerHmSignature: partial?.asstSafetyOfficerHmSignature ?? '',
    safetyBriefingCompletedTime: partial?.safetyBriefingCompletedTime ?? '',
    hmGroupSupervisorSignature: partial?.hmGroupSupervisorSignature ?? '',
    incidentCommanderSignature: partial?.incidentCommanderSignature ?? '',
  })
}

export function createLocalIcs208hmDocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics208hmAuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#16a34a'
}

export function formStateForDocument(
  documentId: string,
  form: Ics208hmFormState
): Ics208hmFormState {
  return cloneIcs208hmFormState({ ...normalizeIcs208hmFormState(form), id: documentId })
}

export function extractIcs208hmIncidentInfoDraft(form: Ics208hmFormState): Ics208hmIncidentInfoDraft {
  return {
    incidentName: form.incidentName,
    datePrepared: form.datePrepared,
    operationalPeriodDateFrom: form.operationalPeriodDateFrom,
    operationalPeriodDateTo: form.operationalPeriodDateTo,
    operationalPeriodTimeFrom: form.operationalPeriodTimeFrom,
    operationalPeriodTimeTo: form.operationalPeriodTimeTo,
  }
}

export function extractIcs208hmSiteInformationDraft(
  form: Ics208hmFormState
): Ics208hmSiteInformationDraft {
  return { incidentLocation: form.incidentLocation }
}

export function extractIcs208hmOrganizationDraft(form: Ics208hmFormState): Ics208hmOrganizationDraft {
  return {
    organization: { ...form.organization },
    entryTeam: cloneIcs208hmEntryTeamRows(form.entryTeam),
  }
}

export function extractIcs208hmHazardMonitoringDraft(
  form: Ics208hmFormState
): Ics208hmHazardMonitoringDraft {
  return {
    lelInstruments: form.lelInstruments,
    o2Instruments: form.o2Instruments,
    toxicityPpmInstruments: form.toxicityPpmInstruments,
    radiologicalInstruments: form.radiologicalInstruments,
    hazardMonitoringComment: form.hazardMonitoringComment,
  }
}

export function extractIcs208hmDecontaminationProceduresDraft(
  form: Ics208hmFormState
): Ics208hmDecontaminationProceduresDraft {
  return {
    standardDeconProceduresYesNo: form.standardDeconProceduresYesNo,
    decontaminationProceduresComment: form.decontaminationProceduresComment,
  }
}

export function extractIcs208hmSiteCommunicationsDraft(
  form: Ics208hmFormState
): Ics208hmSiteCommunicationsDraft {
  return {
    commandFrequency: form.commandFrequency,
    tacticalFrequency: form.tacticalFrequency,
    entryFrequency: form.entryFrequency,
  }
}

export function extractIcs208hmMedicalAssistanceDraft(
  form: Ics208hmFormState
): Ics208hmMedicalAssistanceDraft {
  return {
    medicalMonitoringYesNo: form.medicalMonitoringYesNo,
    medicalTreatmentTransportInPlaceYesNo: form.medicalTreatmentTransportInPlaceYesNo,
    medicalAssistanceComment: form.medicalAssistanceComment,
  }
}

export function extractIcs208hmSiteMapDraft(form: Ics208hmFormState): Ics208hmSiteMapDraft {
  return {
    siteMap: form.siteMap,
    siteMapIncludes: { ...form.siteMapIncludes },
  }
}

export function extractIcs208hmSopSafeWorkPracticesDraft(
  form: Ics208hmFormState
): Ics208hmSopSafeWorkPracticesDraft {
  return {
    sopModificationsYesNo: form.sopModificationsYesNo,
    sopModificationsComment: form.sopModificationsComment,
  }
}

export function extractIcs208hmSafetyBriefingDraft(
  form: Ics208hmFormState
): Ics208hmSafetyBriefingDraft {
  return {
    asstSafetyOfficerHmSignature: form.asstSafetyOfficerHmSignature,
    safetyBriefingCompletedTime: form.safetyBriefingCompletedTime,
    hmGroupSupervisorSignature: form.hmGroupSupervisorSignature,
    incidentCommanderSignature: form.incidentCommanderSignature,
  }
}

export function extractIcs208hmSectionDraft(
  form: Ics208hmFormState,
  section: Ics208hmSectionId
): Ics208hmFormSectionDrafts[Ics208hmSectionId] {
  switch (section) {
    case 'incident-info':
      return extractIcs208hmIncidentInfoDraft(form)
    case 'site-information':
      return extractIcs208hmSiteInformationDraft(form)
    case 'organization':
      return extractIcs208hmOrganizationDraft(form)
    case 'hazard-risk-analysis':
      return cloneIcs208hmMaterialRows(form.materials)
    case 'hazard-monitoring':
      return extractIcs208hmHazardMonitoringDraft(form)
    case 'decontamination-procedures':
      return extractIcs208hmDecontaminationProceduresDraft(form)
    case 'site-communications':
      return extractIcs208hmSiteCommunicationsDraft(form)
    case 'medical-assistance':
      return extractIcs208hmMedicalAssistanceDraft(form)
    case 'site-map':
      return extractIcs208hmSiteMapDraft(form)
    case 'entry-objectives':
      return { entryObjectives: form.entryObjectives }
    case 'sop-safe-work-practices':
      return extractIcs208hmSopSafeWorkPracticesDraft(form)
    case 'emergency-procedures':
      return { emergencyProcedures: form.emergencyProcedures }
    case 'safety-briefing':
      return extractIcs208hmSafetyBriefingDraft(form)
    default:
      return undefined
  }
}

export function applyIcs208hmSectionDraft(
  form: Ics208hmFormState,
  section: Ics208hmSectionId,
  draft: Ics208hmFormSectionDrafts[Ics208hmSectionId]
): Ics208hmFormState {
  switch (section) {
    case 'incident-info':
      return { ...form, ...(draft as Ics208hmIncidentInfoDraft) }
    case 'site-information':
      return { ...form, ...(draft as Ics208hmSiteInformationDraft) }
    case 'organization':
      return { ...form, ...(draft as Ics208hmOrganizationDraft) }
    case 'hazard-risk-analysis':
      return { ...form, materials: cloneIcs208hmMaterialRows(draft as Ics208hmMaterialRow[]) }
    case 'hazard-monitoring':
      return { ...form, ...(draft as Ics208hmHazardMonitoringDraft) }
    case 'decontamination-procedures':
      return { ...form, ...(draft as Ics208hmDecontaminationProceduresDraft) }
    case 'site-communications':
      return { ...form, ...(draft as Ics208hmSiteCommunicationsDraft) }
    case 'medical-assistance':
      return { ...form, ...(draft as Ics208hmMedicalAssistanceDraft) }
    case 'site-map':
      return { ...form, ...(draft as Ics208hmSiteMapDraft) }
    case 'entry-objectives':
      return { ...form, entryObjectives: (draft as { entryObjectives: string }).entryObjectives }
    case 'sop-safe-work-practices':
      return { ...form, ...(draft as Ics208hmSopSafeWorkPracticesDraft) }
    case 'emergency-procedures':
      return {
        ...form,
        emergencyProcedures: (draft as { emergencyProcedures: string }).emergencyProcedures,
      }
    case 'safety-briefing':
      return { ...form, ...(draft as Ics208hmSafetyBriefingDraft) }
    default:
      return form
  }
}

export function getIcs208hmFormForExport(
  form: Ics208hmFormState,
  sectionDrafts: Ics208hmFormSectionDrafts
): Ics208hmFormState {
  let exportForm = cloneIcs208hmFormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics208hmSectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs208hmSectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function formatIcs208hmYesNo(value: Ics208hmYesNo): string {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return ''
}

export function formatIcs208hmSiteMapIncludes(includes: Ics208hmSiteMapIncludes): string {
  const labels: string[] = []
  if (includes.weather) labels.push('Weather')
  if (includes.commandPost) labels.push('Command Post')
  if (includes.zones) labels.push('Zones')
  if (includes.assemblyAreas) labels.push('Assembly Areas')
  if (includes.escapeRoutes) labels.push('Escape Routes')
  if (includes.other) labels.push('Other')
  return labels.join(', ') || '—'
}
