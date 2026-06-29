import type { HubCisaDashboardDefinition, HubCisaDashboardId } from '@/features/hub/cisa-dashboards/types'

/** Shared synthetic incident thread for cross-dashboard demo coherence. */
export const DEMO_INCIDENT_ID = 'CYB-2407'
export const DEMO_INCIDENT_NAME = 'Gulf terminal OT compromise'
export const DEMO_PRIMARY_ASSET = 'Galveston Bay terminal cluster'

const DEMO_DASHBOARDS: Record<HubCisaDashboardId, Omit<HubCisaDashboardDefinition, 'id'>> = {
  'cisa-national-geospatial-cop': {
    label: 'National Geospatial COP (CISA)',
    description:
      'Common operating picture for Port of Houston outage response, AIS vessel traffic, and impacted critical assets.',
    widgets: [],
  },
  'cisa-cyber-operations': {
    label: 'Cyber Operations (CISA)',
    description:
      'Operational view of CYB-2407 lateral movement, hunt posture, and OT containment across monitored sectors.',
    widgets: [
      {
        kind: 'kpi',
        id: 'open-incidents',
        label: 'Primary incident',
        value: DEMO_INCIDENT_ID,
        hint: DEMO_INCIDENT_NAME,
      },
      {
        kind: 'kpi',
        id: 'severity',
        label: 'Severity',
        value: 'Critical',
        hint: 'OT impact confirmed',
      },
      {
        kind: 'kpi',
        id: 'active-hunt-hypotheses',
        label: 'Active hunt hypotheses',
        value: '2',
      },
      {
        kind: 'kpi',
        id: 'containment-status',
        label: 'Containment status',
        value: 'In progress',
        hint: 'TOS offline · IT isolated',
      },
      {
        kind: 'timeline-segments',
        id: 'lateral-movement',
        title: 'Lateral movement timeline',
        description: 'Observed dwell and pivot intervals for CYB-2407.',
        segments: [
          {
            label: 'IT dwell',
            duration: '44 min',
            detail: 'Initial foothold → domain controller → helpdesk VLAN',
          },
          {
            label: 'OT-to-TOS offline',
            duration: '6 min',
            detail: 'SCADA pivot → terminal operations disconnect',
          },
        ],
      },
      {
        kind: 'table',
        id: 'hunt-hypotheses',
        title: 'Active hunt hypotheses',
        description: 'Two hypotheses under active investigation.',
        columns: ['Hypothesis', 'Scope', 'Confidence', 'Owner'],
        rows: [
          [
            'SCADA credential reuse from IT helpdesk VLAN',
            'OT / HMI workstations',
            'Medium',
            'CISA Hunt Team East',
          ],
          [
            'Scheduled task persistence on HMI workstation',
            `${DEMO_PRIMARY_ASSET}`,
            'High',
            'Energy ISAC liaison',
          ],
        ],
      },
      {
        kind: 'table',
        id: 'active-incidents',
        title: 'Related cyber incidents',
        columns: ['ID', 'Sector', 'Severity', 'Status', 'Owner'],
        rows: [
          [DEMO_INCIDENT_ID, 'Energy', 'Critical', 'Containment', 'CISA East'],
          ['CYB-2403', 'Water', 'High', 'Monitoring', 'Sector ISAC'],
          ['CYB-2398', 'Transportation', 'Medium', 'Triage', 'CISA Central'],
        ],
      },
    ],
  },
  'cisa-fusion-cell': {
    label: 'Fusion Cell (CISA)',
    description:
      'Cross-source fusion for CYB-2407 with analyst decisions pending on OT scope and sector impact.',
    widgets: [
      {
        kind: 'kpi',
        id: 'human-decision-queue',
        label: 'Human decision queue',
        value: '2',
        hint: 'Requires analyst action',
      },
      {
        kind: 'kpi',
        id: 'active-fusions',
        label: 'Active fusions',
        value: '4',
        hint: `CYB-2407 lead`,
      },
      {
        kind: 'kpi',
        id: 'sources-ingested',
        label: 'Sources ingested (24h)',
        value: '86',
      },
      {
        kind: 'kpi',
        id: 'cross-agency-links',
        label: 'Cross-agency links',
        value: '12',
      },
      {
        kind: 'table',
        id: 'human-decision-queue-table',
        title: 'Human decision queue',
        description: 'Pending items requiring analyst action.',
        columns: ['Item', 'Source', 'Analyst action', 'Priority', 'Age'],
        rows: [
          [
            'Validate OT isolation scope for Galveston Bay terminal',
            'CISA Hunt Team East',
            'Assign & confirm',
            'Urgent',
            '18m',
          ],
          [
            'Confirm DOE sector impact statement for downstream refineries',
            'Energy ISAC',
            'Review & release',
            'High',
            '32m',
          ],
        ],
      },
      {
        kind: 'bar-chart',
        id: 'fusions-by-agency',
        title: 'Fusions by contributing agency',
        dataKey: 'fusions',
        data: [
          { label: 'CISA', value: 14 },
          { label: 'DOE', value: 9 },
          { label: 'DHS', value: 7 },
          { label: 'USCG', value: 5 },
          { label: 'FEMA', value: 4 },
        ],
      },
    ],
  },
  'cisa-hirt-infrastructure-analysis': {
    label: 'HIRT/Infrastructure Analysis (CISA)',
    description:
      'Infrastructure risk watch for CYB-2407 critical nodes, HIRT activations, and OT-exposed assets.',
    widgets: [
      {
        kind: 'kpi',
        id: 'assets-at-risk',
        label: 'Assets at elevated risk',
        value: '6',
        hint: DEMO_PRIMARY_ASSET,
      },
      {
        kind: 'kpi',
        id: 'sectors-watch',
        label: 'Sectors in watch',
        value: '3',
        hint: 'Energy · Water · Transportation',
      },
      {
        kind: 'kpi',
        id: 'hirt-activations',
        label: 'HIRT activations (7d)',
        value: '2',
        hint: 'CYB-2407 related',
      },
      {
        kind: 'kpi',
        id: 'critical-nodes',
        label: 'Critical nodes flagged',
        value: '4',
        hint: '2 SCADA · 2 TOS',
      },
      {
        kind: 'category-bars',
        id: 'risk-by-sector',
        title: 'Elevated risk by sector',
        rows: [
          { category: 'Energy', count: 3, detail: 'Terminal / pipeline' },
          { category: 'Water & Wastewater', count: 2, detail: 'Downstream plant' },
          { category: 'Transportation', count: 1, detail: 'Port logistics' },
        ],
      },
      {
        kind: 'table',
        id: 'priority-infrastructure',
        title: 'Priority infrastructure items',
        columns: ['Asset', 'Sector', 'Risk', 'HIRT status', 'Updated'],
        rows: [
          [DEMO_PRIMARY_ASSET, 'Energy', 'Critical', 'Active assessment', '09:06'],
          ['Regional SCADA gateway', 'Energy', 'High', 'Monitoring', '08:52'],
          ['Jefferson Parish water plant', 'Water', 'High', 'Queued', '08:34'],
          ['Galveston Bay port control', 'Transportation', 'Medium', 'Monitoring', '08:11'],
        ],
      },
    ],
  },
  'cisa-sector-dependency-consequence': {
    label: 'Sector Dependency/Consequence (CISA)',
    description:
      'Dependency mapping and consequence severity for CYB-2407 OT outage cascading across Gulf sectors.',
    widgets: [
      {
        kind: 'kpi',
        id: 'chains-mapped',
        label: 'Dependency chains mapped',
        value: '8',
        hint: 'CYB-2407 scenario',
      },
      {
        kind: 'kpi',
        id: 'high-consequence',
        label: 'High-consequence events',
        value: '2',
      },
      {
        kind: 'kpi',
        id: 'cascade-risk',
        label: 'Sectors with cascade risk',
        value: '4',
      },
      {
        kind: 'kpi',
        id: 'assessments-pending',
        label: 'Assessments pending',
        value: '3',
      },
      {
        kind: 'bar-chart',
        id: 'consequence-severity',
        title: 'Consequence severity index',
        dataKey: 'severity',
        data: [
          { label: 'Moderate', value: 2 },
          { label: 'High', value: 3 },
          { label: 'Severe', value: 2 },
          { label: 'Critical', value: 1 },
        ],
      },
      {
        kind: 'category-bars',
        id: 'cascade-exposure',
        title: 'Cascade exposure by sector',
        rows: [
          { category: 'Energy → Transportation', count: 3, detail: 'TOS offline' },
          { category: 'Energy → Water', count: 2, detail: 'Power dependency' },
          { category: 'Water → Healthcare', count: 2, detail: 'Plant outage' },
          { category: 'Transport → Energy', count: 1, detail: 'Fuel delivery' },
        ],
      },
      {
        kind: 'table',
        id: 'dependency-chains',
        title: 'Top dependency chains',
        columns: ['Chain', 'Primary sector', 'Downstream impact', 'Consequence'],
        rows: [
          [
            'Terminal OT outage → pipeline throttle → port backlog',
            'Energy',
            'Gulf logistics',
            'Severe',
          ],
          [
            'SCADA disconnect → water plant power loss',
            'Water',
            'Hospital cluster',
            'High',
          ],
          [
            'TOS offline → berth scheduling halt',
            'Transportation',
            'Coastal counties',
            'High',
          ],
          [
            'Refinery feed delay → regional fuel reserves',
            'Energy',
            'FEMA R6',
            'Moderate',
          ],
        ],
      },
    ],
  },
  'cisa-leadership-decision-view': {
    label: 'Leadership/Decision View (CISA)',
    audience: 'NSC / ONCD',
    description:
      'Executive readiness snapshot for NSC and ONCD principals on CYB-2407 national cyber coordination.',
    widgets: [
      {
        kind: 'kpi',
        id: 'decisions-pending',
        label: 'Decisions pending',
        value: '4',
        hint: 'NSC / ONCD sync',
      },
      {
        kind: 'kpi',
        id: 'readiness-index',
        label: 'National readiness index',
        value: '78%',
      },
      {
        kind: 'kpi',
        id: 'briefings-today',
        label: 'NSC / ONCD briefings today',
        value: '2',
      },
      {
        kind: 'kpi',
        id: 'ic-sync',
        label: 'Interagency sync status',
        value: 'Scheduled',
        hint: '14:00 principals',
      },
      {
        kind: 'bar-chart',
        id: 'decisions-timeline',
        title: 'NSC / ONCD decisions recorded this week',
        dataKey: 'decisions',
        data: [
          { label: 'Mon', value: 1 },
          { label: 'Tue', value: 2 },
          { label: 'Wed', value: 3 },
          { label: 'Thu', value: 4 },
          { label: 'Fri', value: 2 },
        ],
      },
      {
        kind: 'table',
        id: 'decision-queue',
        title: 'NSC / ONCD decision queue',
        description: 'Pending national-level decisions for CYB-2407.',
        columns: ['Decision', 'Owner', 'Due', 'Impact', 'Status'],
        rows: [
          [
            'Authorize ONCD public statement timing',
            'ONCD',
            '10:30',
            'High',
            'Pending',
          ],
          [
            'NSC principals brief — sector cascade summary',
            'NSC staff',
            '11:00',
            'High',
            'In review',
          ],
          [
            'Cross-agency OT isolation policy guidance',
            'CISA / ONCD',
            '11:30',
            'Critical',
            'Draft',
          ],
          [
            'DOE sector impact escalation threshold',
            'NSC / DOE',
            '12:00',
            'High',
            'Queued',
          ],
        ],
      },
    ],
  },
  'interagency-dashboard': {
    label: 'Interagency Dashboard',
    description:
      'Partner agency reporting status, shared CYB-2407 incidents, and cross-government coordination activity.',
    widgets: [
      {
        kind: 'kpi',
        id: 'agencies-reporting',
        label: 'Agencies reporting',
        value: '6',
        hint: 'CYB-2407 coordination',
      },
      {
        kind: 'kpi',
        id: 'shared-incidents',
        label: 'Shared incidents',
        value: '1',
        hint: DEMO_INCIDENT_ID,
      },
      {
        kind: 'kpi',
        id: 'open-requests',
        label: 'Open interagency requests',
        value: '5',
      },
      {
        kind: 'kpi',
        id: 'last-sync',
        label: 'Last sync',
        value: '8m ago',
      },
      {
        kind: 'bar-chart',
        id: 'activity-by-agency',
        title: 'Interagency activity (7d)',
        dataKey: 'activity',
        data: [
          { label: 'CISA', value: 18 },
          { label: 'DOE', value: 14 },
          { label: 'DHS', value: 11 },
          { label: 'FEMA', value: 9 },
          { label: 'USCG', value: 8 },
        ],
      },
      {
        kind: 'table',
        id: 'agency-status',
        title: 'Agency status',
        columns: ['Agency', 'Reporting', 'Shared incidents', 'Last update', 'Liaison'],
        rows: [
          ['CISA NCCIC', 'Current', DEMO_INCIDENT_ID, '09:12', 'K. Brooks'],
          ['DOE ESF-12', 'Current', DEMO_INCIDENT_ID, '09:04', 'R. Thompson'],
          ['DHS NCC', 'Current', DEMO_INCIDENT_ID, '08:58', 'A. Chen'],
          ['FEMA Region VI', 'Current', DEMO_INCIDENT_ID, '08:47', 'J. Martinez'],
          ['USCG District 8', 'Delayed', DEMO_INCIDENT_ID, '08:22', 'L. Nguyen'],
          ['EPA Region 6', 'Current', '—', '08:15', 'M. Patel'],
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
