import type { SitrepFormState, SitrepSection } from './types'

export const SITREP_SECTIONS_AOR: { id: SitrepSection; label: string }[] = [
  { id: 'executive-summary', label: 'Executive Summary' },
  { id: 'ongoing-incidents', label: 'Ongoing Incidents' },
  { id: 'readiness-assessment', label: 'Readiness Assessment' },
  { id: 'risk-to-mission', label: 'Risk to Mission' },
  { id: 'outstanding-rfi-rfr', label: 'Outstanding RFI/RFR' },
  { id: 'previous-critical-incident-comms', label: 'Previous Critical Incident Communications' },
  { id: 'general-comments', label: 'General Comments' },
  { id: 'imagery', label: 'Imagery' },
]

export const SITREP_SECTIONS_WORKSPACE: { id: SitrepSection; label: string }[] =
  SITREP_SECTIONS_AOR.filter((section) => section.id !== 'ongoing-incidents')

export const SITREP_AI_COMPATIBLE_SECTIONS: SitrepSection[] = [
  'executive-summary',
  'readiness-assessment',
  'risk-to-mission',
  'outstanding-rfi-rfr',
  'previous-critical-incident-comms',
  'general-comments',
]

export const SITREP_SECTION_PRIMARY: Record<
  SitrepSection,
  { field: keyof SitrepFormState; label: string }
> = {
  'executive-summary': { field: 'executiveSummary', label: 'Executive Summary' },
  'ongoing-incidents': { field: 'generalComments', label: 'Ongoing Incidents' },
  'readiness-assessment': { field: 'readinessAssessment', label: 'Readiness Assessment' },
  'risk-to-mission': { field: 'riskToMission', label: 'Risk to Mission' },
  'outstanding-rfi-rfr': { field: 'outstandingRfiRfr', label: 'Outstanding RFI/RFR' },
  'previous-critical-incident-comms': {
    field: 'previousCriticalIncidentComms',
    label: 'Previous Critical Incident Communications',
  },
  'general-comments': { field: 'generalComments', label: 'General Comments' },
  imagery: { field: 'imageryNotes', label: 'Imagery' },
}

export function createInitialSitrepForm(): SitrepFormState {
  return {
    reportNumber: 'SITREP-2026-014',
    preparedDateTime: '2026-04-25 18:00 UTC',
    reportingPeriodStart: '2026-04-25 06:00 UTC',
    reportingPeriodEnd: '2026-04-25 18:00 UTC',
    incidentName: 'Incident Alpha',
    incidentLocation: 'North Levee Sector / Districts 4 & 7',
    preparedBy: 'Planning Section Chief',
    agency: 'State Emergency Operations Center',
    sectorLno: 'Sector North-1 • LNO: M. Wells (State EOC) • Backup LNO: R. Patel (County EOC)',
    executiveSummary:
      'Operations remain in life-safety phase. Two evacuation orders active; shelter occupancy at 64%. No new injuries reported in this period; one rescue completed successfully.',
    readinessAssessment:
      'Personnel: 92% on-shift. Equipment: 85% mission-capable; 2 pumps deadlined awaiting parts. Logistics: 36-hour fuel and water supply on hand. Communications: primary and alternate nets stable. Overall readiness: AMBER (degraded equipment, sustainable for next op period).',
    riskToMission:
      'Highest: potential levee breach at North Sector within 2 hours could force shelter relocation. Medium: deteriorating road network restricting medical transport routes. Low: weather-driven shelter surge expected to plateau by 22:00.',
    outstandingRfiRfr:
      'RFI-014 (open): updated rainfall forecast for next 12 hours from NWS. RFI-016 (open): power restoration ETA for Districts 4 & 7. RFR-009 (open): two additional water tenders. RFR-011 (pending approval): mutual aid medical strike team.',
    previousCriticalIncidentComms:
      '15:12 — Notified IC of swift water rescue at River Bend Corridor (resolved). 16:40 — Coordinated evacuation messaging with PIO for Districts 4 & 7. 17:05 — Briefed County EOC on shelter capacity trend. 17:42 — Casualty transport coordinated with Hospital Liaison.',
    generalComments:
      'Inter-agency cooperation strong this period. Recommend standing up mutual aid coordination cell next op period. Consider pre-positioning sandbag teams at North Levee Sector ahead of forecast rainfall.',
    imageryNotes:
      'Aerial drone footage of North Levee Sector captured at 17:30 (3 frames). Ground photos of River Bend Corridor staging at 16:15 (2 frames). All imagery archived to Incident Archive folder /alpha-2026-001/sitrep-014/.',
    currentSituationSummary:
      'Severe weather impacts continue across multiple districts. Road closures and utility disruptions are driving shelter demand and dynamic resource allocation.',
    currentActivities: [
      {
        id: 1,
        time: '14:30',
        description: 'Swift water rescue completed at River Bend Corridor.',
        status: 'Completed',
      },
      {
        id: 2,
        time: '15:45',
        description: 'Levee monitoring teams deployed to North Sector.',
        status: 'In Progress',
      },
      {
        id: 3,
        time: '17:00',
        description: 'Shelter staffing surge for Central Aid Station.',
        status: 'Planned',
      },
    ],
    resourcesDeployed: [
      {
        id: 1,
        resource: 'USAR Team Alpha',
        quantity: '2',
        status: 'Assigned',
        location: 'North Levee Sector',
      },
      {
        id: 2,
        resource: 'Medical Strike Team',
        quantity: '1',
        status: 'Available',
        location: 'South Aid Station',
      },
    ],
    keyIssues: [
      'Rising water at North Levee Sector with breach risk in next 2 hours.',
      'Shelter capacity nearing threshold at Central Aid Station.',
    ],
    nextSteps: [
      'Coordinate utility assessment sweep across affected sectors.',
      'Pre-position barricade teams at South Connector choke points.',
      'Issue updated public messaging at next operational period.',
    ],
    distribution:
      'Incident Commander; Section Chiefs; State EOC; County EOC; Public Information Officer.',
  }
}

export function createEmptySitrepDraft(baseForm: SitrepFormState): SitrepFormState {
  return {
    ...baseForm,
    sectorLno: '',
    executiveSummary: '',
    readinessAssessment: '',
    riskToMission: '',
    outstandingRfiRfr: '',
    previousCriticalIncidentComms: '',
    generalComments: '',
    imageryNotes: '',
  }
}
