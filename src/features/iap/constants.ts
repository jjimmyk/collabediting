import type { IapFormChecklistItem, IapSectionId } from '@/features/iap/types'

export const IAP_SECTION_LABELS: Record<IapSectionId, string> = {
  'cover-sheet': '1–3. Incident Information',
  'incident-commanders': '4. Approved by Incident Commander(s)',
  'forms-checklist': '5. Forms and Documents',
}

export const IAP_DEFAULT_FORMS_CHECKLIST: IapFormChecklistItem[] = [
  { id: 'ics-202', label: 'ICS 202-CG (Incident Objectives)', included: false },
  { id: 'ics-203', label: 'ICS 203-CG (Organization List)', included: false },
  {
    id: 'ics-204',
    label: 'ICS 204-CG(s) (Assignment List)',
    included: false,
  },
  { id: 'ics-205', label: 'ICS 205-CG (Communications Plan)', included: false },
  { id: 'ics-206', label: 'ICS 206-CG (Medical Plan)', included: false },
  { id: 'ics-207', label: 'ICS 207-CG (Organization Chart)', included: false },
  { id: 'ics-208', label: 'ICS 208-CG (Safety Message)', included: false },
  { id: 'map-chart', label: 'Map / Chart', included: false },
  {
    id: 'weather',
    label: 'Weather Forecast / Tides / Currents',
    included: false,
  },
  { id: 'other-1', label: 'Other Attachment', included: false, customLabel: '' },
  { id: 'other-2', label: 'Other Attachment', included: false, customLabel: '' },
  { id: 'other-3', label: 'Other Attachment', included: false, customLabel: '' },
]
