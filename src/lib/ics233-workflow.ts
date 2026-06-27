import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics233ActionStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Incomplete'

export type Ics233AssigneeType =
  | 'unassigned'
  | 'user'
  | 'position'
  | 'asset'
  | 'resource_category'

export type Ics233TaskRow = {
  id: number
  task: string
  assigneeType: Ics233AssigneeType
  assigneeUserEmail: string | null
  assigneePosition: string | null
  assigneeAssetKey: string | null
  assigneeResourceCategoryId: string | null
  assigneeResourceCategoryPosition: string | null
  assigneeLabel: string
  assignedByEmail: string | null
  pointOfContact: string
  pocBriefed: 'Yes' | 'No'
  start: string
  deadline: string
  status: Ics233ActionStatus
}

export type Ics233AssignmentOptionGroup =
  | 'Assignment'
  | 'Roster Members'
  | 'Roster Positions'
  | 'Incident Assets'
  | 'Resource Categories'

export type Ics233AssignmentOption = {
  value: string
  label: string
  group: Ics233AssignmentOptionGroup
}

export type Ics233AssignmentContext = {
  roster: WorkspaceRosterMember[]
  assetsByKey: Record<string, ResourceListItemData>
  positionEntries: PositionRosterEntry[]
}

export const ICS233_ALL_STATUS_OPTIONS: Ics233ActionStatus[] = [
  'Not Started',
  'In Progress',
  'Complete',
  'Incomplete',
]

export const ICS233_ASSIGNEE_STATUS_OPTIONS: Ics233ActionStatus[] = [
  'In Progress',
  'Complete',
  'Incomplete',
]

export function getIcs233AssigneeStatusSelectOptions(
  currentStatus: Ics233ActionStatus
): Ics233ActionStatus[] {
  return currentStatus === 'Not Started'
    ? ['Not Started', ...ICS233_ASSIGNEE_STATUS_OPTIONS]
    : [...ICS233_ASSIGNEE_STATUS_OPTIONS]
}

type LegacyIcs233Row = Partial<Ics233TaskRow> & {
  assignee?: string
  status?: string
}

function emptyAssigneeFields(): Pick<
  Ics233TaskRow,
  | 'assigneeUserEmail'
  | 'assigneePosition'
  | 'assigneeAssetKey'
  | 'assigneeResourceCategoryId'
  | 'assigneeResourceCategoryPosition'
> {
  return {
    assigneeUserEmail: null,
    assigneePosition: null,
    assigneeAssetKey: null,
    assigneeResourceCategoryId: null,
    assigneeResourceCategoryPosition: null,
  }
}

function normalizeLegacyIcs233Status(status: string | undefined): Ics233ActionStatus {
  if (status === 'Cannot Complete') {
    return 'Incomplete'
  }
  if (
    status === 'Not Started' ||
    status === 'In Progress' ||
    status === 'Complete' ||
    status === 'Incomplete'
  ) {
    return status
  }
  return 'Not Started'
}

function normalizeAssigneeType(type: unknown): Ics233AssigneeType {
  if (
    type === 'user' ||
    type === 'position' ||
    type === 'asset' ||
    type === 'resource_category' ||
    type === 'unassigned'
  ) {
    return type
  }
  return 'unassigned'
}

export function normalizeIcs233Row(row: LegacyIcs233Row): Ics233TaskRow {
  if (
    row.id !== undefined &&
    row.assigneeType !== undefined &&
    row.assigneeLabel !== undefined
  ) {
    return {
      id: row.id,
      task: row.task ?? '',
      assigneeType: normalizeAssigneeType(row.assigneeType),
      assigneeUserEmail: row.assigneeUserEmail ?? null,
      assigneePosition: row.assigneePosition ?? null,
      assigneeAssetKey: row.assigneeAssetKey ?? null,
      assigneeResourceCategoryId: row.assigneeResourceCategoryId ?? null,
      assigneeResourceCategoryPosition: row.assigneeResourceCategoryPosition ?? null,
      assigneeLabel: row.assigneeLabel,
      assignedByEmail: row.assignedByEmail ?? null,
      pointOfContact: row.pointOfContact ?? '',
      pocBriefed: row.pocBriefed ?? 'No',
      start: row.start ?? '',
      deadline: row.deadline ?? '',
      status: normalizeLegacyIcs233Status(row.status),
    }
  }

  const legacyAssignee = row.assignee?.trim() ?? ''
  return {
    id: row.id ?? 0,
    task: row.task ?? '',
    assigneeType: legacyAssignee ? 'position' : 'unassigned',
    ...emptyAssigneeFields(),
    assigneePosition: legacyAssignee || null,
    assigneeLabel: legacyAssignee || 'Unassigned',
    assignedByEmail: null,
    pointOfContact: row.pointOfContact ?? '',
    pocBriefed: row.pocBriefed ?? 'No',
    start: row.start ?? '',
    deadline: row.deadline ?? '',
    status: normalizeLegacyIcs233Status(row.status),
  }
}

function findResourceCategory(
  context: Ics233AssignmentContext,
  categoryId: string
): { category: PositionRosterEntry['resourceCategories'][number]; position: string } | null {
  for (const entry of context.positionEntries) {
    const category = entry.resourceCategories.find((item) => item.id === categoryId)
    if (category) {
      return { category, position: entry.position }
    }
  }
  return null
}

function memberEmailById(roster: WorkspaceRosterMember[], memberId: string | null): string | null {
  if (!memberId) return null
  return roster.find((member) => member.id === memberId)?.email ?? null
}

export function parseIcs233AssignmentValue(
  value: string,
  context?: Ics233AssignmentContext
): Pick<
  Ics233TaskRow,
  | 'assigneeType'
  | 'assigneeUserEmail'
  | 'assigneePosition'
  | 'assigneeAssetKey'
  | 'assigneeResourceCategoryId'
  | 'assigneeResourceCategoryPosition'
  | 'assigneeLabel'
> {
  if (value.startsWith('user:')) {
    const email = value.slice('user:'.length)
    return {
      assigneeType: 'user',
      ...emptyAssigneeFields(),
      assigneeUserEmail: email,
      assigneeLabel: email,
    }
  }

  if (value.startsWith('position:')) {
    const position = value.slice('position:'.length)
    return {
      assigneeType: 'position',
      ...emptyAssigneeFields(),
      assigneePosition: position,
      assigneeLabel: position,
    }
  }

  if (value.startsWith('asset:')) {
    const assetKey = value.slice('asset:'.length)
    const asset = context?.assetsByKey[assetKey]
    return {
      assigneeType: 'asset',
      ...emptyAssigneeFields(),
      assigneeAssetKey: assetKey,
      assigneeLabel: asset?.name ?? assetKey,
    }
  }

  if (value.startsWith('resource_category:')) {
    const categoryId = value.slice('resource_category:'.length)
    const match = context ? findResourceCategory(context, categoryId) : null
    return {
      assigneeType: 'resource_category',
      ...emptyAssigneeFields(),
      assigneeResourceCategoryId: categoryId,
      assigneeResourceCategoryPosition: match?.position ?? null,
      assigneeLabel: match ? `${match.category.name} · ${match.position}` : categoryId,
    }
  }

  return {
    assigneeType: 'unassigned',
    ...emptyAssigneeFields(),
    assigneeLabel: 'Unassigned',
  }
}

export function formatIcs233AssigneeLabel(
  row: Pick<
    Ics233TaskRow,
    | 'assigneeType'
    | 'assigneeUserEmail'
    | 'assigneePosition'
    | 'assigneeAssetKey'
    | 'assigneeResourceCategoryId'
    | 'assigneeResourceCategoryPosition'
    | 'assigneeLabel'
  >,
  roster: WorkspaceRosterMember[],
  context?: Ics233AssignmentContext
): string {
  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    const member = roster.find(
      (entry) => entry.email.toLowerCase() === row.assigneeUserEmail!.toLowerCase()
    )
    return member ? `${member.email} (${member.icsPosition})` : row.assigneeUserEmail
  }

  if (row.assigneeType === 'position' && row.assigneePosition) {
    return `Position: ${row.assigneePosition}`
  }

  if (row.assigneeType === 'asset' && row.assigneeAssetKey) {
    const asset = context?.assetsByKey[row.assigneeAssetKey]
    return `Asset: ${asset?.name ?? row.assigneeLabel ?? row.assigneeAssetKey}`
  }

  if (row.assigneeType === 'resource_category' && row.assigneeResourceCategoryId) {
    const match = context
      ? findResourceCategory(context, row.assigneeResourceCategoryId)
      : null
    if (match) {
      return `Category: ${match.category.name} (${match.position})`
    }
    if (row.assigneeResourceCategoryPosition) {
      return `Category: ${row.assigneeLabel} (${row.assigneeResourceCategoryPosition})`
    }
    return `Category: ${row.assigneeLabel}`
  }

  return 'Unassigned'
}

export function getIcs233AssignmentValue(row: Ics233TaskRow): string {
  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return `user:${row.assigneeUserEmail}`
  }
  if (row.assigneeType === 'position' && row.assigneePosition) {
    return `position:${row.assigneePosition}`
  }
  if (row.assigneeType === 'asset' && row.assigneeAssetKey) {
    return `asset:${row.assigneeAssetKey}`
  }
  if (row.assigneeType === 'resource_category' && row.assigneeResourceCategoryId) {
    return `resource_category:${row.assigneeResourceCategoryId}`
  }
  return 'unassigned:'
}

export function buildIcs233AssignmentOptions(input: {
  roster: WorkspaceRosterMember[]
  rosterPositionOptions: readonly string[]
  workspaceAssets: ResourceListItemData[]
  positionEntries: PositionRosterEntry[]
}): Ics233AssignmentOption[] {
  const options: Ics233AssignmentOption[] = [
    { value: 'unassigned:', label: 'Unassigned', group: 'Assignment' },
  ]

  for (const member of input.roster.filter((entry) => entry.status !== 'removed')) {
    options.push({
      value: `user:${member.email}`,
      label: `${member.email} (${member.icsPosition})`,
      group: 'Roster Members',
    })
  }

  const positions = [
    ...new Set([
      ...input.rosterPositionOptions,
      ...input.roster.map((member) => member.icsPosition),
    ]),
  ].sort()

  for (const position of positions) {
    options.push({
      value: `position:${position}`,
      label: position,
      group: 'Roster Positions',
    })
  }

  for (const asset of input.workspaceAssets) {
    options.push({
      value: `asset:${asset.assetKey}`,
      label: `${asset.name}${asset.type ? ` · ${asset.type}` : ''}`,
      group: 'Incident Assets',
    })
  }

  for (const entry of input.positionEntries) {
    for (const category of entry.resourceCategories) {
      options.push({
        value: `resource_category:${category.id}`,
        label: `${category.name} · ${entry.position}`,
        group: 'Resource Categories',
      })
    }
  }

  return options
}

/** @deprecated Use buildIcs233AssignmentOptions object form */
export function buildIcs233AssignmentOptionsLegacy(
  roster: WorkspaceRosterMember[],
  rosterPositionOptions: readonly string[]
): Ics233AssignmentOption[] {
  return buildIcs233AssignmentOptions({
    roster,
    rosterPositionOptions,
    workspaceAssets: [],
    positionEntries: [],
  })
}

export function getIcs233AssignmentRecipientEmails(
  row: Pick<
    Ics233TaskRow,
    | 'assigneeType'
    | 'assigneeUserEmail'
    | 'assigneePosition'
    | 'assigneeAssetKey'
    | 'assigneeResourceCategoryId'
    | 'assigneeResourceCategoryPosition'
  >,
  roster: WorkspaceRosterMember[],
  context?: Ics233AssignmentContext
): string[] {
  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return [row.assigneeUserEmail]
  }

  if (row.assigneeType === 'position' && row.assigneePosition) {
    return roster
      .filter(
        (member) =>
          member.status !== 'removed' &&
          member.icsPositions.includes(row.assigneePosition as string)
      )
      .map((member) => member.email)
  }

  if (row.assigneeType === 'asset' && row.assigneeAssetKey) {
    const asset = context?.assetsByKey[row.assigneeAssetKey]
    const pocMemberId = asset?.pointOfContactMemberId ?? null
    const pocEmail = memberEmailById(roster, pocMemberId)
    return pocEmail ? [pocEmail] : []
  }

  if (row.assigneeType === 'resource_category' && row.assigneeResourceCategoryId) {
    const match = context
      ? findResourceCategory(context, row.assigneeResourceCategoryId)
      : null
    const filledMemberEmail = memberEmailById(roster, match?.category.filledMemberId ?? null)
    if (filledMemberEmail) {
      return [filledMemberEmail]
    }
    const position = row.assigneeResourceCategoryPosition ?? match?.position
    if (!position) return []
    return roster
      .filter(
        (member) =>
          member.status !== 'removed' && member.icsPositions.includes(position)
      )
      .map((member) => member.email)
  }

  return []
}

export function isCurrentUserAssignedToIcs233Action(
  row: Pick<
    Ics233TaskRow,
    | 'assigneeType'
    | 'assigneeUserEmail'
    | 'assigneePosition'
    | 'assigneeAssetKey'
    | 'assigneeResourceCategoryId'
    | 'assigneeResourceCategoryPosition'
  >,
  profileEmail: string | null | undefined,
  roster: WorkspaceRosterMember[],
  context?: Ics233AssignmentContext
): boolean {
  if (!profileEmail) {
    return false
  }

  const normalizedEmail = profileEmail.toLowerCase()
  const currentMember = roster.find(
    (member) => member.status !== 'removed' && member.email.toLowerCase() === normalizedEmail
  )
  if (!currentMember) {
    return false
  }

  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return row.assigneeUserEmail.toLowerCase() === normalizedEmail
  }

  if (row.assigneeType === 'position' && row.assigneePosition) {
    return currentMember.icsPositions.includes(row.assigneePosition)
  }

  if (row.assigneeType === 'asset' && row.assigneeAssetKey) {
    const asset = context?.assetsByKey[row.assigneeAssetKey]
    return Boolean(asset?.pointOfContactMemberId && asset.pointOfContactMemberId === currentMember.id)
  }

  if (row.assigneeType === 'resource_category' && row.assigneeResourceCategoryId) {
    const match = context
      ? findResourceCategory(context, row.assigneeResourceCategoryId)
      : null
    if (match?.category.filledMemberId) {
      return match.category.filledMemberId === currentMember.id
    }
    const position = row.assigneeResourceCategoryPosition ?? match?.position
    return position ? currentMember.icsPositions.includes(position) : false
  }

  return false
}

export function createDefaultIcs233ActionRow(
  id: number,
  defaultDateTime: string
): Ics233TaskRow {
  return {
    id,
    task: '',
    assigneeType: 'unassigned',
    ...emptyAssigneeFields(),
    assigneeLabel: 'Unassigned',
    assignedByEmail: null,
    pointOfContact: '',
    pocBriefed: 'No',
    start: defaultDateTime,
    deadline: defaultDateTime,
    status: 'Not Started',
  }
}

export type Ics233NotificationPayload = {
  recipientEmail: string
  title: string
  summary: string
}

function hasIcs233AssignmentChanged(previous: Ics233TaskRow, next: Ics233TaskRow): boolean {
  return (
    previous.assigneeType !== next.assigneeType ||
    previous.assigneeUserEmail !== next.assigneeUserEmail ||
    previous.assigneePosition !== next.assigneePosition ||
    previous.assigneeAssetKey !== next.assigneeAssetKey ||
    previous.assigneeResourceCategoryId !== next.assigneeResourceCategoryId ||
    previous.assigneeResourceCategoryPosition !== next.assigneeResourceCategoryPosition
  )
}

export function collectIcs233RemoteNotifications(
  previousRows: Ics233TaskRow[],
  nextRows: Ics233TaskRow[],
  roster: WorkspaceRosterMember[],
  profileEmail: string | null,
  workspaceLabel: string,
  context?: Ics233AssignmentContext
): Ics233NotificationPayload[] {
  if (!profileEmail) {
    return []
  }

  const normalizedProfileEmail = profileEmail.toLowerCase()
  const notifications: Ics233NotificationPayload[] = []

  for (const row of nextRows) {
    const previous = previousRows.find((entry) => entry.id === row.id)
    const taskLabel = row.task.trim() || `Action #${row.id}`
    const assignmentChanged = !previous || hasIcs233AssignmentChanged(previous, row)

    if (
      assignmentChanged &&
      row.assigneeType !== 'unassigned' &&
      isCurrentUserAssignedToIcs233Action(row, profileEmail, roster, context) &&
      row.assignedByEmail?.toLowerCase() !== normalizedProfileEmail
    ) {
      notifications.push({
        recipientEmail: profileEmail,
        title: `ICS-233 action assigned: ${taskLabel}`,
        summary: `${row.assignedByEmail ?? 'A roster member'} assigned you "${taskLabel}" in ${workspaceLabel}.`,
      })
    }

    if (
      previous &&
      previous.status !== row.status &&
      row.assignedByEmail?.toLowerCase() === normalizedProfileEmail
    ) {
      const assigneeLabel = formatIcs233AssigneeLabel(row, roster, context)
      notifications.push({
        recipientEmail: profileEmail,
        title: `ICS-233 action marked ${row.status}`,
        summary: `${assigneeLabel} marked "${taskLabel}" as ${row.status} in ${workspaceLabel}.`,
      })
    }
  }

  return notifications
}

export const ICS233_ASSIGNMENT_OPTION_GROUPS: readonly Ics233AssignmentOptionGroup[] = [
  'Assignment',
  'Roster Members',
  'Roster Positions',
  'Incident Assets',
  'Resource Categories',
]
