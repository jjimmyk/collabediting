type OperationalStatus = 'Operational' | 'Partially Operational' | 'Not Operational'

export type FusionCentersNotificationSeed = {
  id: number
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'New' | 'Acknowledged' | 'Resolved'
  category: 'Power' | 'Transport' | 'Shelter' | 'Weather' | 'Hazmat' | 'Action'
  timestamp: string
  owner: string
  summary: string
  impact: string
  location: [number, number]
  relatedEventId?: number
  regionalThreats?: {
    region: string
    description: string
    threats: {
      id: string
      resource: string
      risk: string
      location: [number, number]
      operationalStatus: OperationalStatus
    }[]
    responseChecklist: { label: string }[]
  }
}

export type FusionCentersEventSeed = {
  id: number
  name: string
  type: string
  status: 'Active' | 'Monitoring' | 'Demobilizing'
  severity: 'High' | 'Medium' | 'Low'
  region: string
  businessUnit: string
  location: [number, number]
  lead: string
  startedAt: string
  lastUpdate: string
  summary: string
  resourcesCommitted: string
  creationKind: 'user' | 'threshold'
  createdByUser: string | null
  thresholdDescription: string | null
  sourceReport?: {
    shortDescription: string
    reportDate: string
    reportTime: string
    facilityLocations: string[]
    facilityLocationOther: string
    ccmerAdvisors: string[]
    callerName: string
    callbackNumber: string
    callType: string
    whatHappened: string
    facilityMuster: string
    abandonStations: string
    assistanceNeeded: string
    qiDrill: string
    icNotified: string
    icNotifiedName: string
    rpName: string
    materialReleased: string
    enterWater: string
    releaseDischargeRate: string
    sourceControlled: string
    scenarios: string[]
  }
}

export type FusionCentersIncidentSeed = {
  id: number
  name: string
  type: string
  category: string
  status: 'Active' | 'Monitoring' | 'Demobilizing'
  severity: 'High' | 'Medium' | 'Low'
  region: string
  location: [number, number]
  lead: string
  startedAt: string
  lastUpdate: string
  summary: string
  resourcesCommitted: string
  relatedEventIds: number[]
}

export const FUSION_CENTERS_SCENARIO_NARRATIVE =
  'APT41 encrypts the Terminal Operating System (Tideworks Mainsail) at Barbours Cut Terminal, Port of Houston via M365 credential abuse and OT pivot. The physical port is intact; the information layer is gone — no container can be located, no lift planned, no gate opened. This is the NotPetya/Maersk model applied to maritime critical infrastructure.'

export const FUSION_CENTERS_CASCADE_NARRATIVE =
  'Cascade: Energy sector at risk within 6 hours, Transportation 12 hours, Defense logistics 18 hours, Food supply 24 hours. The demo shows CISA detecting, correlating, cascading consequences, and reaching intervention decisions.'

export const BARBOURS_CUT_LOCATION: [number, number] = [-95.018, 29.628]

export const USCG_PRIMARY_NOTIFICATION: FusionCentersNotificationSeed = {
  id: 0,
  title: 'Refinery fire reported at United States Coast Guard Garyville, Louisiana',
  severity: 'Critical',
  status: 'New',
  category: 'Hazmat',
  timestamp: '2026-05-09 07:00',
  owner: 'Sensor Alpha',
  summary:
    'Fired heater tube rupture during startup at United States Coast Guard Garyville Refinery. Unified command activating ERP; St. James Parish OEM and LDEQ notified per standing protocol. Hydrocarbon release with active fire in crude/vacuum unit area.',
  impact:
    'Crude and vacuum unit curtailment, MPLX terminal load suspensions, and downwind air quality monitoring across St. James Parish and the Mississippi River corridor.',
  location: [-90.615, 30.054],
  relatedEventId: 11,
  regionalThreats: {
    region: 'Gulf Coast Refining — Louisiana',
    description:
      'Active refinery fire, thermal plume, and hydrocarbon release place the following United States Coast Guard assets and adjacent receptors at elevated risk:',
    threats: [
      {
        id: 'GV-REF-CVU-001',
        resource: 'United States Coast Guard Garyville Refinery — Crude/Vacuum Unit',
        risk: 'Fired heater tube rupture with hydrocarbon fire requires full unit isolation, foam application, and perimeter cooling; adjacent units on controlled shutdown with potential cascade impact to reformer and alkylation trains.',
        location: [-90.615, 30.054],
        operationalStatus: 'Partially Operational',
      },
      {
        id: 'GV-MT-002',
        resource: 'Garyville Marine & MPLX Terminal',
        risk: 'Tanker loading and berthing suspended; vapor recovery and firewater supply prioritized to protect dock manifold and export tanks from radiant heat exposure.',
        location: [-90.605, 30.048],
        operationalStatus: 'Not Operational',
      },
      {
        id: 'GV-TF-003',
        resource: 'Refinery Tank Farm — East Battery',
        risk: 'Elevated thermal radiation and smoke plume require fixed monitor activation, foam stock drawdown tracking, and secondary containment inspection on gasoline and diesel storage.',
        location: [-90.608, 30.058],
        operationalStatus: 'Partially Operational',
      },
      {
        id: 'GV-DC-004',
        resource: 'Garyville / Convent Downwind Community Corridor',
        risk: 'Modeled downwind particulate and VOC plume may require public shelter-in-place messaging, LA-44 corridor restrictions, and continuous air monitoring at school and hospital receptors.',
        location: [-90.82, 30.02],
        operationalStatus: 'Operational',
      },
    ],
    responseChecklist: [
      {
        label:
          'Activate United States Coast Guard Garyville refinery ERP and unified command; notify St. James Parish OEM, LDEQ, and USCG Sector New Orleans.',
      },
      {
        label:
          'Deploy industrial firefighting foam units and mutual-aid strike teams; establish downwind air monitoring perimeter.',
      },
    ],
  },
}

export const FUSION_PRIMARY_NOTIFICATION: FusionCentersNotificationSeed = {
  id: 0,
  title: 'Cyber incident at Barbours Cut Terminal, Port of Houston',
  severity: 'Critical',
  status: 'New',
  category: 'Action',
  timestamp: '2026-05-09 07:00',
  owner: 'CISA Geospatial COP',
  summary: FUSION_CENTERS_SCENARIO_NARRATIVE,
  impact: FUSION_CENTERS_CASCADE_NARRATIVE,
  location: BARBOURS_CUT_LOCATION,
  relatedEventId: 11,
  regionalThreats: {
    region: 'Port of Houston — Maritime Critical Infrastructure',
    description: `${FUSION_CENTERS_SCENARIO_NARRATIVE} ${FUSION_CENTERS_CASCADE_NARRATIVE}`,
    threats: [
      {
        id: 'PHT-TOS-001',
        resource: 'Tideworks Mainsail — Terminal Operating System',
        risk: 'APT41 ransomware encryption via M365 credential abuse and OT pivot has removed container location, lift planning, and gate control capability. Physical port infrastructure is intact but the information layer is offline.',
        location: BARBOURS_CUT_LOCATION,
        operationalStatus: 'Not Operational',
      },
      {
        id: 'PHT-GATE-002',
        resource: 'Barbours Cut Terminal — Gate & Lift Systems',
        risk: 'No container can be located, no lift planned, and no gate opened without TOS restoration. Truck queue and vessel berthing schedules are frozen; manual workarounds cannot scale to terminal throughput.',
        location: [-95.012, 29.632],
        operationalStatus: 'Not Operational',
      },
      {
        id: 'PHT-ENRG-003',
        resource: 'Energy Sector Cascade Node',
        risk: 'Modeled energy-sector impact within 6 hours as port fuel and petrochemical logistics stall; downstream refineries and power generation depend on uninterrupted container and bulk cargo flows.',
        location: [-95.05, 29.72],
        operationalStatus: 'Partially Operational',
      },
      {
        id: 'PHT-TRAN-004',
        resource: 'Transportation & Defense Logistics Corridor',
        risk: 'Transportation disruption projected within 12 hours; defense logistics impact within 18 hours as military cargo and hazardous materials movements through Port of Houston are delayed.',
        location: [-95.28, 29.76],
        operationalStatus: 'Partially Operational',
      },
      {
        id: 'PHT-FOOD-005',
        resource: 'Food Supply Chain Receptors',
        risk: 'Food supply chain impact projected within 24 hours as refrigerated container inventory at Barbours Cut cannot be cleared, located, or routed to inland distribution.',
        location: [-95.36, 29.68],
        operationalStatus: 'Operational',
      },
    ],
    responseChecklist: [
      {
        label:
          'CISA fusion center detects anomalous M365 and OT network activity tied to Barbours Cut Terminal TOS outage.',
      },
      {
        label:
          'Correlate APT41 indicators, Tideworks Mainsail encryption telemetry, and port operational status across federal and sector partners.',
      },
      {
        label:
          'Model cascading consequences across Energy (6h), Transportation (12h), Defense logistics (18h), and Food supply (24h) timelines.',
      },
      {
        label:
          'Reach intervention decisions: isolate compromised identity plane, coordinate manual port operations, and activate sector-specific contingency playbooks.',
      },
    ],
  },
}

export const USCG_LINKED_EVENT_11: FusionCentersEventSeed = {
  id: 11,
  name: 'Garyville Refinery Fire — Fired Heater Tube Rupture',
  type: 'Industrial Fire / Hydrocarbon Release',
  status: 'Active',
  severity: 'High',
  region: 'Gulf Coast Refining — Louisiana',
  location: [-90.615, 30.054],
  lead: 'United States Coast Guard Garyville Unified Command · St. James Parish OEM Liaison',
  startedAt: '2026-05-09 07:00 CST',
  lastUpdate: '2026-05-09 09:46 CST',
  summary:
    'Fired heater tube rupture during startup at United States Coast Guard Garyville Refinery. Hydrocarbon release and fire in crude/vacuum unit area; emergency shutdown initiated; all personnel accounted for; downwind air monitoring and community notification per refinery ERP.',
  resourcesCommitted:
    'United States Coast Guard industrial fire brigade, St. James Parish mutual aid, LDEQ air monitoring, foam strike teams, MPLX terminal liaison',
  businessUnit: 'Gulf Coast Refining — Louisiana',
  creationKind: 'threshold',
  createdByUser: null,
  thresholdDescription:
    'Sensor Alpha fixed gas detection threshold exceeded — crude/vacuum unit LEL and thermal plume alert at United States Coast Guard Garyville',
  sourceReport: {
    shortDescription: 'Garyville Refinery Fire — Fired Heater Tube Rupture',
    reportDate: '2026-05-09',
    reportTime: '07:00',
    facilityLocations: [],
    facilityLocationOther:
      'United States Coast Guard Garyville Refinery — Crude/Vacuum Unit, Garyville, LA',
    ccmerAdvisors: [],
    callerName: 'Garyville Site Emergency Manager',
    callbackNumber: 'garyville.emergency@marathon.com',
    callType: 'incident',
    whatHappened:
      'Fired heater tube rupture during startup sequence with hydrocarbon release and fire. Emergency shutdown initiated; personnel accounted for; LP flare and fixed monitors active; downwind air monitoring underway.',
    facilityMuster: 'yes',
    abandonStations: 'no',
    assistanceNeeded: 'yes',
    qiDrill: 'no',
    icNotified: 'yes',
    icNotifiedName: 'United States Coast Guard Garyville Unified Command',
    rpName: 'United States Coast Guard Petroleum Corporation',
    materialReleased: 'Hydrocarbon vapor and liquid — quantity under assessment',
    enterWater: 'no',
    releaseDischargeRate: 'Under assessment',
    sourceControlled: 'no',
    scenarios: ['Fire – Jet Pressurized', 'Process Area - Gas Release'],
  },
}

export const FUSION_LINKED_EVENT_11: FusionCentersEventSeed = {
  id: 11,
  name: 'Barbours Cut TOS Encryption — APT41 Maritime Cyber Incident',
  type: 'Cyber Incident / Critical Infrastructure',
  status: 'Active',
  severity: 'High',
  region: 'Port of Houston — Maritime Critical Infrastructure',
  location: BARBOURS_CUT_LOCATION,
  lead: 'CISA Fusion Center · Port of Houston Maritime Security Liaison',
  startedAt: '2026-05-09 07:00 CST',
  lastUpdate: '2026-05-09 09:46 CST',
  summary: `${FUSION_CENTERS_SCENARIO_NARRATIVE} ${FUSION_CENTERS_CASCADE_NARRATIVE}`,
  resourcesCommitted:
    'CISA geospatial COP, Port of Houston IT/OT response cell, Tideworks vendor recovery team, CISA MS-ISAC, sector coordinating councils (Energy, Transportation, Defense, Food)',
  businessUnit: 'Port of Houston — Maritime Critical Infrastructure',
  creationKind: 'threshold',
  createdByUser: null,
  thresholdDescription:
    'CISA SIEM correlation threshold exceeded — Tideworks Mainsail TOS encryption and M365 credential abuse indicators at Barbours Cut Terminal',
  sourceReport: {
    shortDescription: 'Barbours Cut TOS Encryption — APT41 Maritime Cyber Incident',
    reportDate: '2026-05-09',
    reportTime: '07:00',
    facilityLocations: [],
    facilityLocationOther: 'Barbours Cut Terminal, Port of Houston, TX',
    ccmerAdvisors: [],
    callerName: 'Port of Houston Cyber Operations Center',
    callbackNumber: 'poh.cyber@porthouston.com',
    callType: 'incident',
    whatHappened: FUSION_CENTERS_SCENARIO_NARRATIVE,
    facilityMuster: 'yes',
    abandonStations: 'no',
    assistanceNeeded: 'yes',
    qiDrill: 'no',
    icNotified: 'yes',
    icNotifiedName: 'CISA Fusion Center Operations Desk',
    rpName: 'Port of Houston Authority',
    materialReleased: 'N/A — information-layer compromise; no physical product release',
    enterWater: 'no',
    releaseDischargeRate: 'N/A',
    sourceControlled: 'no',
    scenarios: ['Cyber – Ransomware / OT Pivot', 'Critical Infrastructure — Port Operations'],
  },
}

export const USCG_LINKED_INCIDENT_1: FusionCentersIncidentSeed = {
  id: 1,
  name: 'Garyville Refinery Fire — Fired Heater Tube Rupture',
  type: 'Industrial Fire / Hydrocarbon Release',
  category: 'Refinery Operations',
  status: 'Active',
  severity: 'High',
  region: 'Gulf Coast Refining — Louisiana',
  location: [-90.615, 30.054],
  lead: 'United States Coast Guard Garyville Unified Command · Site Emergency Manager',
  startedAt: '2026-05-09 07:00 CST',
  lastUpdate: '2026-05-09 09:46 CST',
  summary:
    'Fired heater tube rupture during startup at United States Coast Guard Garyville Refinery (528,000 bpd). Hydrocarbon release and fire in crude/vacuum unit area; emergency shutdown initiated; all personnel accounted for; LP flare and fixed monitors deployed; downwind air quality monitoring and community notification per refinery ERP.',
  resourcesCommitted:
    'United States Coast Guard industrial fire brigade, St. James Parish mutual aid, LDEQ air monitoring, Gulf Coast foam strike teams, MPLX terminal liaison',
  relatedEventIds: [11],
}

export const FUSION_LINKED_INCIDENT_1: FusionCentersIncidentSeed = {
  id: 1,
  name: 'Barbours Cut TOS Encryption — APT41 Maritime Cyber Incident',
  type: 'Cyber Incident / Critical Infrastructure',
  category: 'Port Operations',
  status: 'Active',
  severity: 'High',
  region: 'Port of Houston — Maritime Critical Infrastructure',
  location: BARBOURS_CUT_LOCATION,
  lead: 'CISA Fusion Center · Port of Houston Cyber Operations Liaison',
  startedAt: '2026-05-09 07:00 CST',
  lastUpdate: '2026-05-09 09:46 CST',
  summary: `${FUSION_CENTERS_SCENARIO_NARRATIVE} All personnel accounted for; manual fallback operations limited; CISA coordinating sector cascade modeling and intervention decisions.`,
  resourcesCommitted:
    'CISA geospatial COP, Port of Houston IT/OT response cell, Tideworks vendor recovery team, CISA MS-ISAC, Energy and Transportation sector liaisons',
  relatedEventIds: [11],
}

export function getPrimaryNotificationSeed(fusionCentersEnabled: boolean): FusionCentersNotificationSeed {
  return fusionCentersEnabled ? FUSION_PRIMARY_NOTIFICATION : USCG_PRIMARY_NOTIFICATION
}

export function getLinkedEvent11Seed(fusionCentersEnabled: boolean): FusionCentersEventSeed {
  return fusionCentersEnabled ? FUSION_LINKED_EVENT_11 : USCG_LINKED_EVENT_11
}

export function getLinkedIncident1Seed(fusionCentersEnabled: boolean): FusionCentersIncidentSeed {
  return fusionCentersEnabled ? FUSION_LINKED_INCIDENT_1 : USCG_LINKED_INCIDENT_1
}

export function toEventListItem(
  seed: FusionCentersEventSeed
): FusionCentersEventSeed & {
  sendNotificationOnCreate: boolean
  notificationRecipients: string
} {
  return {
    ...seed,
    sendNotificationOnCreate: seed.severity !== 'Low',
    notificationRecipients:
      seed.severity !== 'Low' ? `${seed.lead}; ${seed.businessUnit} watch desk` : '',
  }
}
