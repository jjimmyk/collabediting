/** Hub incident list seed id for Port of Houston Outage (see App.tsx incidentList). */
export const PORT_OF_HOUSTON_OUTAGE_HUB_INCIDENT_ID = 4

export const PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY =
  'geospatial-cop-port-houston-outage'

export const PORT_OF_HOUSTON_OUTAGE_INCIDENT = {
  id: 'INC-2026-0138',
  hubIncidentId: PORT_OF_HOUSTON_OUTAGE_HUB_INCIDENT_ID,
  name: 'Port of Houston Outage',
  type: 'Infrastructure Outage / Port Operations',
  category: 'Port & Energy Infrastructure',
  status: 'Active',
  severity: 'High',
  region: 'Houston Ship Channel · Port of Houston',
  location: [-95.028, 29.618] as [number, number],
  lead: 'USCG Sector Houston-Galveston · Port Houston · CenterPoint Energy',
  startedAt: '2026-04-26 06:12 CDT',
  lastUpdate: '2026-04-26 14:22 CDT',
  summary:
    'Regional power disruption and terminal automation loss affecting Houston Ship Channel loadout, Barbours Cut container gates, and Bayport chemical berth scheduling. Unified coordination with Port Houston, CenterPoint Energy transmission control, and maritime stakeholders; one-way vessel traffic management in effect.',
  currentSituationReport:
    'As of 14:22 CDT, CenterPoint has restored 138 kV feed to Barbours Cut auxiliary substation; container gate automation remains on manual fallback at approximately 40% throughput. Captain of the Port maintains one-way inbound vessel traffic with 47 AIS-tracked vessels queued in Galveston Bay. Unified Command continues coordination at USCG Sector Houston-Galveston; no injuries or environmental releases reported.',
  currentSituationReportUpdatedBy: 'Lt Cmdr. Maria Reyes · USCG Sector Houston-Galveston',
  currentSituationReportUpdatedAt: '2026-04-26 14:22 CDT',
}

export const GEOSPATIAL_COP_AIS_LAYER = {
  id: 'ais-vessel-tracks',
  label: 'AIS',
  description: 'Automatic Identification System vessel tracks near Port of Houston',
  vesselCount: 47,
}
