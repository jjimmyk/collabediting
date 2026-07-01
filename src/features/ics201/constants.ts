import { ICS201_SECTION_BOX_LABELS } from './field-labels'
import {
  createEmptyHazmatAssessmentBox15,
  createEmptySafetyAnalysisBox13,
} from './form-options'
import type {
  Ics201FormState,
  Ics201MapSketchVertex,
  Ics201ObjectiveKind,
  Ics201SectionId,
} from './types'

export const ICS201_OBJECTIVE_KIND_OPTIONS: ReadonlyArray<{
  value: Ics201ObjectiveKind
  label: string
}> = [
  { value: 'O', label: 'Operational' },
  { value: 'M', label: 'Managerial' },
  { value: 'O&M', label: 'Operational & Managerial' },
]

export const ICS201_OBJECTIVE_KIND_TOOLTIP =
  'Indicates whether an objective is operational (O), managerial (M), or operational and managerial (O&M).'

export function formatIcs201ObjectiveKindLabel(kind: Ics201ObjectiveKind): string {
  if (kind === 'O') return 'Operational'
  if (kind === 'M') return 'Managerial'
  if (kind === 'O&M') return 'Operational & Managerial'
  return ''
}

export const BASELINE_MAP_SKETCH_POLYGON: Ics201MapSketchVertex[] = [
  { longitude: -122.4115, latitude: 37.8096 },
  { longitude: -122.4071, latitude: 37.8096 },
  { longitude: -122.4071, latitude: 37.8074 },
  { longitude: -122.4115, latitude: 37.8074 },
]

export const ICS201_SECTION_LABELS: Record<Ics201SectionId, string> = ICS201_SECTION_BOX_LABELS

export const ICS201_SECTION_PROMPTS: Record<Ics201SectionId, string> = {
  'report-info':
    'Draft the Report Identification fields for the current ICS-201 (Incident Name, Incident Location, and Date/Time Initiated) using the latest incident data, current operational period, and prior versions for continuity.',
  'incident-briefing':
    'Draft the ICS-201 Incident Briefing header fields (Incident Name, Incident Number, Date/Time Prepared, Prepared By, Operational Period start/end, and Jurisdiction/Agency) using the latest incident metadata and the current operational period.',
  'map-sketch':
    'Propose a tightened incident perimeter polygon (5–8 vertices, WGS84 lat/lon) around the current area of operations using the latest situation summary, mapped resources, and any prior ICS-201 perimeter for reference.',
  'current-situation':
    'Write a concise Current Situation summary for the ICS-201 that reflects the latest incident posture, weather, status of life-safety operations, and impacts to the area of operations. Keep it within the 1,000-character strict-structure limit and avoid duplicating other sections.',
  objectives:
    'Draft a numbered set of SMART operational-period objectives for the ICS-201, aligned to the current Incident Commander priorities. Cover life safety, incident stabilization, property/environmental protection, and continuity of operations. Keep the combined text within the strict-structure character limit.',
  actions:
    'Draft Box 7 actions for the ICS-201 with time and action entries aligned to operational-period objectives.',
  'org-chart':
    'Populate the ICS-201 Organization Chart (Incident Commander, Operations, Planning, Logistics, Finance/Admin Section Chiefs, Public Information Officer, Safety Officer, Liaison Officer) using the current roster and the latest staffing assignments.',
  resources:
    'Draft Box 11 Resources Summary rows (resource, identifier, date/time ordered, ETA, on-scene status, notes) from checked-in or ordered incident resources.',
  'hazmat-assessment':
    'Draft Box 15 HAZMAT Assessment when Box 13.F is Yes, covering classification, product description, potential hazards, required procedures, air monitoring, SOP, decon, medical, and emergency procedures.',
  'safety-analysis':
    'Draft Box 13 Safety Analysis (safety officer, known hazards, weather, safety notes, required PPE, HAZMAT yes/no) for the current operational period.',
}

export function createInitialIcs201Form(): Ics201FormState {
  return {
    incidentName: 'Incident Alpha',
    incidentNumber: 'ALPHA-2026-001',
    incidentLocation: 'Pier 33, San Francisco, CA',
    dateInitiated: '2026-04-25',
    timeInitiated: '16:00',
    preparedDateTime: '2026-04-25 16:00 UTC',
    operationalPeriodStart: '2026-04-25T12:00',
    operationalPeriodEnd: '2026-04-26T00:00',
    jurisdiction: 'State Emergency Operations Center',
    preparedBy: 'Planning Section Chief',
    preparedByName: 'A. Rivera',
    preparedByPositionTitle: 'Planning Section Chief',
    preparedBySignature: 'A. Rivera',
    mapSketchPolygon: BASELINE_MAP_SKETCH_POLYGON.map((vertex) => ({ ...vertex })),
    currentSituationSummary: '',
    weatherForecast:
      'Next 12 hours: scattered thunderstorms, wind gusts 25-35 mph, localized flash-flood risk in low-lying corridors.',
    projectedIncidentCourse:
      'Expect sustained transportation and power disruptions through next operational period with elevated public safety messaging requirements.',
    objectives: [
      {
        id: 1,
        kind: 'O',
        objective: 'Protect life safety in high-risk flood corridors.',
      },
      {
        id: 2,
        kind: 'O',
        objective: 'Maintain access for emergency medical transport routes.',
      },
      {
        id: 3,
        kind: 'M',
        objective: 'Stabilize shelter operations and staffing coverage.',
      },
    ],
    actions: [
      {
        id: 1,
        time: '2026-04-25 16:30 UTC',
        action: 'Deploy barricade teams to South Connector choke points. (Operations Branch I)',
      },
      {
        id: 2,
        time: '2026-04-25 17:00 UTC',
        action: 'Coordinate utility assessment sweep for North Levee Sector. (Infrastructure Group)',
      },
    ],
    orgChart: {
      commandNames: ['R. Morgan', '', '', '', ''],
      operationsSectionChief: 'T. Hale',
      planningSectionChief: 'A. Rivera',
      logisticsSectionChief: 'J. Nguyen',
      financeSectionChief: 'D. Ortiz',
      publicInformationOfficer: 'M. Wells',
      safetyOfficer: 'K. Simmons',
      liaisonOfficer: 'R. Patel',
      intelInvestSectionChief: '',
    },
    resources: [
      {
        id: 1,
        resource: 'USAR',
        resourceIdentifier: 'Urban Search Team Alpha',
        dateTimeOrdered: '2026-04-25 14:00 UTC',
        eta: '2026-04-25 16:00 UTC',
        onScene: true,
        notes: 'Assigned — North Levee Sector',
      },
      {
        id: 2,
        resource: 'Medical',
        resourceIdentifier: 'Medical Strike Team',
        dateTimeOrdered: '2026-04-25 15:00 UTC',
        eta: '2026-04-25 16:30 UTC',
        onScene: false,
        notes: 'Available — South Aid Station',
      },
    ],
    schemaVersion: 2 as const,
    safetyAnalysisBox13: (() => {
      const box = createEmptySafetyAnalysisBox13('K. Simmons')
      box.safetyNotes = '1. Hazard: Flooded roadways and unseen washouts | Mitigation: Use spotters; enforce route checks before convoy movement | PPE: High-visibility PPE and water-resistant boots | Medical: Nearest treatment: Central Medical Corridor\n2. Hazard: Downed power infrastructure | Mitigation: Maintain exclusion zones and utility escort procedures | PPE: Electrical hazard gloves and insulated tools | Medical: EMS support staged at Grid N-4'
      box.weather.forecast = 'Next 12 hours: scattered thunderstorms, wind gusts 25-35 mph, localized flash-flood risk in low-lying corridors.'
      return box
    })(),
    hazmatAssessmentBox15: createEmptyHazmatAssessmentBox15(),
  }
}

export const MOCK_ICS201_COLLABORATORS = [
  {
    id: 'maya',
    email: 'maya.chen@example.com',
    name: 'Maya Chen',
    initials: 'MC',
    color: '#ef4444',
    position: 'Planning Section Chief',
  },
  {
    id: 'diego',
    email: 'diego.alvarez@example.com',
    name: 'Diego Alvarez',
    initials: 'DA',
    color: '#3b82f6',
    position: 'Operations Section Chief',
  },
] as const
