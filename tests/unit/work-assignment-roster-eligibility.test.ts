import { describe, expect, it } from 'vitest'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  canAssetContinueToNextOp,
  canMemberContinueToNextOp,
  classifyMemberAtPositionEligibility,
  classifyPositionAssigneeEligibility,
} from '@/lib/work-assignment-roster-eligibility'
import { buildWorkAssignmentTargetOptions } from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const basePolicy = {
  allowActiveAssignment: true,
  allowScheduleAssign: true,
  allowScheduleUnassign: true,
}

function makeEntry(overrides: Partial<PositionRosterEntry>): PositionRosterEntry {
  return {
    position: 'Division Alpha',
    members: [],
    scheduledAssignees: [],
    scheduledUnassignees: [],
    scheduledOrgChartMembers: [],
    assets: [],
    scheduledAssignAssets: [],
    scheduledUnassignAssets: [],
    scheduledOrgChartAssets: [],
    resourceCategories: [],
    memberSchedulePolicy: basePolicy,
    editIcs201: true,
    allowWorkAssignment: true,
    positionType: null,
    customTypeLabel: null,
    positionTypeLabel: null,
    ...overrides,
  }
}

describe('work-assignment roster eligibility', () => {
  it('marks members scheduled to unassign as disabled', () => {
    const member: WorkspaceRosterMember = {
      id: 'member-1',
      email: 'alpha@example.gov',
      icsPosition: 'Division Alpha',
      icsPositions: ['Division Alpha'],
      assignmentKind: 'ics_position',
      orgChartReportsTo: null,
      status: 'active',
      checkInStatus: 'not_arrived',
      addedAt: 'now',
      userId: 'user-1',
    }
    const entry = makeEntry({
      members: [member],
      scheduledUnassignees: [member],
    })
    const eligibility = classifyMemberAtPositionEligibility(member, entry)
    expect(eligibility.disabled).toBe(true)
    expect(eligibility.disabledReason).toBe('retiring next OP')
  })

  it('labels scheduled-only positions in assignee options', () => {
    const scheduledMember: WorkspaceRosterMember = {
      id: 'member-2',
      email: 'scheduled@example.gov',
      icsPosition: '',
      icsPositions: [],
      assignmentKind: 'ics_position',
      orgChartReportsTo: null,
      status: 'active',
      checkInStatus: 'not_arrived',
      addedAt: 'now',
      userId: 'user-2',
    }
    const entry = makeEntry({
      scheduledAssignees: [scheduledMember],
    })
    const positionEligibility = classifyPositionAssigneeEligibility(entry)
    expect(positionEligibility.presence).toBe('scheduled_next_op')

    const options = buildWorkAssignmentTargetOptions({
      roster: [scheduledMember],
      positionEntries: [entry],
      schedulesByPosition: {
        'Division Alpha': { assignMemberIds: ['member-2'], unassignMemberIds: [] },
      },
    })
    expect(options.some((option) => option.label.includes('(scheduled next OP)'))).toBe(true)
  })

  it('allows continuing active members to next OP when not already scheduled', () => {
    const member: WorkspaceRosterMember = {
      id: 'member-1',
      email: 'alpha@example.gov',
      icsPosition: 'Division Alpha',
      icsPositions: ['Division Alpha'],
      assignmentKind: 'ics_position',
      orgChartReportsTo: null,
      status: 'active',
      checkInStatus: 'not_arrived',
      addedAt: 'now',
      userId: 'user-1',
    }
    const entry = makeEntry({ members: [member] })
    expect(canMemberContinueToNextOp(member, entry)).toBe(true)
  })

  it('blocks continuing when member is already scheduled for next OP assign', () => {
    const member: WorkspaceRosterMember = {
      id: 'member-1',
      email: 'alpha@example.gov',
      icsPosition: 'Division Alpha',
      icsPositions: ['Division Alpha'],
      assignmentKind: 'ics_position',
      orgChartReportsTo: null,
      status: 'active',
      checkInStatus: 'not_arrived',
      addedAt: 'now',
      userId: 'user-1',
    }
    const entry = makeEntry({
      members: [member],
      scheduledAssignees: [member],
    })
    expect(canMemberContinueToNextOp(member, entry)).toBe(false)
  })

  it('allows continuing active assets to next OP when not already scheduled', () => {
    const entry = makeEntry({
      assets: [
        {
          assetKey: 'helo-1',
          name: 'MH-65',
          type: 'Helicopter',
          pointOfContactMemberId: null,
          pointOfContactEmail: null,
          competencyFunction: null,
        },
      ],
    })
    expect(canAssetContinueToNextOp('helo-1', entry)).toBe(true)
  })
})
