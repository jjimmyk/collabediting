import type { HubCisaDashboardDefinition, HubCisaDashboardId } from '@/features/hub/cisa-dashboards/types'

const DEMO_DASHBOARDS: Record<HubCisaDashboardId, Omit<HubCisaDashboardDefinition, 'id'>> = {
  'cisa-national-geospatial-cop': {
    label: 'National Geospatial COP (CISA)',
    description:
      'Common operating picture for geospatial incident layers, regional activity, and map-ready situational updates.',
    widgets: [
      {
        kind: 'kpi',
        id: 'active-layers',
        label: 'Active map layers',
        value: '18',
        hint: '6 weather · 12 operational',
      },
      {
        kind: 'kpi',
        id: 'geolocated-incidents',
        label: 'Geolocated incidents',
        value: '47',
        hint: '12 new in last 24h',
      },
      {
        kind: 'kpi',
        id: 'regions-monitored',
        label: 'Regions monitored',
        value: '6',
      },
      {
        kind: 'kpi',
        id: 'last-refresh',
        label: 'Last refresh',
        value: '4m ago',
      },
      {
        kind: 'bar-chart',
        id: 'incidents-by-region',
        title: 'Incidents by FEMA region',
        description: 'Synthetic demo counts for the current reporting window.',
        dataKey: 'incidents',
        data: [
          { label: 'R4', value: 14 },
          { label: 'R5', value: 11 },
          { label: 'R6', value: 9 },
          { label: 'R7', value: 7 },
          { label: 'R8', value: 6 },
        ],
      },
      {
        kind: 'category-bars',
        id: 'layer-volume',
        title: 'Layer volume by category',
        rows: [
          { category: 'Tropical Cyclone', count: 12, detail: 'MTTR 18h' },
          { category: 'Wildfire', count: 9, detail: 'MTTR 22h' },
          { category: 'Hazmat', count: 7, detail: 'MTTR 14h' },
          { category: 'Infrastructure', count: 6, detail: 'MTTR 26h' },
          { category: 'Coastal Storm', count: 5, detail: 'MTTR 20h' },
        ],
      },
      {
        kind: 'table',
        id: 'recent-updates',
        title: 'Recent geospatial updates',
        columns: ['Layer', 'Region', 'Updated', 'Status'],
        rows: [
          ['Storm surge extent', 'USCG D7 — Southeast', '09:14', 'Active'],
          ['River gauge anomalies', 'USCG D8 — Heartland', '08:52', 'Monitoring'],
          ['Critical facility overlay', 'GOM Offshore', '08:31', 'Active'],
          ['Evacuation routes', 'USCG D7 — Southeast', '07:58', 'Review'],
        ],
      },
    ],
  },
  'cisa-cyber-operations': {
    label: 'Cyber Operations (CISA)',
    description:
      'Operational view of cyber incidents, alert volume, and triage posture across monitored sectors.',
    widgets: [
      {
        kind: 'kpi',
        id: 'open-incidents',
        label: 'Open cyber incidents',
        value: '23',
        hint: '5 critical',
      },
      {
        kind: 'kpi',
        id: 'critical-alerts',
        label: 'Critical alerts (24h)',
        value: '14',
      },
      {
        kind: 'kpi',
        id: 'assets-monitored',
        label: 'Assets monitored',
        value: '1,284',
      },
      {
        kind: 'kpi',
        id: 'mean-triage',
        label: 'Mean time to triage',
        value: '42m',
      },
      {
        kind: 'bar-chart',
        id: 'alerts-by-day',
        title: 'Alerts by day',
        dataKey: 'alerts',
        data: [
          { label: 'Mon', value: 18 },
          { label: 'Tue', value: 24 },
          { label: 'Wed', value: 31 },
          { label: 'Thu', value: 22 },
          { label: 'Fri', value: 27 },
          { label: 'Sat', value: 12 },
          { label: 'Sun', value: 9 },
        ],
      },
      {
        kind: 'category-bars',
        id: 'incidents-by-sector',
        title: 'Open incidents by sector',
        rows: [
          { category: 'Energy', count: 8 },
          { category: 'Water', count: 5 },
          { category: 'Transportation', count: 4 },
          { category: 'Communications', count: 3 },
          { category: 'Government', count: 3 },
        ],
      },
      {
        kind: 'table',
        id: 'active-incidents',
        title: 'Active cyber incidents',
        columns: ['ID', 'Sector', 'Severity', 'Status', 'Owner'],
        rows: [
          ['CYB-2401', 'Energy', 'Critical', 'Containment', 'CISA East'],
          ['CYB-2398', 'Water', 'High', 'Investigation', 'Sector ISAC'],
          ['CYB-2394', 'Transportation', 'High', 'Monitoring', 'CISA Central'],
          ['CYB-2389', 'Communications', 'Medium', 'Triage', 'Fusion liaison'],
        ],
      },
    ],
  },
  'cisa-fusion-cell': {
    label: 'Fusion Cell (CISA)',
    description:
      'Cross-source fusion queue, agency contributions, and pending analytic reviews for shared situational awareness.',
    widgets: [
      {
        kind: 'kpi',
        id: 'active-fusions',
        label: 'Active fusions',
        value: '16',
      },
      {
        kind: 'kpi',
        id: 'pending-reviews',
        label: 'Pending reviews',
        value: '7',
        hint: '2 overdue',
      },
      {
        kind: 'kpi',
        id: 'sources-ingested',
        label: 'Sources ingested (24h)',
        value: '312',
      },
      {
        kind: 'kpi',
        id: 'cross-agency-links',
        label: 'Cross-agency links',
        value: '54',
      },
      {
        kind: 'bar-chart',
        id: 'fusions-by-agency',
        title: 'Fusions by contributing agency',
        dataKey: 'fusions',
        data: [
          { label: 'CISA', value: 28 },
          { label: 'FEMA', value: 19 },
          { label: 'DHS', value: 14 },
          { label: 'DOE', value: 11 },
          { label: 'USCG', value: 9 },
        ],
      },
      {
        kind: 'table',
        id: 'fusion-queue',
        title: 'Fusion queue',
        columns: ['Topic', 'Lead', 'Sources', 'Priority', 'Updated'],
        rows: [
          ['Gulf refinery disruption', 'CISA Fusion', '6', 'Urgent', '09:02'],
          ['Pipeline SCADA anomaly', 'Energy ISAC', '4', 'High', '08:44'],
          ['Port cyber sweep', 'USCG', '5', 'Routine', '08:10'],
          ['Regional power outlook', 'DOE liaison', '3', 'Routine', '07:35'],
        ],
      },
    ],
  },
  'cisa-hirt-infrastructure-analysis': {
    label: 'HIRT/Infrastructure Analysis (CISA)',
    description:
      'Infrastructure risk watch list, sector exposure, and HIRT activation metrics for critical assets.',
    widgets: [
      {
        kind: 'kpi',
        id: 'assets-at-risk',
        label: 'Assets at elevated risk',
        value: '38',
      },
      {
        kind: 'kpi',
        id: 'sectors-watch',
        label: 'Sectors in watch',
        value: '9',
      },
      {
        kind: 'kpi',
        id: 'hirt-activations',
        label: 'HIRT activations (7d)',
        value: '4',
      },
      {
        kind: 'kpi',
        id: 'critical-nodes',
        label: 'Critical nodes flagged',
        value: '12',
        hint: '3 require reassessment',
      },
      {
        kind: 'category-bars',
        id: 'risk-by-sector',
        title: 'Elevated risk by sector',
        rows: [
          { category: 'Energy', count: 11 },
          { category: 'Water & Wastewater', count: 8 },
          { category: 'Transportation', count: 7 },
          { category: 'Communications', count: 6 },
          { category: 'Commercial Facilities', count: 6 },
        ],
      },
      {
        kind: 'bar-chart',
        id: 'assessments-trend',
        title: 'Infrastructure assessments completed',
        dataKey: 'assessments',
        data: [
          { label: 'Wk 1', value: 6 },
          { label: 'Wk 2', value: 9 },
          { label: 'Wk 3', value: 7 },
          { label: 'Wk 4', value: 11 },
        ],
      },
      {
        kind: 'table',
        id: 'priority-infrastructure',
        title: 'Priority infrastructure items',
        columns: ['Asset', 'Sector', 'Risk', 'Reporting location', 'Updated'],
        rows: [
          ['Terminal manifold cluster', 'Energy', 'High', 'Galveston Bay', '08:58'],
          ['Regional water plant', 'Water', 'High', 'Jefferson Parish', '08:22'],
          ['Coastal radar site', 'Communications', 'Medium', 'Mobile sector', '07:51'],
          ['Bridge control system', 'Transportation', 'Medium', 'I-10 corridor', '07:14'],
        ],
      },
    ],
  },
  'cisa-sector-dependency-consequence': {
    label: 'Sector Dependency/Consequence (CISA)',
    description:
      'Dependency mapping, cascade risk, and consequence severity for cross-sector disruption scenarios.',
    widgets: [
      {
        kind: 'kpi',
        id: 'chains-mapped',
        label: 'Dependency chains mapped',
        value: '64',
      },
      {
        kind: 'kpi',
        id: 'high-consequence',
        label: 'High-consequence events',
        value: '6',
      },
      {
        kind: 'kpi',
        id: 'cascade-risk',
        label: 'Sectors with cascade risk',
        value: '11',
      },
      {
        kind: 'kpi',
        id: 'assessments-pending',
        label: 'Assessments pending',
        value: '9',
      },
      {
        kind: 'bar-chart',
        id: 'consequence-severity',
        title: 'Consequence severity index',
        dataKey: 'severity',
        data: [
          { label: 'Low', value: 18 },
          { label: 'Moderate', value: 24 },
          { label: 'High', value: 14 },
          { label: 'Severe', value: 8 },
        ],
      },
      {
        kind: 'category-bars',
        id: 'cascade-exposure',
        title: 'Cascade exposure by sector',
        rows: [
          { category: 'Energy → Water', count: 7 },
          { category: 'Transport → Energy', count: 6 },
          { category: 'Comm → Finance', count: 5 },
          { category: 'Water → Healthcare', count: 4 },
          { category: 'Food → Retail', count: 3 },
        ],
      },
      {
        kind: 'table',
        id: 'dependency-chains',
        title: 'Top dependency chains',
        columns: ['Chain', 'Primary sector', 'Downstream impact', 'Consequence'],
        rows: [
          ['Refinery outage → pipeline → terminal', 'Energy', 'Gulf logistics', 'Severe'],
          ['Water plant power loss', 'Water', 'Hospital cluster', 'High'],
          ['Fiber cut → 911 routing', 'Communications', 'Regional PSAPs', 'High'],
          ['Port closure → fuel delivery', 'Transportation', 'Coastal counties', 'Moderate'],
        ],
      },
    ],
  },
  'cisa-leadership-decision-view': {
    label: 'Leadership/Decision View (CISA)',
    description:
      'Executive readiness snapshot, pending decisions, and briefing activity for unified command support.',
    widgets: [
      {
        kind: 'kpi',
        id: 'decisions-pending',
        label: 'Decisions pending',
        value: '5',
        hint: '2 require IC input',
      },
      {
        kind: 'kpi',
        id: 'readiness-index',
        label: 'Readiness index',
        value: '82%',
      },
      {
        kind: 'kpi',
        id: 'briefings-today',
        label: 'Briefings today',
        value: '3',
      },
      {
        kind: 'kpi',
        id: 'ic-sync',
        label: 'IC sync status',
        value: 'On schedule',
      },
      {
        kind: 'bar-chart',
        id: 'decisions-timeline',
        title: 'Decisions recorded this week',
        dataKey: 'decisions',
        data: [
          { label: 'Mon', value: 2 },
          { label: 'Tue', value: 4 },
          { label: 'Wed', value: 3 },
          { label: 'Thu', value: 5 },
          { label: 'Fri', value: 2 },
        ],
      },
      {
        kind: 'table',
        id: 'decision-queue',
        title: 'Decision queue',
        columns: ['Decision', 'Owner', 'Due', 'Impact', 'Status'],
        rows: [
          ['Approve mutual-aid expansion', 'Unified Command', '10:30', 'High', 'Pending'],
          ['Shift staging area west', 'Operations', '11:00', 'Medium', 'In review'],
          ['Release public safety message', 'PIO', '11:30', 'High', 'Draft'],
          ['Authorize additional aviation', 'Planning', '12:00', 'Medium', 'Queued'],
        ],
      },
    ],
  },
  'interagency-dashboard': {
    label: 'Interagency Dashboard',
    description:
      'Partner agency reporting status, shared incidents, and cross-government coordination activity.',
    widgets: [
      {
        kind: 'kpi',
        id: 'agencies-reporting',
        label: 'Agencies reporting',
        value: '14',
        hint: 'of 16 expected',
      },
      {
        kind: 'kpi',
        id: 'shared-incidents',
        label: 'Shared incidents',
        value: '19',
      },
      {
        kind: 'kpi',
        id: 'open-requests',
        label: 'Open interagency requests',
        value: '8',
      },
      {
        kind: 'kpi',
        id: 'last-sync',
        label: 'Last sync',
        value: '12m ago',
      },
      {
        kind: 'bar-chart',
        id: 'activity-by-agency',
        title: 'Interagency activity (7d)',
        dataKey: 'activity',
        data: [
          { label: 'FEMA', value: 22 },
          { label: 'USCG', value: 18 },
          { label: 'DOE', value: 12 },
          { label: 'EPA', value: 9 },
          { label: 'DHS', value: 15 },
        ],
      },
      {
        kind: 'table',
        id: 'agency-status',
        title: 'Agency status',
        columns: ['Agency', 'Reporting', 'Shared incidents', 'Last update', 'Liaison'],
        rows: [
          ['FEMA Region VI', 'Current', '6', '09:05', 'J. Martinez'],
          ['USCG District 8', 'Current', '5', '08:58', 'A. Chen'],
          ['DOE ESF-12', 'Delayed', '2', '07:42', 'R. Thompson'],
          ['EPA Region 6', 'Current', '3', '08:31', 'L. Nguyen'],
          ['DHS NCCIC', 'Current', '4', '09:01', 'K. Brooks'],
        ],
      },
    ],
  },
}

export function getHubCisaDashboardDefinitions(): HubCisaDashboardDefinition[] {
  return (Object.entries(DEMO_DASHBOARDS) as Array<
    [HubCisaDashboardId, Omit<HubCisaDashboardDefinition, 'id'>]
  >).map(([id, definition]) => ({
    id,
    ...definition,
  }))
}

export function getHubCisaDashboardDefinition(
  id: HubCisaDashboardId
): HubCisaDashboardDefinition {
  const definition = DEMO_DASHBOARDS[id]
  return { id, ...definition }
}
