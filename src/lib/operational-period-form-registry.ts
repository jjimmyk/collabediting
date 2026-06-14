export type OperationalPeriodFormKey =
  | 'ics201'
  | 'iap'
  | 'ics202'
  | 'ics203'
  | 'ics234'
  | 'ics215'
  | 'ics215a'
  | 'ics205'
  | 'ics205a'
  | 'ics206'
  | 'ics204'
  | 'ics233'
  | 'ics208'
  | 'ics208hm'
  | 'ics209'

export type OperationalPeriodFormRegistryEntry = {
  key: OperationalPeriodFormKey
  label: string
  tab: string
  documentsTable: string
  /** Omitted for row-based forms (ICS-233) that have no version history. */
  versionsTable?: string
  multipleDocuments: boolean
  /** Snapshot/clone uses rows_data instead of form_data + versions. */
  rowsBased?: boolean
  incidentOnly?: boolean
}

export const OPERATIONAL_PERIOD_FORM_REGISTRY: OperationalPeriodFormRegistryEntry[] = [
  {
    key: 'ics201',
    label: 'ICS-201 Incident Briefing',
    tab: 'briefing',
    documentsTable: 'ics201_documents',
    versionsTable: 'ics201_versions',
    multipleDocuments: false,
  },
  {
    key: 'iap',
    label: 'Incident Action Plan',
    tab: 'form-IAP',
    documentsTable: 'iap_documents',
    versionsTable: 'iap_versions',
    multipleDocuments: false,
    incidentOnly: true,
  },
  {
    key: 'ics202',
    label: 'ICS-202 Incident Objectives',
    tab: 'form-ICS-202',
    documentsTable: 'ics202_documents',
    versionsTable: 'ics202_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics203',
    label: 'ICS-203 Organization Assignment List',
    tab: 'form-ICS-203',
    documentsTable: 'ics203_documents',
    versionsTable: 'ics203_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics234',
    label: 'ICS-234 Work Analysis Matrix',
    tab: 'form-ICS-234',
    documentsTable: 'ics234_documents',
    versionsTable: 'ics234_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics215',
    label: 'ICS-215 Operational Planning Worksheet',
    tab: 'form-ICS-215',
    documentsTable: 'ics215_documents',
    versionsTable: 'ics215_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics215a',
    label: 'ICS-215A Safety Analysis',
    tab: 'form-ICS-215A',
    documentsTable: 'ics215a_documents',
    versionsTable: 'ics215a_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics205',
    label: 'ICS-205 Incident Radio Communications Plan',
    tab: 'form-ICS-205',
    documentsTable: 'ics205_documents',
    versionsTable: 'ics205_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics205a',
    label: 'ICS-205A Communications List',
    tab: 'form-ICS-205A',
    documentsTable: 'ics205a_documents',
    versionsTable: 'ics205a_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics206',
    label: 'ICS-206 Medical Plan',
    tab: 'form-ICS-206',
    documentsTable: 'ics206_documents',
    versionsTable: 'ics206_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics204',
    label: 'ICS-204 Assignment List',
    tab: 'form-ICS-204',
    documentsTable: 'ics204_documents',
    versionsTable: 'ics204_versions',
    multipleDocuments: true,
  },
  {
    key: 'ics233',
    label: 'ICS-233 Open Actions',
    tab: 'form-ICS-233',
    documentsTable: 'ics233_documents',
    multipleDocuments: false,
    rowsBased: true,
  },
  {
    key: 'ics208',
    label: 'ICS-208 Safety & Health Plan',
    tab: 'form-ICS-208',
    documentsTable: 'ics208_documents',
    versionsTable: 'ics208_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics208hm',
    label: 'ICS-208HM Site Safety & Control Plan',
    tab: 'form-ICS-208HM',
    documentsTable: 'ics208hm_documents',
    versionsTable: 'ics208hm_versions',
    multipleDocuments: false,
  },
  {
    key: 'ics209',
    label: 'ICS-209 Incident Status Summary',
    tab: 'form-ICS-209',
    documentsTable: 'ics209_documents',
    versionsTable: 'ics209_versions',
    multipleDocuments: false,
  },
]

export const OPERATIONAL_PERIOD_FORM_KEYS = OPERATIONAL_PERIOD_FORM_REGISTRY.map(
  (entry) => entry.key
)

export function isOperationalPeriodFormTab(tab: string): boolean {
  return OPERATIONAL_PERIOD_FORM_REGISTRY.some((entry) => entry.tab === tab)
}

export function getOperationalPeriodFormLabel(formKey: OperationalPeriodFormKey): string {
  return (
    OPERATIONAL_PERIOD_FORM_REGISTRY.find((entry) => entry.key === formKey)?.label ?? formKey
  )
}
