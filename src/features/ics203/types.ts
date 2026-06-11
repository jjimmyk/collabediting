import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics203AgencyRepresentativeRow = {
  id: number
  agencyOrganization: string
  representativeName: string
}

export type Ics203DivisionGroupRow = {
  id: number
  identifier: string
  supervisorName: string
}

export type Ics203OperationsBranch = {
  id: number
  branchDirector: string
  deputy: string
  divisionGroups: Ics203DivisionGroupRow[]
}

export type Ics203FormState = {
  id: string
  incidentName: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  icUcs: string
  commandDeputy: string
  safetyOfficer: string
  publicInformationOfficer: string
  liaisonOfficer: string
  agencyRepresentatives: Ics203AgencyRepresentativeRow[]
  planningChief: string
  planningDeputy: string
  resourcesUnit: string
  situationUnit: string
  documentationUnit: string
  demobilizationUnit: string
  technicalSpecialists: string
  planningDivisionGroups: Ics203DivisionGroupRow[]
  logisticsChief: string
  logisticsDeputy: string
  supportBranchDirector: string
  supplyUnit: string
  facilitiesUnit: string
  groundSupportUnit: string
  serviceBranchDirector: string
  communicationsUnit: string
  medicalUnit: string
  foodUnit: string
  airOperationsBranch: string
  airOpsBranchDirector: string
  logisticsDivisionGroups: Ics203DivisionGroupRow[]
  operationsChief: string
  operationsDeputy: string
  stagingArea: string
  operationsBranches: Ics203OperationsBranch[]
  operationsAirOperationsBranch: string
  operationsAirOpsBranchDirector: string
  financeChief: string
  financeDeputy: string
  timeUnit: string
  procurementUnit: string
  compensationClaimsUnit: string
  costUnit: string
  preparedByName: string
  preparedByPositionTitle: string
  preparedBySignature: string
  preparedDateTime: string
}

export type Ics203Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics203FormState
  signatures: Ics201VersionSignature[]
}

export type Ics203DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics203FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics203VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics203FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics203DocumentBundle = {
  document: Ics203DocumentRow
  versions: Ics203Version[]
}

export type Ics203SectionId =
  | 'incident-info'
  | 'command-staff'
  | 'agency-representatives'
  | 'planning-section'
  | 'logistics-section'
  | 'operations-section'
  | 'finance-section'
  | 'prepared-by'

export type Ics203IncidentInfoDraft = Pick<
  Ics203FormState,
  'incidentName' | 'operationalPeriodFrom' | 'operationalPeriodTo'
>

export type Ics203CommandStaffDraft = Pick<
  Ics203FormState,
  | 'icUcs'
  | 'commandDeputy'
  | 'safetyOfficer'
  | 'publicInformationOfficer'
  | 'liaisonOfficer'
>

export type Ics203PlanningSectionDraft = Pick<
  Ics203FormState,
  | 'planningChief'
  | 'planningDeputy'
  | 'resourcesUnit'
  | 'situationUnit'
  | 'documentationUnit'
  | 'demobilizationUnit'
  | 'technicalSpecialists'
  | 'planningDivisionGroups'
>

export type Ics203LogisticsSectionDraft = Pick<
  Ics203FormState,
  | 'logisticsChief'
  | 'logisticsDeputy'
  | 'supportBranchDirector'
  | 'supplyUnit'
  | 'facilitiesUnit'
  | 'groundSupportUnit'
  | 'serviceBranchDirector'
  | 'communicationsUnit'
  | 'medicalUnit'
  | 'foodUnit'
  | 'airOperationsBranch'
  | 'airOpsBranchDirector'
  | 'logisticsDivisionGroups'
>

export type Ics203OperationsSectionDraft = Pick<
  Ics203FormState,
  | 'operationsChief'
  | 'operationsDeputy'
  | 'stagingArea'
  | 'operationsBranches'
  | 'operationsAirOperationsBranch'
  | 'operationsAirOpsBranchDirector'
>

export type Ics203FinanceSectionDraft = Pick<
  Ics203FormState,
  | 'financeChief'
  | 'financeDeputy'
  | 'timeUnit'
  | 'procurementUnit'
  | 'compensationClaimsUnit'
  | 'costUnit'
>

export type Ics203PreparedByDraft = Pick<
  Ics203FormState,
  'preparedByName' | 'preparedByPositionTitle' | 'preparedBySignature' | 'preparedDateTime'
>

export type Ics203FormSectionDrafts = {
  'incident-info'?: Ics203IncidentInfoDraft
  'command-staff'?: Ics203CommandStaffDraft
  'agency-representatives'?: Ics203AgencyRepresentativeRow[]
  'planning-section'?: Ics203PlanningSectionDraft
  'logistics-section'?: Ics203LogisticsSectionDraft
  'operations-section'?: Ics203OperationsSectionDraft
  'finance-section'?: Ics203FinanceSectionDraft
  'prepared-by'?: Ics203PreparedByDraft
}
