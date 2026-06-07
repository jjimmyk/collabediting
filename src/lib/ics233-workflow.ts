import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics233ActionStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Incomplete'

export type Ics233AssigneeType = 'unassigned' | 'user' | 'position'

export type Ics233TaskRow = {
  id: number
  task: string
  assigneeType: Ics233AssigneeType
  assigneeUserEmail: string | null
  assigneePosition: string | null
  assigneeLabel: string
  assignedByEmail: string | null
  pointOfContact: string
  pocBriefed: 'Yes' | 'No'
  start: string
  deadline: string
  status: Ics233ActionStatus
}

export type Ics233AssignmentOption = {
  value: string
  label: string
  group: 'Assignment' | 'Roster Members' | 'Roster Positions'
}

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

export function normalizeIcs233Row(row: LegacyIcs233Row): Ics233TaskRow {
  if (
    row.id !== undefined &&
    row.assigneeType !== undefined &&
    row.assigneeLabel !== undefined
  ) {
    return {
      id: row.id,
      task: row.task ?? '',
      assigneeType: row.assigneeType,
      assigneeUserEmail: row.assigneeUserEmail ?? null,
      assigneePosition: row.assigneePosition ?? null,
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
    assigneeUserEmail: null,
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

export function parseIcs233AssignmentValue(value: string): Pick<
  Ics233TaskRow,
  'assigneeType' | 'assigneeUserEmail' | 'assigneePosition' | 'assigneeLabel'
> {
  if (value.startsWith('user:')) {
    const email = value.slice('user:'.length)
    return {
      assigneeType: 'user',
      assigneeUserEmail: email,
      assigneePosition: null,
      assigneeLabel: email,
    }
  }

  if (value.startsWith('position:')) {
    const position = value.slice('position:'.length)
    return {
      assigneeType: 'position',
      assigneeUserEmail: null,
      assigneePosition: position,
      assigneeLabel: position,
    }
  }

  return {
    assigneeType: 'unassigned',
    assigneeUserEmail: null,
    assigneePosition: null,
    assigneeLabel: 'Unassigned',
  }
}

export function formatIcs233AssigneeLabel(
  row: Pick<Ics233TaskRow, 'assigneeType' | 'assigneeUserEmail' | 'assigneePosition' | 'assigneeLabel'>,
  roster: WorkspaceRosterMember[]
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

  return 'Unassigned'
}

export function getIcs233AssignmentValue(row: Ics233TaskRow): string {
  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return `user:${row.assigneeUserEmail}`
  }
  if (row.assigneeType === 'position' && row.assigneePosition) {
    return `position:${row.assigneePosition}`
  }
  return 'unassigned:'
}

export function buildIcs233AssignmentOptions(
  roster: WorkspaceRosterMember[],
  rosterPositionOptions: readonly string[]
): Ics233AssignmentOption[] {
  const options: Ics233AssignmentOption[] = [
    { value: 'unassigned:', label: 'Unassigned', group: 'Assignment' },
  ]

  for (const member of roster.filter((entry) => entry.status !== 'removed')) {
    options.push({
      value: `user:${member.email}`,
      label: `${member.email} (${member.icsPosition})`,
      group: 'Roster Members',
    })
  }

  const positions = [
    ...new Set([
      ...rosterPositionOptions,
      ...roster.map((member) => member.icsPosition),
    ]),
  ].sort()

  for (const position of positions) {
    options.push({
      value: `position:${position}`,
      label: position,
      group: 'Roster Positions',
    })
  }

  return options
}

export function getIcs233AssignmentRecipientEmails(
  row: Pick<Ics233TaskRow, 'assigneeType' | 'assigneeUserEmail' | 'assigneePosition'>,
  roster: WorkspaceRosterMember[]
): string[] {
  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return [row.assigneeUserEmail]
  }

  if (row.assigneeType === 'position' && row.assigneePosition) {
    return roster
      .filter(
        (member) =>
          member.status !== 'removed' && member.icsPosition === row.assigneePosition
      )
      .map((member) => member.email)
  }

  return []
}

export function isCurrentUserAssignedToIcs233Action(
  row: Pick<Ics233TaskRow, 'assigneeType' | 'assigneeUserEmail' | 'assigneePosition'>,
  profileEmail: string | null | undefined,
  roster: WorkspaceRosterMember[]
): boolean {
  if (!profileEmail) {
    return false
  }

  const normalizedEmail = profileEmail.toLowerCase()

  if (row.assigneeType === 'user' && row.assigneeUserEmail) {
    return row.assigneeUserEmail.toLowerCase() === normalizedEmail
  }

  if (row.assigneeType === 'position' && row.assigneePosition) {
    return roster.some(
      (member) =>
        member.status !== 'removed' &&
        member.email.toLowerCase() === normalizedEmail &&
        member.icsPosition === row.assigneePosition
    )
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
    assigneeUserEmail: null,
    assigneePosition: null,
    assigneeLabel: 'Unassigned',
    assignedByEmail: null,
    pointOfContact: '',
    pocBriefed: 'No',
    start: defaultDateTime,
    deadline: defaultDateTime,
    status: 'Not Started',
  }
}
