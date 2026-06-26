import { isOrgChartParentWithinOperationsSubtree } from '@/features/roster/operations-work-assignment-scope'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import {
  buildWorkAssignmentTarget,
  formatWorkAssignmentTargetLabel,
  parseWorkAssignmentTarget,
  type WorkAssignmentTargetType,
} from '@/lib/work-assignment-target'
import {
  classifyMemberAtPositionEligibility,
  classifyPositionAssetEligibility,
  classifyPositionAssigneeEligibility,
  classifyResourceCategoryAssigneeEligibility,
  classifySingleResourceMemberEligibility,
  formatAssigneeOptionLabel,
  type RosterPresence,
} from '@/lib/work-assignment-roster-eligibility'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type WorkAssignmentTargetOption = {
  value: string
  label: string
  group: string
  disabled?: boolean
  disabledReason?: string
  targetType: WorkAssignmentTargetType
  rosterPresence?: RosterPresence
}

export type WorkAssignmentTargetOptionsInput = {
  roster: WorkspaceRosterMember[]
  positionEntries: PositionRosterEntry[]
  catalog?: WorkspacePositionCatalog
  competencyOptions?: string[]
  schedulesByPosition?: Record<string, { assignMemberIds: string[]; unassignMemberIds: string[] }>
  assetsByKey?: Record<string, ResourceListItemData>
  includeUnassigned?: boolean
}

function sortedUniqueCompetencies(competencyOptions: string[] = []): string[] {
  return [...new Set(competencyOptions.map((entry) => entry.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  )
}

function buildPositionOption(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[]
): WorkAssignmentTargetOption | null {
  const eligibility = classifyPositionAssigneeEligibility(entry)
  if (!eligibility.eligible) {
    return null
  }

  const target = buildWorkAssignmentTarget({
    type: 'position',
    position: entry.position,
    roster,
  })

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
    }),
    group: eligibility.presence === 'scheduled_next_op' ? 'Positions (scheduled next OP)' : 'Positions (active roster)',
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    targetType: 'position',
    rosterPresence: eligibility.presence ?? undefined,
  }
}

function buildMemberOption(
  member: WorkspaceRosterMember,
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[]
): WorkAssignmentTargetOption | null {
  const eligibility = classifyMemberAtPositionEligibility(member, entry)
  if (!eligibility.eligible) {
    return null
  }

  const target = buildWorkAssignmentTarget({
    type: 'member',
    memberId: member.id,
    position: entry.position,
    competencyFunction: member.competencyByPosition?.[entry.position] ?? null,
    roster,
  })

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
    }),
    group:
      eligibility.presence === 'scheduled_next_op'
        ? 'Members (scheduled next OP)'
        : 'Members (active roster)',
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    targetType: 'member',
    rosterPresence: eligibility.presence ?? undefined,
  }
}

function buildSingleResourceOption(
  member: WorkspaceRosterMember,
  roster: WorkspaceRosterMember[]
): WorkAssignmentTargetOption | null {
  const eligibility = classifySingleResourceMemberEligibility(member)
  if (!eligibility.eligible) {
    return null
  }

  const target = buildWorkAssignmentTarget({
    type: 'single_resource',
    memberId: member.id,
    roster,
  })

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, eligibility.presence),
    group:
      eligibility.presence === 'scheduled_next_op'
        ? 'Single resources (scheduled next OP)'
        : 'Single resources (active roster)',
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    targetType: 'single_resource',
    rosterPresence: eligibility.presence ?? undefined,
  }
}

function buildPositionAssetOption(
  assetKey: string,
  assetName: string,
  entry: PositionRosterEntry,
  presence: RosterPresence,
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>
): WorkAssignmentTargetOption | null {
  const assetEntry = entry.assets.find((asset) => asset.assetKey === assetKey) ??
    entry.scheduledAssignAssets.find((asset) => asset.assetKey === assetKey) ?? {
      assetKey,
      name: assetName,
      type: '',
      pointOfContactMemberId: null,
      pointOfContactEmail: null,
      competencyFunction: null,
    }

  const eligibility = classifyPositionAssetEligibility(assetEntry, entry, presence)
  if (!eligibility.eligible) {
    return null
  }

  const target = buildWorkAssignmentTarget({
    type: 'position_asset',
    assetKey,
    position: entry.position,
    roster,
    assetsByKey,
  })

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
    }),
    group:
      presence === 'scheduled_next_op'
        ? 'Assets (scheduled next OP)'
        : 'Assets (active roster)',
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    targetType: 'position_asset',
    rosterPresence: eligibility.presence ?? undefined,
  }
}

function buildOrgChartAssetOption(
  asset: ResourceListItemData,
  presence: RosterPresence,
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>
): WorkAssignmentTargetOption {
  const target = buildWorkAssignmentTarget({
    type: 'org_chart_asset',
    assetKey: asset.assetKey,
    roster,
    assetsByKey,
  })

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, presence),
    group:
      presence === 'scheduled_next_op'
        ? 'Assets (scheduled next OP)'
        : 'Assets (active roster)',
    targetType: 'org_chart_asset',
    rosterPresence: presence,
  }
}

function buildResourceCategoryOption(
  category: PositionResourceCategoryEntry,
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[],
  resourceCategoriesById: Record<string, PositionResourceCategoryEntry & { positionName: string }>
): WorkAssignmentTargetOption | null {
  const eligibility = classifyResourceCategoryAssigneeEligibility(category, entry)
  if (!eligibility.eligible) {
    return null
  }

  const target = buildWorkAssignmentTarget({
    type: 'resource_category',
    categoryId: category.id,
    position: entry.position,
    roster,
    resourceCategoriesById,
  })

  const unfilled = !category.filledMemberId && !category.filledAssetKey

  return {
    value: target.value,
    label: formatAssigneeOptionLabel(target.label, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
      unfilled,
    }),
    group: 'Resource categories',
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    targetType: 'resource_category',
    rosterPresence: eligibility.presence ?? undefined,
  }
}

export function buildWorkAssignmentTargetOptions(
  input: WorkAssignmentTargetOptionsInput
): WorkAssignmentTargetOption[] {
  const {
    roster,
    positionEntries,
    catalog,
    competencyOptions = [],
    includeUnassigned = false,
    assetsByKey = {},
  } = input
  const options: WorkAssignmentTargetOption[] = []
  const competencies = sortedUniqueCompetencies(competencyOptions)
  const activeRoster = roster.filter((member) => member.status !== 'removed')
  const resourceCategoriesById: Record<
    string,
    PositionResourceCategoryEntry & { positionName: string }
  > = {}

  for (const entry of positionEntries) {
    for (const category of entry.resourceCategories) {
      resourceCategoriesById[category.id] = { ...category, positionName: entry.position }
    }
  }

  if (includeUnassigned) {
    options.push({
      value: '',
      label: 'Unassigned',
      group: 'Assignment',
      targetType: 'unassigned',
    })
  }

  for (const entry of positionEntries) {
    if (!entry.allowWorkAssignment) continue

    const positionOption = buildPositionOption(entry, roster)
    if (positionOption) {
      options.push(positionOption)
    }
    if (!positionOption || positionOption.disabled) continue

    for (const competency of competencies) {
      const roleTarget = buildWorkAssignmentTarget({
        type: 'position_competency',
        position: entry.position,
        competencyFunction: competency,
        roster,
      })
      options.push({
        value: roleTarget.value,
        label: roleTarget.label,
        group: 'Position roles',
        targetType: 'position_competency',
      })
    }

    for (const member of entry.members) {
      const memberOption = buildMemberOption(member, entry, roster)
      if (memberOption) options.push(memberOption)
    }

    for (const member of entry.scheduledAssignees) {
      if (entry.members.some((current) => current.id === member.id)) continue
      const memberOption = buildMemberOption(member, entry, roster)
      if (memberOption) options.push(memberOption)
    }

    for (const asset of entry.assets) {
      const assetOption = buildPositionAssetOption(
        asset.assetKey,
        asset.name,
        entry,
        'active',
        roster,
        assetsByKey
      )
      if (assetOption) options.push(assetOption)
    }

    for (const asset of entry.scheduledAssignAssets) {
      if (entry.assets.some((current) => current.assetKey === asset.assetKey)) continue
      const assetOption = buildPositionAssetOption(
        asset.assetKey,
        asset.name,
        entry,
        'scheduled_next_op',
        roster,
        assetsByKey
      )
      if (assetOption) options.push(assetOption)
    }

    for (const category of entry.resourceCategories) {
      const categoryOption = buildResourceCategoryOption(
        category,
        entry,
        roster,
        resourceCategoriesById
      )
      if (categoryOption) options.push(categoryOption)
    }
  }

  for (const member of activeRoster.filter((entry) => entry.assignmentKind === 'single_resource')) {
    if (catalog && !isOrgChartParentWithinOperationsSubtree(member.orgChartReportsTo, catalog)) {
      if (
        !member.pendingOrgChartReportsTo ||
        !isOrgChartParentWithinOperationsSubtree(member.pendingOrgChartReportsTo, catalog)
      ) {
        continue
      }
    }
    const singleResourceOption = buildSingleResourceOption(member, roster)
    if (singleResourceOption) options.push(singleResourceOption)
  }

  const seenOrgChartAssetKeys = new Set<string>()
  for (const asset of Object.values(assetsByKey)) {
    const reportsTo = asset.orgChartReportsTo?.trim()
    const pendingReportsTo = asset.pendingOrgChartReportsTo?.trim()
    if (!reportsTo && !pendingReportsTo) continue
    if (catalog) {
      const parent = reportsTo ?? pendingReportsTo
      if (!parent || !isOrgChartParentWithinOperationsSubtree(parent, catalog)) continue
    }
    if (seenOrgChartAssetKeys.has(asset.assetKey)) continue
    seenOrgChartAssetKeys.add(asset.assetKey)
    options.push(
      buildOrgChartAssetOption(
        asset,
        reportsTo ? 'active' : 'scheduled_next_op',
        roster,
        assetsByKey
      )
    )
  }

  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

const HAVE_LINKABLE_TARGET_TYPES: WorkAssignmentTargetType[] = [
  'position',
  'member',
  'single_resource',
  'position_asset',
  'org_chart_asset',
  'resource_category',
]

export function buildHaveLinkTargetOptions(
  options: WorkAssignmentTargetOption[]
): WorkAssignmentTargetOption[] {
  return options.filter(
    (option) => HAVE_LINKABLE_TARGET_TYPES.includes(option.targetType) && !option.disabled
  )
}

export function mergeLegacyHaveLinkTargetOptions(
  options: WorkAssignmentTargetOption[],
  linkedRefs: string[],
  roster: WorkspaceRosterMember[] = [],
  context: Parameters<typeof parseWorkAssignmentTarget>[2] = {}
): WorkAssignmentTargetOption[] {
  const merged = [...options]
  for (const ref of linkedRefs) {
    const trimmed = ref.trim()
    if (!trimmed || merged.some((option) => option.value === trimmed)) continue
    const parsed = parseWorkAssignmentTarget(trimmed, roster, context)
    merged.push({
      value: trimmed,
      label: `${formatWorkAssignmentTargetLabel(trimmed, roster, context)} (no longer on roster)`,
      group: 'Previously linked',
      disabled: true,
      disabledReason: 'Not on current roster',
      targetType: parsed.type === 'unassigned' ? 'position' : parsed.type,
    })
  }
  return merged
}

export function toAssignedUnitOptions(
  options: WorkAssignmentTargetOption[]
): Array<{ value: string; label: string; disabled?: boolean }> {
  return options.map(({ value, label, disabled }) => ({ value, label, disabled }))
}

export function mergeLegacyWorkAssignmentTargetOption(
  options: WorkAssignmentTargetOption[],
  currentValue: string,
  roster: WorkspaceRosterMember[] = [],
  context: Parameters<typeof parseWorkAssignmentTarget>[2] = {}
): WorkAssignmentTargetOption[] {
  const trimmed = currentValue.trim()
  if (!trimmed || options.some((option) => option.value === trimmed)) {
    return options
  }

  const parsed = parseWorkAssignmentTarget(trimmed, roster, context)
  if (options.some((option) => option.value === parsed.value)) {
    return options
  }

  return [
    ...options,
    {
      value: trimmed,
      label: `${formatWorkAssignmentTargetLabel(trimmed, roster, context)} (legacy)`,
      group: 'Legacy',
      disabled: true,
      disabledReason: 'Not on current roster',
      targetType: parsed.type === 'unassigned' ? 'position' : parsed.type,
    },
  ]
}

export const mergeLegacyWorkAssignmentTargetOptions = mergeLegacyWorkAssignmentTargetOption

export function validateWorkAssignmentAssigneeSelection(
  value: string,
  options: WorkAssignmentTargetOption[]
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const option = options.find((entry) => entry.value === trimmed)
  if (!option) return null
  if (option.disabled) {
    return option.disabledReason ?? 'This assignee cannot be selected.'
  }
  return null
}
