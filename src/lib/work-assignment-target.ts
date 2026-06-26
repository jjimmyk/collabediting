import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type WorkAssignmentTargetType =
  | 'unassigned'
  | 'position'
  | 'position_competency'
  | 'single_resource'
  | 'member'
  | 'position_asset'
  | 'org_chart_asset'
  | 'resource_category'

export type WorkAssignmentTarget = {
  type: WorkAssignmentTargetType
  position: string | null
  memberId: string | null
  assetKey: string | null
  categoryId: string | null
  competencyFunction: string | null
  value: string
  label: string
}

export type WorkAssignmentTargetContext = {
  roster?: WorkspaceRosterMember[]
  assetsByKey?: Record<string, { name?: string; orgChartReportsTo?: string | null }>
  resourceCategoriesById?: Record<string, PositionResourceCategoryEntry & { positionName?: string }>
}

const FIELD_SEP = '\x1e'

export function isWorkAssignmentTargetType(value: string): value is WorkAssignmentTargetType {
  return (
    value === 'unassigned' ||
    value === 'position' ||
    value === 'position_competency' ||
    value === 'single_resource' ||
    value === 'member' ||
    value === 'position_asset' ||
    value === 'org_chart_asset' ||
    value === 'resource_category'
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

function encodePositionAsset(assetKey: string, position: string): string {
  return `position_asset:${assetKey.trim()}${FIELD_SEP}${position.trim()}`
}

function encodeOrgChartAsset(assetKey: string): string {
  return `org_chart_asset:${assetKey.trim()}`
}

function encodeResourceCategory(categoryId: string): string {
  return `resource_category:${categoryId.trim()}`
}

export function buildWorkAssignmentTarget(input: {
  type: WorkAssignmentTargetType
  position?: string | null
  memberId?: string | null
  assetKey?: string | null
  categoryId?: string | null
  competencyFunction?: string | null
  roster?: WorkspaceRosterMember[]
  assetsByKey?: WorkAssignmentTargetContext['assetsByKey']
  resourceCategoriesById?: WorkAssignmentTargetContext['resourceCategoriesById']
}): WorkAssignmentTarget {
  const roster = input.roster ?? []
  const position = input.position?.trim() || null
  const memberId = input.memberId?.trim() || null
  const assetKey = input.assetKey?.trim() || null
  const categoryId = input.categoryId?.trim() || null
  const competencyFunction = input.competencyFunction?.trim() || null
  const assetsByKey = input.assetsByKey ?? {}
  const resourceCategoriesById = input.resourceCategoriesById ?? {}

  if (input.type === 'unassigned') {
    return {
      type: 'unassigned',
      position: null,
      memberId: null,
      assetKey: null,
      categoryId: null,
      competencyFunction: null,
      value: '',
      label: 'Unassigned',
    }
  }

  if (input.type === 'position' && position) {
    return {
      type: 'position',
      position,
      memberId: null,
      assetKey: null,
      categoryId: null,
      competencyFunction: null,
      value: encodePosition(position),
      label: position,
    }
  }

  if (input.type === 'position_competency' && position && competencyFunction) {
    return {
      type: 'position_competency',
      position,
      memberId: null,
      assetKey: null,
      categoryId: null,
      competencyFunction,
      value: encodePositionCompetency(position, competencyFunction),
      label: `${position} — ${competencyFunction}`,
    }
  }

  if (input.type === 'single_resource' && memberId) {
    const member = roster.find((entry) => entry.id === memberId)
    const email = member?.email ?? memberId
    const competencySuffix =
      competencyFunction ?? member?.competencyFunction?.trim()
        ? ` (${competencyFunction ?? member?.competencyFunction})`
        : ''
    return {
      type: 'single_resource',
      position: member?.orgChartReportsTo ?? member?.pendingOrgChartReportsTo ?? null,
      memberId,
      assetKey: null,
      categoryId: null,
      competencyFunction: competencyFunction ?? member?.competencyFunction ?? null,
      value: encodeSingleResource(memberId),
      label: `Single resource: ${email}${competencySuffix}`,
    }
  }

  if (input.type === 'member' && memberId && position) {
    const member = roster.find((entry) => entry.id === memberId)
    const email = member?.email ?? memberId
    const competencySuffix = competencyFunction ? ` — ${competencyFunction}` : ''
    return {
      type: 'member',
      position,
      memberId,
      assetKey: null,
      categoryId: null,
      competencyFunction,
      value: encodeMember(memberId, position, competencyFunction),
      label: `${email} (${position})${competencySuffix}`,
    }
  }

  if (input.type === 'position_asset' && assetKey && position) {
    const assetName = assetsByKey[assetKey]?.name ?? assetKey
    return {
      type: 'position_asset',
      position,
      memberId: null,
      assetKey,
      categoryId: null,
      competencyFunction: null,
      value: encodePositionAsset(assetKey, position),
      label: `${assetName} (${position})`,
    }
  }

  if (input.type === 'org_chart_asset' && assetKey) {
    const asset = assetsByKey[assetKey]
    const assetName = asset?.name ?? assetKey
    const reportsTo = asset?.orgChartReportsTo?.trim() || position
    return {
      type: 'org_chart_asset',
      position: reportsTo ?? null,
      memberId: null,
      assetKey,
      categoryId: null,
      competencyFunction: null,
      value: encodeOrgChartAsset(assetKey),
      label: `Asset: ${assetName}${reportsTo ? ` (${reportsTo})` : ''}`,
    }
  }

  if (input.type === 'resource_category' && categoryId) {
    const category = resourceCategoriesById[categoryId]
    const categoryName = category?.name ?? categoryId
    const categoryPosition = category?.positionName ?? position ?? ''
    const fillLabel = category?.filledMemberEmail
      ? ` — ${category.filledMemberEmail}`
      : category?.filledAssetName
        ? ` — ${category.filledAssetName}`
        : ''
    return {
      type: 'resource_category',
      position: categoryPosition || null,
      memberId: category?.filledMemberId ?? null,
      assetKey: category?.filledAssetKey ?? null,
      categoryId,
      competencyFunction: null,
      value: encodeResourceCategory(categoryId),
      label: `${categoryPosition ? `${categoryPosition} — ` : ''}${categoryName}${fillLabel}`,
    }
  }

  return {
    type: 'unassigned',
    position: null,
    memberId: null,
    assetKey: null,
    categoryId: null,
    competencyFunction: null,
    value: '',
    label: 'Unassigned',
  }
}

export function parseWorkAssignmentTarget(
  raw: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): WorkAssignmentTarget {
  const trimmed = raw.trim()
  if (!trimmed) {
    return buildWorkAssignmentTarget({ type: 'unassigned', roster, ...context })
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
        ...context,
      })
    }
  }

  if (trimmed.startsWith('position_asset:')) {
    const payload = trimmed.slice('position_asset:'.length)
    const [assetKey, position] = payload.split(FIELD_SEP)
    if (assetKey && position) {
      return buildWorkAssignmentTarget({
        type: 'position_asset',
        assetKey,
        position,
        roster,
        ...context,
      })
    }
  }

  if (trimmed.startsWith('org_chart_asset:')) {
    const assetKey = trimmed.slice('org_chart_asset:'.length).trim()
    if (assetKey) {
      return buildWorkAssignmentTarget({
        type: 'org_chart_asset',
        assetKey,
        roster,
        ...context,
      })
    }
  }

  if (trimmed.startsWith('resource_category:')) {
    const categoryId = trimmed.slice('resource_category:'.length).trim()
    if (categoryId) {
      return buildWorkAssignmentTarget({
        type: 'resource_category',
        categoryId,
        roster,
        ...context,
      })
    }
  }

  if (trimmed.startsWith('position:')) {
    const position = trimmed.slice('position:'.length).trim()
    if (position) {
      return buildWorkAssignmentTarget({ type: 'position', position, roster, ...context })
    }
  }

  if (trimmed.startsWith('single_resource:')) {
    const memberId = trimmed.slice('single_resource:'.length).trim()
    if (memberId) {
      return buildWorkAssignmentTarget({ type: 'single_resource', memberId, roster, ...context })
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
        ...context,
      })
    }
  }

  if (trimmed.startsWith('unassigned:')) {
    return buildWorkAssignmentTarget({ type: 'unassigned', roster, ...context })
  }

  return buildWorkAssignmentTarget({ type: 'position', position: trimmed, roster, ...context })
}

export function normalizeWorkAssignmentTargetValue(
  raw: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): string {
  return parseWorkAssignmentTarget(raw, roster, context).value
}

export function normalizeWorkAssignmentTargetKey(
  raw: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): string {
  const target = parseWorkAssignmentTarget(raw, roster, context)
  if (target.type === 'unassigned') return ''
  return target.value.trim().toLowerCase()
}

export function workAssignmentTargetsEqual(
  left: string,
  right: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): boolean {
  return (
    normalizeWorkAssignmentTargetKey(left, roster, context) ===
    normalizeWorkAssignmentTargetKey(right, roster, context)
  )
}

export function formatWorkAssignmentTargetLabel(
  raw: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): string {
  return parseWorkAssignmentTarget(raw, roster, context).label
}

export function updateMemberTargetCompetency(
  raw: string,
  competencyFunction: string | null,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): string {
  const target = parseWorkAssignmentTarget(raw, roster, context)
  if (target.type !== 'member' || !target.memberId || !target.position) {
    return raw
  }
  return buildWorkAssignmentTarget({
    type: 'member',
    memberId: target.memberId,
    position: target.position,
    competencyFunction,
    roster,
    ...context,
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
  schedulesByPosition: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>,
  context: WorkAssignmentTargetContext & {
    assetPocEmailByKey?: Record<string, string | null>
  } = {}
): string[] {
  const target = parseWorkAssignmentTarget(raw, roster, context)
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

  if (target.type === 'resource_category' && target.categoryId) {
    const category = context.resourceCategoriesById?.[target.categoryId]
    if (category?.filledMemberId) {
      const member = memberById.get(category.filledMemberId)
      if (member && member.status !== 'removed') {
        emails.add(member.email.toLowerCase())
      }
    } else if (category?.filledAssetKey) {
      const pocEmail = context.assetPocEmailByKey?.[category.filledAssetKey]
      if (pocEmail) {
        emails.add(pocEmail.toLowerCase())
      }
    }
    return [...emails]
  }

  if (
    (target.type === 'position_asset' || target.type === 'org_chart_asset') &&
    target.assetKey
  ) {
    const pocEmail = context.assetPocEmailByKey?.[target.assetKey]
    if (pocEmail) {
      emails.add(pocEmail.toLowerCase())
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
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  const targetKey = normalizeWorkAssignmentTargetKey(trimmed, roster, context)
  const option = options.find(
    (entry) =>
      entry.value === trimmed ||
      normalizeWorkAssignmentTargetKey(entry.value, roster, context) === targetKey
  )
  if (option) {
    return !option.disabled
  }
  const target = parseWorkAssignmentTarget(trimmed, roster, context)
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
  return (
    entry.members.length > 0 ||
    entry.scheduledAssignees.length > 0 ||
    entry.assets.length > 0 ||
    entry.scheduledAssignAssets.length > 0 ||
    entry.resourceCategories.some((category) => category.lifecycle !== 'scheduled_unassign')
  )
}

export function isWorkAssignmentTargetOptionDisabled(
  value: string,
  options: Array<{ value: string; disabled?: boolean }>
): boolean {
  const option = options.find((entry) => entry.value === value)
  return Boolean(option?.disabled)
}
