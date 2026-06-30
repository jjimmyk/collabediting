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

export const ICS201_SECTION_LABELS: Record<Ics201SectionId, string> = {
  'report-info': 'Report Identification',
  'incident-briefing': 'ICS-201 Incident Briefing',
  'map-sketch': 'Map Sketch',
  'current-situation': 'Current Situation',
  objectives: 'Objectives',
  actions: 'Actions',
  'org-chart': 'Organization Chart',
  resources: 'Resources Summary',
  'safety-analysis': 'Safety Analysis',
}

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
    'Draft a set of priority actions for the current operational period with task, owner (ICS role), start time, and end time. Align each action to one of the ICS-201 objectives and the current operational tempo.',
  'org-chart':
    'Populate the ICS-201 Organization Chart (Incident Commander, Operations, Planning, Logistics, Finance/Admin Section Chiefs, Public Information Officer, Safety Officer, Liaison Officer) using the current roster and the latest staffing assignments.',
  resources:
    'Draft a Resources Summary for the ICS-201 (category, identifier, quantity, status, assignment) drawn from the resources currently checked in or ordered for this incident.',
  'safety-analysis':
    'Draft the ICS-201 Safety Analysis (hazard, mitigation, PPE, medical plan) covering the top operational hazards for the current operational period, drawing from the situation summary, weather, and any prior safety analyses.',
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
        task: 'Deploy barricade teams to South Connector choke points.',
        owner: 'Operations Branch I',
        startTime: '2026-04-25 16:30 UTC',
        endTime: '2026-04-25 20:30 UTC',
        status: 'In Progress',
      },
      {
        id: 2,
        task: 'Coordinate utility assessment sweep for North Levee Sector.',
        owner: 'Infrastructure Group',
        startTime: '2026-04-25 17:00 UTC',
        endTime: '2026-04-25 22:00 UTC',
        status: 'Planned',
      },
    ],
    orgChart: {
      incidentCommander: 'R. Morgan',
      operationsSectionChief: 'T. Hale',
      planningSectionChief: 'A. Rivera',
      logisticsSectionChief: 'J. Nguyen',
      financeSectionChief: 'D. Ortiz',
      publicInformationOfficer: 'M. Wells',
      safetyOfficer: 'K. Simmons',
      liaisonOfficer: 'R. Patel',
    },
    resources: [
      {
        id: 1,
        category: 'USAR',
        identifier: 'Urban Search Team Alpha',
        quantity: '2',
        status: 'Assigned',
        assignment: 'North Levee Sector',
      },
      {
        id: 2,
        category: 'Medical',
        identifier: 'Medical Strike Team',
        quantity: '1',
        status: 'Available',
        assignment: 'South Aid Station',
      },
    ],
    safetyAnalysis: [
      {
        id: 1,
        hazard: 'Flooded roadways and unseen washouts',
        mitigation: 'Use spotters; enforce route checks before convoy movement',
        ppe: 'High-visibility PPE and water-resistant boots',
        medicalPlan: 'Nearest treatment: Central Medical Corridor',
      },
      {
        id: 2,
        hazard: 'Downed power infrastructure',
        mitigation: 'Maintain exclusion zones and utility escort procedures',
        ppe: 'Electrical hazard gloves and insulated tools',
        medicalPlan: 'EMS support staged at Grid N-4',
      },
    ],
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
