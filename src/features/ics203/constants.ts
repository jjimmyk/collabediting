import type { Ics203SectionId } from '@/features/ics203/types'

export const ICS203_SECTION_LABELS: Record<Ics203SectionId, string> = {
  'incident-info': 'Incident Information',
  'command-staff': 'Incident Commander(s) and Command Staff',
  'agency-representatives': 'Agency/Organization Representatives',
  'planning-section': 'Planning Section',
  'logistics-section': 'Logistics Section',
  'operations-section': 'Operations Section',
  'finance-section': 'Finance/Administration Section',
  'prepared-by': 'Prepared By',
}

export const ICS203_SECTION_PROMPTS: Record<Ics203SectionId, string> = {
  'incident-info':
    'Draft ICS-203 incident name and operational period (date/time from and to) for the current workspace.',
  'command-staff':
    'Draft ICS-203 Command Staff assignments: IC/UCs, Deputy, Safety Officer, Public Information Officer, and Liaison Officer.',
  'agency-representatives':
    'Draft agency/organization representatives with agency name and representative name for each entry.',
  'planning-section':
    'Draft Planning Section positions (Chief, Deputy, unit leaders, technical specialists) and any division/group supervisors.',
  'logistics-section':
    'Draft Logistics Section positions including branch directors, unit leaders, and air operations assignments.',
  'operations-section':
    'Draft Operations Section positions including branches, division/group supervisors, staging area, and air operations.',
  'finance-section':
    'Draft Finance/Administration Section Chief, Deputy, and unit leader assignments.',
  'prepared-by':
    'Draft the Prepared By block with name, position/title, and date/time prepared.',
}

export const ICS203_COMMAND_STAFF_FIELDS = [
  ['IC/UCs', 'icUcs'],
  ['Deputy', 'commandDeputy'],
  ['Safety Officer', 'safetyOfficer'],
  ['Public Information Officer', 'publicInformationOfficer'],
  ['Liaison Officer', 'liaisonOfficer'],
] as const

export const ICS203_PLANNING_UNIT_FIELDS = [
  ['Chief', 'planningChief'],
  ['Deputy', 'planningDeputy'],
  ['Resources Unit', 'resourcesUnit'],
  ['Situation Unit', 'situationUnit'],
  ['Documentation Unit', 'documentationUnit'],
  ['Demobilization Unit', 'demobilizationUnit'],
  ['Technical Specialists', 'technicalSpecialists'],
] as const

export const ICS203_LOGISTICS_UNIT_FIELDS = [
  ['Chief', 'logisticsChief'],
  ['Deputy', 'logisticsDeputy'],
  ['Support Branch Director', 'supportBranchDirector'],
  ['Supply Unit', 'supplyUnit'],
  ['Facilities Unit', 'facilitiesUnit'],
  ['Ground Support Unit', 'groundSupportUnit'],
  ['Service Branch Director', 'serviceBranchDirector'],
  ['Communications Unit', 'communicationsUnit'],
  ['Medical Unit', 'medicalUnit'],
  ['Food Unit', 'foodUnit'],
  ['Air Operations Branch', 'airOperationsBranch'],
  ['Air Ops Branch Director', 'airOpsBranchDirector'],
] as const

export const ICS203_OPERATIONS_TOP_FIELDS = [
  ['Chief', 'operationsChief'],
  ['Deputy', 'operationsDeputy'],
  ['Staging Area', 'stagingArea'],
  ['Air Operations Branch', 'operationsAirOperationsBranch'],
  ['Air Ops Branch Director', 'operationsAirOpsBranchDirector'],
] as const

export const ICS203_FINANCE_UNIT_FIELDS = [
  ['Chief', 'financeChief'],
  ['Deputy', 'financeDeputy'],
  ['Time Unit', 'timeUnit'],
  ['Procurement Unit', 'procurementUnit'],
  ['Compensation/Claims Unit', 'compensationClaimsUnit'],
  ['Cost Unit', 'costUnit'],
] as const
