import type { Ics201SectionId } from './types'

export const ICS201_BOX_LABELS = {
  reportInfo: 'Report Identification',
  incidentName: '1. Incident Name',
  incidentLocation: '2. Incident Location',
  dateTimeInitiated: '3. Date / Time Initiated',
  mapSketch:
    '4. Map/Sketch: (include sketch, showing the total area of operations, the incident site/area, overflight results, trajectories, impacted shorelines, or other graphics depicting situational and response status)',
  currentSituation: '5. Current Situation',
  objectives: '6. Initial Response Objectives',
  actions: '7. Initial Response Objectives, Current Actions, Planned Actions',
  orgChart: '9. Current Organization: (fill in additional appropriate organization)',
  resources: '11. Resources Summary',
  safetyAnalysis: '13. Safety Analysis',
  hazmatAssessment: '15. Hazardous Material (HAZMAT) Assessment',
} as const

export const ICS201_SAFETY_13_SUBLABELS = {
  A: 'A. Safety Officer',
  B: 'B. Known Hazards',
  C: 'C. Weather Conditions',
  D: 'D. Safety Notes',
  E: 'E. Required Personal Protective Equipment (PPE)',
  F: 'F. Does the Incident involve Hazardous Materials (HAZMAT)?',
} as const

export const ICS201_HAZMAT_15_SUBLABELS = {
  A: 'A. HAZMAT Classification',
  B: 'B. Product or Material Description',
  C: 'C. Potential Hazards',
  D: 'D. Does the incident require a need for any of the following?',
  E: 'E. Air Monitoring Required',
  F: 'F. Standard Operating Procedures (SOP) and Safe Work Practices',
  G: 'G. Decontamination Procedures',
  H: 'H. Medical',
  I: 'I. Emergency Procedures',
} as const

export const ICS201_RESOURCE_COLUMN_LABELS = {
  resource: 'Resource',
  resourceIdentifier: 'Resource Identifier',
  dateTimeOrdered: 'Date / Time Ordered',
  eta: 'ETA',
  onScene: 'On Scene',
  notes: 'Notes (location, assignment, status)',
} as const

export const ICS201_ACTION_COLUMN_LABELS = {
  time: 'Time',
  action: 'Actions',
} as const

export const ICS201_WEATHER_FIELD_LABELS = {
  temp: 'Temp',
  conditions: 'Conditions',
  wind: 'Wind',
  tides: 'Tides',
  seaState: 'Sea State',
  waterTemp: 'Water Temp',
  forecast: 'Forecast',
} as const

export const ICS201_HAZMAT_PRODUCT_COLUMN_LABELS = {
  material: 'Material',
  qty: 'Qty',
  physState: 'Phys State',
  niosh: 'NIOSH#',
  specificGravity: 'Specific Gravity',
  ph: 'pH',
  idlh: 'IDLH',
  flashPoint: 'Flash Point',
  lel: 'LEL',
  uel: 'UEL',
} as const

export const ICS201_SECTION_BOX_LABELS: Record<Ics201SectionId, string> = {
  'report-info': ICS201_BOX_LABELS.reportInfo,
  'incident-briefing': 'Document Metadata',
  'map-sketch': ICS201_BOX_LABELS.mapSketch,
  'current-situation': ICS201_BOX_LABELS.currentSituation,
  objectives: ICS201_BOX_LABELS.objectives,
  actions: ICS201_BOX_LABELS.actions,
  'org-chart': ICS201_BOX_LABELS.orgChart,
  resources: ICS201_BOX_LABELS.resources,
  'safety-analysis': ICS201_BOX_LABELS.safetyAnalysis,
  'hazmat-assessment': ICS201_BOX_LABELS.hazmatAssessment,
}
