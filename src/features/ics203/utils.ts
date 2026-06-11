import { ics201AuthorColorFromId } from '@/features/ics201/utils'
import type {
  Ics203AgencyRepresentativeRow,
  Ics203DivisionGroupRow,
  Ics203FormSectionDrafts,
  Ics203FormState,
  Ics203OperationsBranch,
  Ics203SectionId,
  Ics203Version,
  Ics203VersionRow,
} from '@/features/ics203/types'

export function cloneIcs203DivisionGroups(rows: Ics203DivisionGroupRow[]): Ics203DivisionGroupRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs203AgencyRows(
  rows: Ics203AgencyRepresentativeRow[]
): Ics203AgencyRepresentativeRow[] {
  return rows.map((row) => ({ ...row }))
}

export function cloneIcs203OperationsBranches(
  branches: Ics203OperationsBranch[]
): Ics203OperationsBranch[] {
  return branches.map((branch) => ({
    ...branch,
    divisionGroups: cloneIcs203DivisionGroups(branch.divisionGroups),
  }))
}

export function cloneIcs203FormState(form: Ics203FormState): Ics203FormState {
  return {
    ...form,
    agencyRepresentatives: cloneIcs203AgencyRows(form.agencyRepresentatives),
    planningDivisionGroups: cloneIcs203DivisionGroups(form.planningDivisionGroups),
    logisticsDivisionGroups: cloneIcs203DivisionGroups(form.logisticsDivisionGroups),
    operationsBranches: cloneIcs203OperationsBranches(form.operationsBranches),
  }
}

function normalizeDivisionGroups(rows: Ics203DivisionGroupRow[] | undefined): Ics203DivisionGroupRow[] {
  return (rows ?? []).map((row, index) => ({
    id: typeof row.id === 'number' ? row.id : index + 1,
    identifier: String(row.identifier ?? ''),
    supervisorName: String(row.supervisorName ?? ''),
  }))
}

function normalizeAgencyRows(
  rows: Ics203AgencyRepresentativeRow[] | undefined
): Ics203AgencyRepresentativeRow[] {
  return (rows ?? []).map((row, index) => ({
    id: typeof row.id === 'number' ? row.id : index + 1,
    agencyOrganization: String(row.agencyOrganization ?? ''),
    representativeName: String(row.representativeName ?? ''),
  }))
}

function normalizeOperationsBranches(
  branches: Ics203OperationsBranch[] | undefined
): Ics203OperationsBranch[] {
  return (branches ?? []).map((branch, index) => ({
    id: typeof branch.id === 'number' ? branch.id : index + 1,
    branchDirector: String(branch.branchDirector ?? ''),
    deputy: String(branch.deputy ?? ''),
    divisionGroups: normalizeDivisionGroups(branch.divisionGroups),
  }))
}

export function normalizeIcs203FormState(form: Ics203FormState): Ics203FormState {
  return {
    ...form,
    agencyRepresentatives: normalizeAgencyRows(form.agencyRepresentatives),
    planningDivisionGroups: normalizeDivisionGroups(form.planningDivisionGroups),
    logisticsDivisionGroups: normalizeDivisionGroups(form.logisticsDivisionGroups),
    operationsBranches: normalizeOperationsBranches(form.operationsBranches),
  }
}

export function mapIcs203VersionRow(row: Ics203VersionRow): Ics203Version {
  return {
    id: row.id,
    createdAt: Date.parse(row.created_at),
    authorId: row.author_id,
    authorName: row.author_name,
    authorColor: row.author_color,
    snapshot: cloneIcs203FormState(normalizeIcs203FormState(row.snapshot)),
    signatures: Array.isArray(row.signatures) ? row.signatures : [],
  }
}

export function createEmptyIcs203Form(id: string, partial?: Partial<Ics203FormState>): Ics203FormState {
  return normalizeIcs203FormState({
    id,
    incidentName: partial?.incidentName ?? '',
    operationalPeriodFrom: partial?.operationalPeriodFrom ?? '',
    operationalPeriodTo: partial?.operationalPeriodTo ?? '',
    icUcs: partial?.icUcs ?? '',
    commandDeputy: partial?.commandDeputy ?? '',
    safetyOfficer: partial?.safetyOfficer ?? '',
    publicInformationOfficer: partial?.publicInformationOfficer ?? '',
    liaisonOfficer: partial?.liaisonOfficer ?? '',
    agencyRepresentatives: partial?.agencyRepresentatives ?? [],
    planningChief: partial?.planningChief ?? '',
    planningDeputy: partial?.planningDeputy ?? '',
    resourcesUnit: partial?.resourcesUnit ?? '',
    situationUnit: partial?.situationUnit ?? '',
    documentationUnit: partial?.documentationUnit ?? '',
    demobilizationUnit: partial?.demobilizationUnit ?? '',
    technicalSpecialists: partial?.technicalSpecialists ?? '',
    planningDivisionGroups: partial?.planningDivisionGroups ?? [],
    logisticsChief: partial?.logisticsChief ?? '',
    logisticsDeputy: partial?.logisticsDeputy ?? '',
    supportBranchDirector: partial?.supportBranchDirector ?? '',
    supplyUnit: partial?.supplyUnit ?? '',
    facilitiesUnit: partial?.facilitiesUnit ?? '',
    groundSupportUnit: partial?.groundSupportUnit ?? '',
    serviceBranchDirector: partial?.serviceBranchDirector ?? '',
    communicationsUnit: partial?.communicationsUnit ?? '',
    medicalUnit: partial?.medicalUnit ?? '',
    foodUnit: partial?.foodUnit ?? '',
    airOperationsBranch: partial?.airOperationsBranch ?? '',
    airOpsBranchDirector: partial?.airOpsBranchDirector ?? '',
    logisticsDivisionGroups: partial?.logisticsDivisionGroups ?? [],
    operationsChief: partial?.operationsChief ?? '',
    operationsDeputy: partial?.operationsDeputy ?? '',
    stagingArea: partial?.stagingArea ?? '',
    operationsBranches: partial?.operationsBranches ?? [],
    operationsAirOperationsBranch: partial?.operationsAirOperationsBranch ?? '',
    operationsAirOpsBranchDirector: partial?.operationsAirOpsBranchDirector ?? '',
    financeChief: partial?.financeChief ?? '',
    financeDeputy: partial?.financeDeputy ?? '',
    timeUnit: partial?.timeUnit ?? '',
    procurementUnit: partial?.procurementUnit ?? '',
    compensationClaimsUnit: partial?.compensationClaimsUnit ?? '',
    costUnit: partial?.costUnit ?? '',
    preparedByName: partial?.preparedByName ?? '',
    preparedByPositionTitle: partial?.preparedByPositionTitle ?? '',
    preparedBySignature: partial?.preparedBySignature ?? '',
    preparedDateTime: partial?.preparedDateTime ?? '',
  })
}

export function createLocalIcs203DocumentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function ics203AuthorColor(userId: string | null): string {
  return userId ? ics201AuthorColorFromId(userId) : '#0d9488'
}

export function formStateForDocument(documentId: string, form: Ics203FormState): Ics203FormState {
  return cloneIcs203FormState({ ...normalizeIcs203FormState(form), id: documentId })
}

export function extractIcs203SectionDraft(
  form: Ics203FormState,
  section: Ics203SectionId
): Ics203FormSectionDrafts[Ics203SectionId] {
  switch (section) {
    case 'incident-info':
      return {
        incidentName: form.incidentName,
        operationalPeriodFrom: form.operationalPeriodFrom,
        operationalPeriodTo: form.operationalPeriodTo,
      }
    case 'command-staff':
      return {
        icUcs: form.icUcs,
        commandDeputy: form.commandDeputy,
        safetyOfficer: form.safetyOfficer,
        publicInformationOfficer: form.publicInformationOfficer,
        liaisonOfficer: form.liaisonOfficer,
      }
    case 'agency-representatives':
      return cloneIcs203AgencyRows(form.agencyRepresentatives)
    case 'planning-section':
      return {
        planningChief: form.planningChief,
        planningDeputy: form.planningDeputy,
        resourcesUnit: form.resourcesUnit,
        situationUnit: form.situationUnit,
        documentationUnit: form.documentationUnit,
        demobilizationUnit: form.demobilizationUnit,
        technicalSpecialists: form.technicalSpecialists,
        planningDivisionGroups: cloneIcs203DivisionGroups(form.planningDivisionGroups),
      }
    case 'logistics-section':
      return {
        logisticsChief: form.logisticsChief,
        logisticsDeputy: form.logisticsDeputy,
        supportBranchDirector: form.supportBranchDirector,
        supplyUnit: form.supplyUnit,
        facilitiesUnit: form.facilitiesUnit,
        groundSupportUnit: form.groundSupportUnit,
        serviceBranchDirector: form.serviceBranchDirector,
        communicationsUnit: form.communicationsUnit,
        medicalUnit: form.medicalUnit,
        foodUnit: form.foodUnit,
        airOperationsBranch: form.airOperationsBranch,
        airOpsBranchDirector: form.airOpsBranchDirector,
        logisticsDivisionGroups: cloneIcs203DivisionGroups(form.logisticsDivisionGroups),
      }
    case 'operations-section':
      return {
        operationsChief: form.operationsChief,
        operationsDeputy: form.operationsDeputy,
        stagingArea: form.stagingArea,
        operationsBranches: cloneIcs203OperationsBranches(form.operationsBranches),
        operationsAirOperationsBranch: form.operationsAirOperationsBranch,
        operationsAirOpsBranchDirector: form.operationsAirOpsBranchDirector,
      }
    case 'finance-section':
      return {
        financeChief: form.financeChief,
        financeDeputy: form.financeDeputy,
        timeUnit: form.timeUnit,
        procurementUnit: form.procurementUnit,
        compensationClaimsUnit: form.compensationClaimsUnit,
        costUnit: form.costUnit,
      }
    case 'prepared-by':
      return {
        preparedByName: form.preparedByName,
        preparedByPositionTitle: form.preparedByPositionTitle,
        preparedBySignature: form.preparedBySignature,
        preparedDateTime: form.preparedDateTime,
      }
    default:
      return undefined
  }
}

export function applyIcs203SectionDraft(
  form: Ics203FormState,
  section: Ics203SectionId,
  draft: Ics203FormSectionDrafts[Ics203SectionId]
): Ics203FormState {
  switch (section) {
    case 'incident-info':
    case 'command-staff':
    case 'planning-section':
    case 'logistics-section':
    case 'operations-section':
    case 'finance-section':
    case 'prepared-by':
      return { ...form, ...(draft as object) }
    case 'agency-representatives':
      return {
        ...form,
        agencyRepresentatives: cloneIcs203AgencyRows(draft as Ics203AgencyRepresentativeRow[]),
      }
    default:
      return form
  }
}

export function getIcs203FormForExport(
  form: Ics203FormState,
  sectionDrafts: Ics203FormSectionDrafts
): Ics203FormState {
  let exportForm = cloneIcs203FormState(form)
  for (const section of Object.keys(sectionDrafts) as Ics203SectionId[]) {
    const draft = sectionDrafts[section]
    if (draft !== undefined) {
      exportForm = applyIcs203SectionDraft(exportForm, section, draft)
    }
  }
  return exportForm
}

export function nextRowId<T extends { id: number }>(rows: T[]): number {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}
