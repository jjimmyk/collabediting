import assert from 'node:assert/strict'
import { buildRosterDisplayProjection } from '../src/features/roster/build-roster-display-projection'
import { buildPositionOrgChartAssigneeGroups } from '../src/features/roster/position-org-chart-assignee-display'
import {
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  positionMatchesScheduledAssigneeFilters,
  resolveEffectiveRosterTimeHorizon,
  singleResourceNodeVisible,
  summarizeActiveDisplayFilters,
} from '../src/features/roster/roster-display-filters'
import { buildWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import type { PositionRosterEntry } from '../src/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '../src/lib/workspace-types'

function buildSampleEntry(
  position: string,
  overrides: Partial<PositionRosterEntry> = {}
): PositionRosterEntry {
  return {
    position,
    members: [],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    memberSchedulePolicy: {
      allowActiveAssignment: true,
      allowScheduleAssign: true,
      allowScheduleUnassign: true,
    },
    editIcs201: true,
    allowWorkAssignment: true,
    positionType: null,
    customTypeLabel: null,
    positionTypeLabel: null,
    ...overrides,
  }
}

function buildSampleMember(id: string, email: string): WorkspaceRosterMember {
  return {
    id,
    userId: null,
    email,
    status: 'active',
    icsPosition: 'Operations Section Chief',
    icsPositions: ['Operations Section Chief'],
    assignmentKind: 'ics_position',
    orgChartReportsTo: null,
    checkInStatus: 'not_arrived',
    addedAt: '2026-01-01T00:00:00.000Z',
  }
}

const catalog = buildWorkspacePositionCatalog([])
const entry = buildSampleEntry('Operations Section Chief', {
  members: [buildSampleMember('m1', 'current@example.com')],
  scheduledAssignees: [buildSampleMember('m2', 'scheduled@example.com')],
  scheduledUnassignees: [buildSampleMember('m1', 'current@example.com')],
})

assert.equal(
  resolveEffectiveRosterTimeHorizon(
    { ...DEFAULT_ROSTER_DISPLAY_FILTERS, rosterTimeHorizon: 'next_op' },
    false,
    false
  ),
  'current_op',
  'next OP horizon should fall back when operational periods are disabled'
)

assert.equal(
  resolveEffectiveRosterTimeHorizon(
    { ...DEFAULT_ROSTER_DISPLAY_FILTERS, rosterTimeHorizon: 'next_op' },
    true,
    true
  ),
  'current_op',
  'next OP horizon should fall back when viewing historical roster'
)

assert.equal(
  resolveEffectiveRosterTimeHorizon(
    { ...DEFAULT_ROSTER_DISPLAY_FILTERS, rosterTimeHorizon: 'next_op' },
    true,
    false
  ),
  'next_op'
)

const currentProjection = buildRosterDisplayProjection({
  horizon: 'current_op',
  catalog,
  entries: [entry],
  roster: entry.members,
  assets: [],
})
assert.equal(currentProjection.isProjected, false)
assert.equal(currentProjection.entries[0]?.members.length, 1)
assert.equal(currentProjection.entries[0]?.scheduledAssignees.length, 1)

const nextProjection = buildRosterDisplayProjection({
  horizon: 'next_op',
  catalog,
  entries: [entry],
  roster: entry.members,
  assets: [],
})
assert.equal(nextProjection.isProjected, true)
assert.equal(nextProjection.entries[0]?.members.length, 1)
assert.equal(nextProjection.entries[0]?.members[0]?.email, 'scheduled@example.com')
assert.equal(nextProjection.entries[0]?.scheduledAssignees.length, 0)

assert.equal(
  positionMatchesScheduledAssigneeFilters(entry, {
    ...DEFAULT_ROSTER_DISPLAY_FILTERS,
    showPositionsWithScheduledAssignees: false,
    showPositionsWithoutScheduledAssignees: false,
    rosterTimeHorizon: 'next_op',
  }),
  true,
  'scheduled assignee filters should be bypassed in projected mode'
)

assert.equal(
  singleResourceNodeVisible(true, DEFAULT_ROSTER_DISPLAY_FILTERS, true),
  DEFAULT_ROSTER_DISPLAY_FILTERS.showCurrentSingleResources
)
assert.equal(
  singleResourceNodeVisible(true, DEFAULT_ROSTER_DISPLAY_FILTERS, false),
  DEFAULT_ROSTER_DISPLAY_FILTERS.showScheduledSingleResources
)

const currentGroups = buildPositionOrgChartAssigneeGroups(entry, 'current_op')
assert(currentGroups.some((group) => group.kind === 'assigned'))
assert(currentGroups.some((group) => group.kind === 'scheduled_next_op'))
assert(currentGroups.some((group) => group.kind === 'leaving_next_op'))

const nextGroups = buildPositionOrgChartAssigneeGroups(nextProjection.entries[0]!, 'next_op')
assert.equal(nextGroups.length, 1)
assert.equal(nextGroups[0]?.kind, 'assigned')
assert.equal(nextGroups[0]?.members.length, 1)
assert.equal(nextGroups[0]?.members[0]?.email, 'scheduled@example.com')

assert.equal(summarizeActiveDisplayFilters(DEFAULT_ROSTER_DISPLAY_FILTERS).totalCount, 14)

console.log('verify-org-chart-time-horizon: all checks passed')
