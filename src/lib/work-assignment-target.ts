import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type WorkAssignmentTargetType =
  | 'unassigned'
  | 'position'
  | 'position_competency'
  | 'single_resource'
  | 'member'

export type WorkAssignmentTarget = {
  type: WorkAssignmentTargetType
  position: string | null
  memberId: string | null
  competencyFunction: string | null
  value: string
  label: string
}

const FIELD_SEP = '\x1e'

export function isWorkAssignmentTargetType(value: string): value is WorkAssignmentTargetType {
  return (
    value === 'unassigned' ||
    value === 'position' ||
    value === 'position_competency' ||
    value === 'single_resource' ||
    value === 'member'
  )
}

function encodePosition(position: string): string {
  return `position:${position.trim()}`
}

function encodePositionCompetency(position: string, competency: string): string {
  return `position_competency:${position.trim()}${FIELD_SEP}${competency.trim()}`
}

function encodeSingleResource(memberId: string): string {
  return `single_resource:${memberId.trim()}`
}

function encodeMember(
  memberId: string,
  position: string,
  competency: string | null | undefined
): string {
  const trimmedCompetency = competency?.trim()
  if (trimmedCompetency) {
    return `member:${memberId.trim()}${FIELD_SEP}${position.trim()}${FIELD_SEP}${trimmedCompetency}`
  }
  return `member:${memberId.trim()}${FIELD_SEP}${position.trim()}`
}

export function buildWorkAssignmentTarget(input: {
  type: WorkAssignmentTargetType
  position?: string | null
  memberId?: string | null
  competencyFunction?: string | null
  roster?: WorkspaceRosterMember[]
}): WorkAssignmentTarget {
  const roster = input.roster ?? []
  const position = input.position?.trim() || null
  const memberId = input.memberId?.trim() || null
  const competencyFunction = input.competencyFunction?.trim() || null

  if (input.type === 'unassigned') {
    return {
      type: 'unassigned',
      position: null,
      memberId: null,
      competencyFunction: null,
      value: '',
      label: 'Unassigned',
    }
  }

  if (input.type === 'position' && position) {
    const value = encodePosition(position)
    return {
      type: 'position',
      position,
      memberId: null,
      competencyFunction: null,
      value,
      label: position,
    }
  }

  if (input.type === 'position_competency' && position && competencyFunction) {
    const value = encodePositionCompetency(position, competencyFunction)
    return {
      type: 'position_competency',
      position,
      memberId: null,
      competencyFunction,
      value,
      label: `${position} — ${competencyFunction}`,
    }
  }

  if (input.type === 'single_resource' && memberId) {
    const member = roster.find((entry) => entry.id === memberId)
    const value = encodeSingleResource(memberId)
    const email = member?.email ?? memberId
    const competencySuffix =
      competencyFunction ?? member?.competencyFunction?.trim()
        ? ` (${competencyFunction ?? member?.competencyFunction})`
        : ''
    return {
      type: 'single_resource',
      position: member?.orgChartReportsTo ?? null,
      memberId,
      competencyFunction: competencyFunction ?? member?.competencyFunction ?? null,
      value,
      label: `Single resource: ${email}${competencySuffix}`,
    }
  }

  if (input.type === 'member' && memberId && position) {
    const member = roster.find((entry) => entry.id === memberId)
    const value = encodeMember(memberId, position, competencyFunction)
    const email = member?.email ?? memberId
    const competencySuffix = competencyFunction ? ` — ${competencyFunction}` : ''
    return {
      type: 'member',
      position,
      memberId,
      competencyFunction,
      value,
      label: `${email} (${position})${competencySuffix}`,
    }
  }

  return {
    type: 'unassigned',
    position: null,
    memberId: null,
    competencyFunction: null,
    value: '',
    label: 'Unassigned',
  }
}

export function parseWorkAssignmentTarget(
  raw: string,
  roster: WorkspaceRosterMember[] = []
): WorkAssignmentTarget {
  const trimmed = raw.trim()
  if (!trimmed) {
    return buildWorkAssignmentTarget({ type: 'unassigned', roster })
  }

  if (trimmed.startsWith('position_competency:')) {
    const payload = trimmed.slice('position_competency:'.length)
    const [position, competency] = payload.split(FIELD_SEP)
    if (position && competency) {
      return buildWorkAssignmentTarget({
        type: 'position_competency',
        position,
        competencyFunction: competency,
        roster,
      })
    }
  }

  if (trimmed.startsWith('position:')) {
    const position = trimmed.slice('position:'.length).trim()
    if (position) {
      return buildWorkAssignmentTarget({ type: 'position', position, roster })
    }
  }

  if (trimmed.startsWith('single_resource:')) {
    const memberId = trimmed.slice('single_resource:'.length).trim()
    if (memberId) {
      return buildWorkAssignmentTarget({ type: 'single_resource', memberId, roster })
    }
  }

  if (trimmed.startsWith('member:')) {
    const payload = trimmed.slice('member:'.length)
    const parts = payload.split(FIELD_SEP)
    const memberId = parts[0]?.trim()
    const position = parts[1]?.trim()
    const competencyFunction = parts[2]?.trim() || null
    if (memberId && position) {
      return buildWorkAssignmentTarget({
        type: 'member',
        memberId,
        position,
        competencyFunction,
        roster,
      })
    }
  }

  if (trimmed.startsWith('unassigned:')) {
    return buildWorkAssignmentTarget({ type: 'unassigned', roster })
  }

  return buildWorkAssignmentTarget({ type: 'position', position: trimmed, roster })
}

export function normalizeWorkAssignmentTargetValue(
  raw: string,
  roster: WorkspaceRosterMember[] = []
): string {
  return parseWorkAssignmentTarget(raw, roster).value
}

export function normalizeWorkAssignmentTargetKey(
  raw: string,
  roster: WorkspaceRosterMember[] = []
): string {
  const target = parseWorkAssignmentTarget(raw, roster)
  if (target.type === 'unassigned') return ''
  return target.value.trim().toLowerCase()
}

export function workAssignmentTargetsEqual(
  left: string,
  right: string,
  roster: WorkspaceRosterMember[] = []
): boolean {
  return (
    normalizeWorkAssignmentTargetKey(left, roster) ===
    normalizeWorkAssignmentTargetKey(right, roster)
  )
}

export function formatWorkAssignmentTargetLabel(
  raw: string,
  roster: WorkspaceRosterMember[] = []
): string {
  return parseWorkAssignmentTarget(raw, roster).label
}

export function updateMemberTargetCompetency(
  raw: string,
  competencyFunction: string | null,
  roster: WorkspaceRosterMember[] = []
): string {
  const target = parseWorkAssignmentTarget(raw, roster)
  if (target.type !== 'member' || !target.memberId || !target.position) {
    return raw
  }
  return buildWorkAssignmentTarget({
    type: 'member',
    memberId: target.memberId,
    position: target.position,
    competencyFunction,
    roster,
  }).value
}

function memberMatchesCompetency(
  member: WorkspaceRosterMember,
  position: string,
  competency: string
): boolean {
  const normalized = competency.trim().toLowerCase()
  const memberCompetency =
    member.competencyByPosition?.[position]?.trim().toLowerCase() ??
    member.competencyFunction?.trim().toLowerCase() ??
    ''
  return memberCompetency.length > 0 && memberCompetency === normalized
}

export function resolveWorkAssignmentTargetRecipients(
  raw: string,
  roster: WorkspaceRosterMember[],
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>
): string[] {
  const target = parseWorkAssignmentTarget(raw, roster)
  if (target.type === 'unassigned' || !target.value) {
    return []
  }

  const memberById = new Map(roster.map((member) => [member.id, member]))
  const emails = new Set<string>()

  if (target.type === 'single_resource' && target.memberId) {
    const member = memberById.get(target.memberId)
    if (member && member.status !== 'removed') {
      emails.add(member.email.toLowerCase())
    }
    return [...emails]
  }

  if (target.type === 'member' && target.memberId) {
    const member = memberById.get(target.memberId)
    if (member && member.status !== 'removed') {
      emails.add(member.email.toLowerCase())
    }
    return [...emails]
  }

  const position = target.position
  if (!position) {
    return []
  }

  for (const member of roster) {
    if (member.status === 'removed' || !member.icsPositions.includes(position)) {
      continue
    }
    if (
      target.type === 'position_competency' &&
      target.competencyFunction &&
      !memberMatchesCompetency(member, position, target.competencyFunction)
    ) {
      continue
    }
    emails.add(member.email.toLowerCase())
  }

  const schedule = schedulesByPosition[position]
  for (const memberId of schedule?.assignMemberIds ?? []) {
    const member = memberById.get(memberId)
    if (!member || member.status === 'removed') continue
    if (
      target.type === 'position_competency' &&
      target.competencyFunction &&
      !memberMatchesCompetency(member, position, target.competencyFunction)
    ) {
      continue
    }
    emails.add(member.email.toLowerCase())
  }

  return [...emails]
}

export function isWorkAssignmentTargetSelectable(
  raw: string,
  options: Array<{ value: string; disabled?: boolean }>,
  roster: WorkspaceRosterMember[] = []
): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  const targetKey = normalizeWorkAssignmentTargetKey(trimmed, roster)
  const option = options.find(
    (entry) =>
      entry.value === trimmed ||
      normalizeWorkAssignmentTargetKey(entry.value, roster) === targetKey
  )
  if (option) {
    return !option.disabled
  }
  const target = parseWorkAssignmentTarget(trimmed, roster)
  return target.type !== 'unassigned'
}

export function memberIsEligibleForPosition(
  member: WorkspaceRosterMember,
  position: string,
  scheduledAssignMemberIds: string[] = []
): boolean {
  if (member.status === 'removed') return false
  if (member.icsPositions.includes(position)) return true
  return scheduledAssignMemberIds.includes(member.id)
}

export function isPositionEligibleForWorkAssignment(entry: PositionRosterEntry): boolean {
  if (!entry.allowWorkAssignment) return false
  if (entry.opAdvanceLabel === 'retire_on_op_advance') return false
  return entry.members.length > 0 || entry.scheduledAssignees.length > 0
}
