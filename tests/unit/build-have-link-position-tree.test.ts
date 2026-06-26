import { describe, expect, it } from 'vitest'
import {
  buildHaveLinkPositionTree,
  filterHaveLinkPositionTree,
  getAssignedToPositionChildren,
  getAssignedToPositionSelectableRefs,
  partitionAssignedToPositionChildren,
} from '@/features/ics215/build-have-link-position-tree'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const member: WorkspaceRosterMember = {
  id: 'member-1',
  email: 'jane@example.com',
  status: 'active',
  addedAt: '',
  icsPositions: ['Division Alpha'],
  assignmentKind: 'position',
  orgChartReportsTo: null,
  pendingOrgChartReportsTo: null,
  competencyByPosition: {},
  checkInStatus: null,
}

const scheduledMember: WorkspaceRosterMember = {
  ...member,
  id: 'member-2',
  email: 'bob@example.com',
  icsPositions: [],
}

const retiringPosition: PositionRosterEntry = {
  position: 'Retiring Branch',
  members: [],
  scheduledAssignees: [],
  scheduledUnassignees: [],
  scheduledOrgChartMembers: [],
  assets: [],
  scheduledAssignAssets: [],
  scheduledUnassignAssets: [],
  scheduledOrgChartAssets: [],
  resourceCategories: [],
  memberSchedulePolicy: 'none',
  editIcs201: true,
  allowWorkAssignment: true,
  positionType: null,
  customTypeLabel: null,
  positionTypeLabel: null,
  opAdvanceLabel: 'retire_on_op_advance',
}

const activePosition: PositionRosterEntry = {
  position: 'Division Alpha',
  members: [member],
  scheduledAssignees: [scheduledMember],
  scheduledUnassignees: [],
  scheduledOrgChartMembers: [],
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
  scheduledAssignAssets: [],
  scheduledUnassignAssets: [],
  scheduledOrgChartAssets: [],
  resourceCategories: [
    {
      id: 'cat-1',
      name: 'Helo crew',
      lifecycle: 'active',
      filledMemberId: null,
      filledAssetKey: null,
      filledMemberEmail: null,
      filledAssetName: null,
      sortOrder: 0,
    },
  ],
  memberSchedulePolicy: 'none',
  editIcs201: true,
  allowWorkAssignment: true,
  positionType: null,
  customTypeLabel: null,
  positionTypeLabel: null,
}

describe('build-have-link-position-tree', () => {
  it('excludes positions scheduled to retire', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [retiringPosition, activePosition],
      roster: [member, scheduledMember],
    })
    expect(tree.positions.map((node) => node.position)).toEqual(['Division Alpha'])
  })

  it('groups people, assets, and categories under a position', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [activePosition],
      roster: [member, scheduledMember],
    })
    expect(tree.positions).toHaveLength(1)
    const node = tree.positions[0]!
    expect(node.summary.currentOp).toBe(2)
    expect(node.summary.nextOp).toBe(1)
    expect(node.summary.categories).toBe(1)
    expect(node.selectableRefs).toHaveLength(4)
    expect(node.selectableRefs).not.toContain(node.positionRef)
  })

  it('returns assigned children sorted active before scheduled next OP', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [activePosition],
      roster: [member, scheduledMember],
    })
    const node = tree.positions[0]!
    const assigned = getAssignedToPositionChildren(node)
    expect(assigned).toHaveLength(3)
    expect(assigned.every((child) => child.section === 'people' || child.section === 'assets')).toBe(
      true
    )
    expect(assigned.slice(0, 2).every((child) => child.presence === 'active')).toBe(true)
    expect(assigned[2]?.presence).toBe('scheduled_next_op')
  })

  it('excludes resource categories from assigned selectable refs', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [activePosition],
      roster: [member, scheduledMember],
    })
    const node = tree.positions[0]!
    const assignedRefs = getAssignedToPositionSelectableRefs(node)
    const categoryRefs = node.children
      .filter((child) => child.section === 'resource_categories')
      .map((child) => child.ref)
    for (const categoryRef of categoryRefs) {
      expect(assignedRefs).not.toContain(categoryRef)
    }
    expect(assignedRefs.length).toBe(3)
  })

  it('partitions assigned children into current and next OP columns', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [activePosition],
      roster: [member, scheduledMember],
    })
    const node = tree.positions[0]!
    const { currentOp, nextOp } = partitionAssignedToPositionChildren(node)
    expect(currentOp).toHaveLength(2)
    expect(nextOp).toHaveLength(1)
    expect(currentOp.every((child) => child.presence === 'active')).toBe(true)
    expect(nextOp.every((child) => child.presence === 'scheduled_next_op')).toBe(true)
  })

  it('filters tree by query and keeps matching positions', () => {
    const tree = buildHaveLinkPositionTree({
      positionEntries: [activePosition],
      roster: [member, scheduledMember],
    })
    const filtered = filterHaveLinkPositionTree(tree, 'Division Alpha')
    expect(filtered.positions).toHaveLength(1)
    expect(filtered.positions[0]?.position).toBe('Division Alpha')
  })
})
