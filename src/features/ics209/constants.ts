import type {
  Ics209LifeSafetyThreatKey,
  Ics209SectionId,
  Ics209StatusCountRow,
} from '@/features/ics209/types'

export const ICS209_SECTION_LABELS: Record<Ics209SectionId, string> = {
  'incident-info': 'Incident Information (Blocks 1–11)',
  'approval-routing': 'Approval & Routing (Blocks 12–15)',
  'location-info': 'Incident Location Information (Blocks 16–27)',
  'incident-summary': 'Incident Summary (Blocks 28–30)',
  'public-responder-status': 'Public & Responder Status (Blocks 31–32)',
  'life-safety-threat': 'Life, Safety & Health Threat (Blocks 33–34)',
  'weather-projections': 'Weather & Projected Activity (Blocks 35–36)',
  'strategic-objectives': 'Strategic Objectives (Block 37)',
  'threat-summary': 'Incident Threat Summary (Block 38)',
  'critical-resources': 'Critical Resource Needs (Block 39)',
  'strategic-discussion': 'Strategic Discussion (Block 40)',
  'planned-actions-projections': 'Planned Actions & Projections (Blocks 41–46)',
  remarks: 'Remarks (Block 47)',
  'resource-commitment': 'Resource Commitment Summary (Blocks 48–53)',
}

export const ICS209_SECTION_PROMPTS: Record<Ics209SectionId, string> = {
  'incident-info':
    'Draft ICS-209 Incident Information including incident name, number, report version, incident commander(s), start date/time, size, percent contained/completed, definition, complexity, and reporting time period.',
  'approval-routing':
    'Draft ICS-209 Approval & Routing including prepared by, date/time submitted, approved by, and primary location/organization/agency sent to.',
  'location-info':
    'Draft ICS-209 Incident Location Information including state, county, city, jurisdiction, coordinates, short location description, and geospatial data notes.',
  'incident-summary':
    'Draft ICS-209 Incident Summary with significant events for the reporting period, primary materials/hazards, and damage assessment information.',
  'public-responder-status':
    'Draft ICS-209 Public and Responder Status Summary counts for fatalities, injuries, evacuations, sheltering, and related categories for this period and to date.',
  'life-safety-threat':
    'Draft ICS-209 Life, Safety, and Health status remarks and threat management checkboxes reflecting current incident activity.',
  'weather-projections':
    'Draft ICS-209 Weather Concerns and Projected Incident Activity for 12-, 24-, 48-, and 72-hour timeframes.',
  'strategic-objectives':
    'Draft ICS-209 Strategic Objectives defining the planned end-state for the incident.',
  'threat-summary':
    'Draft ICS-209 Current Incident Threat Summary and risk information in 12-, 24-, 48-, and 72-hour timeframes.',
  'critical-resources':
    'Draft ICS-209 Critical Resource Needs by priority in 12-, 24-, 48-, and 72-hour timeframes.',
  'strategic-discussion':
    'Draft ICS-209 Strategic Discussion relating overall strategy, constraints, IAP objectives, and major problems or concerns.',
  'planned-actions-projections':
    'Draft ICS-209 Planned Actions for next operational period, projected final size, completion/demobilization dates, and cost estimates.',
  remarks:
    'Draft ICS-209 Remarks continuing or expanding on prior blocks with block number references where applicable.',
  'resource-commitment':
    'Draft ICS-209 Incident Resource Commitment Summary by agency/organization with resource and personnel totals.',
}

export const ICS209_DEFAULT_DAMAGE_CATEGORIES = [
  'E. Single Residences',
  'F. Nonresidential Commercial Property',
  'Other Minor Structures',
  'Other',
] as const

export const ICS209_PUBLIC_STATUS_DEFAULTS: Omit<Ics209StatusCountRow, 'thisPeriod' | 'toDate' | 'count'>[] = [
  { key: 'fatalities', label: 'D. Fatalities' },
  { key: 'injuriesIllness', label: 'E. With Injuries/Illness' },
  { key: 'trappedRescue', label: 'F. Trapped/In Need of Rescue' },
  { key: 'missing', label: 'G. Missing (note if estimated)' },
  { key: 'evacuated', label: 'H. Evacuated (note if estimated)' },
  { key: 'shelteringInPlace', label: 'I. Sheltering in Place (note if estimated)' },
  { key: 'temporaryShelters', label: 'J. In Temporary Shelters (note if est.)' },
  { key: 'receivedMassImmunizations', label: 'K. Have Received Mass Immunizations' },
  { key: 'requireMassImmunizations', label: 'L. Require Immunizations (note if est.)' },
  { key: 'inQuarantine', label: 'M. In Quarantine' },
]

export const ICS209_RESPONDER_STATUS_DEFAULTS: Omit<Ics209StatusCountRow, 'thisPeriod' | 'toDate' | 'count'>[] = [
  { key: 'fatalities', label: 'D. Fatalities' },
  { key: 'injuriesIllness', label: 'E. With Injuries/Illness' },
  { key: 'trappedRescue', label: 'F. Trapped/In Need of Rescue' },
  { key: 'missing', label: 'G. Missing' },
  { key: 'shelteringInPlace', label: 'I. Sheltering in Place' },
  { key: 'receivedImmunizations', label: 'J. Have Received Immunizations' },
  { key: 'requireImmunizations', label: 'K. Require Immunizations' },
  { key: 'inQuarantine', label: 'M. In Quarantine' },
]

export const ICS209_LIFE_SAFETY_THREAT_LABELS: Record<Ics209LifeSafetyThreatKey, string> = {
  noLikelyThreat: 'C. No Likely Threat',
  potentialFutureThreat: 'D. Potential Future Threat',
  massNotificationsInProgress: 'E. Mass Notifications in Progress',
  massNotificationsCompleted: 'F. Mass Notifications Completed',
  noEvacuationsImminent: 'G. No Evacuation(s) Imminent',
  planningForEvacuation: 'H. Planning for Evacuation',
  planningForShelterInPlace: 'I. Planning for Shelter-in-Place',
  evacuationsInProgress: 'J. Evacuation(s) in Progress',
  shelterInPlaceInProgress: 'K. Shelter-in-Place in Progress',
  repopulationInProgress: 'L. Repopulation in Progress',
  massImmunizationInProgress: 'M. Mass Immunization in Progress',
  massImmunizationComplete: 'N. Mass Immunization Complete',
  quarantineInProgress: 'O. Quarantine in Progress',
  areaRestrictionInEffect: 'P. Area Restriction in Effect',
}

export const ICS209_TIME_HORIZON_LABELS = [
  { key: 'hours12' as const, label: '12 hours' },
  { key: 'hours24' as const, label: '24 hours' },
  { key: 'hours48' as const, label: '48 hours' },
  { key: 'hours72' as const, label: '72 hours' },
  { key: 'after72Hours' as const, label: 'Anticipated after 72 hours' },
]
