import { describe, expect, it } from 'vitest'
import {
  buildSitrepVersionTimelineMarkers,
  formatSitrepTimelineTimestamp,
} from '@/features/sitrep/sitrep-version-timeline'
import type { SitrepVersion } from '@/features/sitrep/types'

const baseVersion = (id: string, createdAt: number, signed = false): SitrepVersion => ({
  id,
  createdAt,
  creatorCreatedAt: createdAt,
  creatorName: 'Alice',
  creatorColor: '#000',
  creatorRole: 'Planner',
  authorName: 'Alice',
  authorColor: '#000',
  authorRole: 'Planner',
  snapshot: {
    reportNumber: '',
    preparedDateTime: '',
    reportingPeriodStart: '',
    reportingPeriodEnd: '',
    incidentName: 'Exercise Alpha',
    incidentLocation: '',
    preparedBy: '',
    agency: '',
    sectorLno: '',
    executiveSummary: '',
    readinessAssessment: '',
    riskToMission: '',
    outstandingRfiRfr: '',
    previousCriticalIncidentComms: '',
    generalComments: '',
    imageryNotes: '',
    currentSituationSummary: '',
    currentActivities: [],
    resourcesDeployed: [],
    keyIssues: [],
    nextSteps: [],
    distribution: '',
  },
  signatures: signed ? [{ name: 'Alice', role: 'Planner', signedAt: createdAt }] : [],
})

describe('sitrep-version-timeline', () => {
  it('returns empty markers for no versions', () => {
    expect(buildSitrepVersionTimelineMarkers([])).toEqual({
      markers: [],
      rangeStart: 0,
      rangeEnd: 0,
    })
  })

  it('centers a single version marker', () => {
    const timeline = buildSitrepVersionTimelineMarkers([baseVersion('v1', 1000)])
    expect(timeline.markers).toHaveLength(1)
    expect(timeline.markers[0]?.offsetPercent).toBe(50)
    expect(timeline.markers[0]?.isLatest).toBe(true)
  })

  it('positions markers across the saved version range', () => {
    const timeline = buildSitrepVersionTimelineMarkers([
      baseVersion('v1', 1000),
      baseVersion('v2', 2000),
      baseVersion('v3', 4000, true),
    ])

    expect(timeline.rangeStart).toBe(1000)
    expect(timeline.rangeEnd).toBe(4000)
    expect(timeline.markers.map((marker) => Math.round(marker.offsetPercent * 100) / 100)).toEqual([
      0, 33.33, 100,
    ])
    expect(timeline.markers[2]?.isSigned).toBe(true)
    expect(timeline.markers[2]?.isLatest).toBe(true)
  })

  it('formats same-day timestamps as time only', () => {
    const now = new Date()
    now.setHours(14, 30, 0, 0)
    const formatted = formatSitrepTimelineTimestamp(now.getTime())
    expect(formatted).toMatch(/2:30/)
  })
})
