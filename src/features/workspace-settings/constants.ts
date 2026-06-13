export const INCIDENT_CATEGORY_OPTIONS = [
  'Refinery Operations',
  'Pipeline / Hazmat',
  'Severe Weather',
  'Exercise',
] as const

export const INCIDENT_WORKFLOW_OPTIONS = [
  { value: 'ipieca-ims', label: 'IPIECA IMS' },
  { value: 'uscg-ics', label: 'United States Coast Guard ICS' },
  { value: 'epa-ics', label: 'Environmental Protection Agency ICS' },
  { value: 'bsee-ics', label: 'Bureau of Safety and Environmental Enforcement ICS' },
  { value: 'california-ics', label: 'California ICS' },
  { value: 'washington-ics', label: 'Washington ICS' },
  { value: 'phmsa-ics', label: 'Pipeline and Hazardous Materials Safety Administration ICS' },
] as const

export const INCIDENT_TEMPLATE_OPTIONS = [
  {
    id: 'utility-restoration',
    label: 'Utility Restoration',
    previewItems: ['Power restoration staging', 'Substation assessment', 'Crew dispatch plan'],
  },
  {
    id: 'mass-care',
    label: 'Mass Care',
    previewItems: ['Shelter activation', 'Medical support coordination', 'Supply distribution'],
  },
  {
    id: 'evacuation',
    label: 'Evacuation',
    previewItems: ['Zone definition', 'Route control plan', 'Public notification sequence'],
  },
] as const
