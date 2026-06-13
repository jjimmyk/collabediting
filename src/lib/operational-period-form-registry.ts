export type OperationalPeriodFormKey = 'ics201' | 'iap' | 'ics202' | 'ics203' | 'ics204'

export type OperationalPeriodFormRegistryEntry = {
  key: OperationalPeriodFormKey
  label: string
  tab: string
  documentsTable: string
  versionsTable: string
  multipleDocuments: boolean
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
    key: 'ics204',
    label: 'ICS-204 Assignment List',
    tab: 'form-ICS-204',
    documentsTable: 'ics204_documents',
    versionsTable: 'ics204_versions',
    multipleDocuments: true,
  },
]

export const OPERATIONAL_PERIOD_FORM_KEYS = OPERATIONAL_PERIOD_FORM_REGISTRY.map(
  (entry) => entry.key
)

export function isOperationalPeriodFormTab(tab: string): boolean {
  return OPERATIONAL_PERIOD_FORM_REGISTRY.some((entry) => entry.tab === tab)
}
