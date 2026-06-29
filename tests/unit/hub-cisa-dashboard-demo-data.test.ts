import { describe, expect, it } from 'vitest'
import {
  DEMO_INCIDENT_ID,
  DEMO_PRIMARY_ASSET,
  getHubCisaDashboardDefinition,
  getHubCisaDashboardDefinitions,
} from '@/features/hub/cisa-dashboards/demo-widget-data'

describe('hub cisa dashboard demo data', () => {
  it('keeps (CISA) suffix on the six CISA dashboards', () => {
    const cisaLabels = getHubCisaDashboardDefinitions()
      .filter((dashboard) => dashboard.id !== 'interagency-dashboard')
      .map((dashboard) => dashboard.label)

    expect(cisaLabels).toHaveLength(6)
    for (const label of cisaLabels) {
      expect(label).toContain('(CISA)')
    }
  })

  it('includes cyber lateral movement timeline with required dwell intervals', () => {
    const cyber = getHubCisaDashboardDefinition('cisa-cyber-operations')
    const timeline = cyber.widgets.find((widget) => widget.id === 'lateral-movement')

    expect(timeline?.kind).toBe('timeline-segments')
    if (timeline?.kind !== 'timeline-segments') return

    expect(timeline.segments).toHaveLength(2)
    expect(timeline.segments[0]?.duration).toBe('44 min')
    expect(timeline.segments[0]?.label).toMatch(/IT dwell/i)
    expect(timeline.segments[1]?.duration).toBe('6 min')
    expect(timeline.segments[1]?.label).toMatch(/OT-to-TOS offline/i)
  })

  it('shows exactly two active hunt hypotheses', () => {
    const cyber = getHubCisaDashboardDefinition('cisa-cyber-operations')
    const huntKpi = cyber.widgets.find((widget) => widget.id === 'active-hunt-hypotheses')
    const huntTable = cyber.widgets.find((widget) => widget.id === 'hunt-hypotheses')

    expect(huntKpi?.kind).toBe('kpi')
    if (huntKpi?.kind === 'kpi') {
      expect(huntKpi.value).toBe('2')
    }

    expect(huntTable?.kind).toBe('table')
    if (huntTable?.kind === 'table') {
      expect(huntTable.rows).toHaveLength(2)
    }
  })

  it('shows human decision queue with two pending analyst actions', () => {
    const fusion = getHubCisaDashboardDefinition('cisa-fusion-cell')
    const queueKpi = fusion.widgets.find((widget) => widget.id === 'human-decision-queue')
    const queueTable = fusion.widgets.find((widget) => widget.id === 'human-decision-queue-table')

    expect(queueKpi?.kind).toBe('kpi')
    if (queueKpi?.kind === 'kpi') {
      expect(queueKpi.value).toBe('2')
      expect(queueKpi.hint).toMatch(/analyst action/i)
    }

    expect(queueTable?.kind).toBe('table')
    if (queueTable?.kind === 'table') {
      expect(queueTable.title).toMatch(/human decision queue/i)
      expect(queueTable.rows).toHaveLength(2)
    }
  })

  it('surfaces explicit NSC / ONCD audience on leadership dashboard', () => {
    const leadership = getHubCisaDashboardDefinition('cisa-leadership-decision-view')

    expect(leadership.audience).toBe('NSC / ONCD')
    expect(leadership.description).toMatch(/NSC/i)
    expect(leadership.description).toMatch(/ONCD/i)

    const decisionTable = leadership.widgets.find((widget) => widget.id === 'decision-queue')
    expect(decisionTable?.kind).toBe('table')
    if (decisionTable?.kind === 'table') {
      expect(decisionTable.title).toMatch(/NSC \/ ONCD/i)
    }
  })

  it('does not use segregated view language on interagency dashboard', () => {
    const interagency = getHubCisaDashboardDefinition('interagency-dashboard')
    const serialized = JSON.stringify(interagency).toLowerCase()

    expect(serialized).not.toContain('segregated')
  })

  it('threads a shared incident narrative across dashboards', () => {
    const cyber = getHubCisaDashboardDefinition('cisa-cyber-operations')
    const interagency = getHubCisaDashboardDefinition('interagency-dashboard')

    expect(JSON.stringify(cyber)).toContain(DEMO_INCIDENT_ID)
    expect(JSON.stringify(interagency)).toContain(DEMO_INCIDENT_ID)
    expect(JSON.stringify(cyber)).toContain(DEMO_PRIMARY_ASSET)
  })
})
