import { describe, expect, it } from 'vitest'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  buildIcs233AssignmentOptions,
  collectIcs233RemoteNotifications,
  formatIcs233AssigneeLabel,
  getIcs233AssignmentRecipientEmails,
  getIcs233AssignmentValue,
  isCurrentUserAssignedToIcs233Action,
  normalizeIcs233Row,
  parseIcs233AssignmentValue,
  type Ics233TaskRow,
} from '@/lib/ics233-workflow'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const roster: WorkspaceRosterMember[] = [
  {
    id: 'member-1',
    email: 'alice@example.com',
    icsPosition: 'Operations Section Chief',
    icsPositions: ['Operations Section Chief'],
    status: 'active',
  } as WorkspaceRosterMember,
  {
    id: 'member-2',
    email: 'bob@example.com',
    icsPosition: 'Planning Section Chief',
    icsPositions: ['Planning Section Chief'],
    status: 'active',
  } as WorkspaceRosterMember,
]

const assetsByKey: Record<string, ResourceListItemData> = {
  'asset-1': {
    assetKey: 'asset-1',
    name: 'Engine 12',
    type: 'Engine',
    pointOfContactMemberId: 'member-2',
  } as ResourceListItemData,
}

const positionEntries: PositionRosterEntry[] = [
  {
    position: 'Operations Section Chief',
    resourceCategories: [
      {
        id: 'cat-1',
        name: 'Strike Teams',
        filledMemberId: 'member-1',
      },
    ],
  } as PositionRosterEntry,
  {
    position: 'Planning Section Chief',
    resourceCategories: [
      {
        id: 'cat-2',
        name: 'GIS Support',
        filledMemberId: null,
      },
    ],
  } as PositionRosterEntry,
]

const context = { roster, assetsByKey, positionEntries }

describe('ics233-workflow', () => {
  it('normalizes legacy assignee-only rows', () => {
    const row = normalizeIcs233Row({
      id: 1,
      task: 'Legacy task',
      assignee: 'Operations Section Chief',
      status: 'Cannot Complete',
    })

    expect(row.assigneeType).toBe('position')
    expect(row.assigneePosition).toBe('Operations Section Chief')
    expect(row.status).toBe('Incomplete')
  })

  it('parses extended assignee values', () => {
    expect(parseIcs233AssignmentValue('user:alice@example.com', context)).toMatchObject({
      assigneeType: 'user',
      assigneeUserEmail: 'alice@example.com',
    })
    expect(parseIcs233AssignmentValue('asset:asset-1', context)).toMatchObject({
      assigneeType: 'asset',
      assigneeAssetKey: 'asset-1',
      assigneeLabel: 'Engine 12',
    })
    expect(parseIcs233AssignmentValue('resource_category:cat-1', context)).toMatchObject({
      assigneeType: 'resource_category',
      assigneeResourceCategoryId: 'cat-1',
      assigneeResourceCategoryPosition: 'Operations Section Chief',
    })
  })

  it('builds grouped assignment options including assets and categories', () => {
    const options = buildIcs233AssignmentOptions({
      roster,
      rosterPositionOptions: ['Operations Section Chief'],
      workspaceAssets: [assetsByKey['asset-1']],
      positionEntries,
    })

    expect(options.some((option) => option.group === 'Incident Assets')).toBe(true)
    expect(options.some((option) => option.group === 'Resource Categories')).toBe(true)
  })

  it('resolves recipient emails for asset and resource category assignees', () => {
    const assetRow: Ics233TaskRow = {
      id: 1,
      task: 'Check engine',
      assigneeType: 'asset',
      assigneeUserEmail: null,
      assigneePosition: null,
      assigneeAssetKey: 'asset-1',
      assigneeResourceCategoryId: null,
      assigneeResourceCategoryPosition: null,
      assigneeLabel: 'Engine 12',
      assignedByEmail: 'alice@example.com',
      pointOfContact: '',
      pocBriefed: 'No',
      start: '',
      deadline: '',
      status: 'Not Started',
    }

    expect(getIcs233AssignmentRecipientEmails(assetRow, roster, context)).toEqual([
      'bob@example.com',
    ])

    const filledCategoryRow: Ics233TaskRow = {
      ...assetRow,
      assigneeType: 'resource_category',
      assigneeAssetKey: null,
      assigneeResourceCategoryId: 'cat-1',
      assigneeResourceCategoryPosition: 'Operations Section Chief',
    }
    expect(getIcs233AssignmentRecipientEmails(filledCategoryRow, roster, context)).toEqual([
      'alice@example.com',
    ])

    const unfilledCategoryRow: Ics233TaskRow = {
      ...filledCategoryRow,
      assigneeResourceCategoryId: 'cat-2',
      assigneeResourceCategoryPosition: 'Planning Section Chief',
    }
    expect(getIcs233AssignmentRecipientEmails(unfilledCategoryRow, roster, context)).toEqual([
      'bob@example.com',
    ])
  })

  it('checks assignment permissions for asset POC and resource categories', () => {
    const assetRow: Ics233TaskRow = {
      id: 1,
      task: 'Check engine',
      assigneeType: 'asset',
      assigneeUserEmail: null,
      assigneePosition: null,
      assigneeAssetKey: 'asset-1',
      assigneeResourceCategoryId: null,
      assigneeResourceCategoryPosition: null,
      assigneeLabel: 'Engine 12',
      assignedByEmail: 'alice@example.com',
      pointOfContact: '',
      pocBriefed: 'No',
      start: '',
      deadline: '',
      status: 'Not Started',
    }

    expect(isCurrentUserAssignedToIcs233Action(assetRow, 'bob@example.com', roster, context)).toBe(
      true
    )
    expect(isCurrentUserAssignedToIcs233Action(assetRow, 'alice@example.com', roster, context)).toBe(
      false
    )

    const categoryRow: Ics233TaskRow = {
      ...assetRow,
      assigneeType: 'resource_category',
      assigneeAssetKey: null,
      assigneeResourceCategoryId: 'cat-1',
      assigneeResourceCategoryPosition: 'Operations Section Chief',
    }
    expect(
      isCurrentUserAssignedToIcs233Action(categoryRow, 'alice@example.com', roster, context)
    ).toBe(true)
  })

  it('round-trips assignment values and labels', () => {
    const row: Ics233TaskRow = {
      id: 3,
      task: 'Deploy GIS',
      assigneeType: 'resource_category',
      assigneeUserEmail: null,
      assigneePosition: null,
      assigneeAssetKey: null,
      assigneeResourceCategoryId: 'cat-2',
      assigneeResourceCategoryPosition: 'Planning Section Chief',
      assigneeLabel: 'GIS Support · Planning Section Chief',
      assignedByEmail: null,
      pointOfContact: '',
      pocBriefed: 'No',
      start: '',
      deadline: '',
      status: 'Not Started',
    }

    expect(getIcs233AssignmentValue(row)).toBe('resource_category:cat-2')
    expect(formatIcs233AssigneeLabel(row, roster, context)).toBe(
      'Category: GIS Support (Planning Section Chief)'
    )
  })

  it('collects remote notifications when assignment changes', () => {
    const previous: Ics233TaskRow[] = []
    const next: Ics233TaskRow[] = [
      {
        id: 1,
        task: 'Review map',
        assigneeType: 'user',
        assigneeUserEmail: 'alice@example.com',
        assigneePosition: null,
        assigneeAssetKey: null,
        assigneeResourceCategoryId: null,
        assigneeResourceCategoryPosition: null,
        assigneeLabel: 'alice@example.com',
        assignedByEmail: 'bob@example.com',
        pointOfContact: '',
        pocBriefed: 'No',
        start: '',
        deadline: '',
        status: 'Not Started',
      },
    ]

    const notifications = collectIcs233RemoteNotifications(
      previous,
      next,
      roster,
      'alice@example.com',
      'Incident Alpha',
      context
    )

    expect(notifications).toHaveLength(1)
    expect(notifications[0]?.title).toContain('ICS-233 action assigned')
  })
})
