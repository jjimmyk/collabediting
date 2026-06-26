import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import {
  classifyMemberAtPositionEligibility,
  classifyPositionAssigneeEligibility,
  classifyPositionAssetEligibility,
  classifyResourceCategoryAssigneeEligibility,
  classifySingleResourceMemberEligibility,
  formatAssigneeOptionLabel,
  type AssigneeEligibility,
  type RosterPresence,
} from '@/lib/work-assignment-roster-eligibility'
import {
  buildWorkAssignmentTarget,
  type WorkAssignmentTargetType,
} from '@/lib/work-assignment-target'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type HaveLinkPositionChildSection = 'people' | 'assets' | 'resource_categories'

export type HaveLinkPositionChild = {
  ref: string
  label: string
  targetType: WorkAssignmentTargetType
  presence: RosterPresence | null
  section: HaveLinkPositionChildSection
  disabled: boolean
  disabledReason?: string
}

export type HaveLinkPositionTreeNode = {
  position: string
  positionRef: string | null
  positionLabel: string
  presence: RosterPresence
  isPlanned: boolean
  positionDisabled: boolean
  positionDisabledReason?: string
  summary: { currentOp: number; nextOp: number; categories: number }
  children: HaveLinkPositionChild[]
  selectableRefs: string[]
}

const ASSIGNED_PRESENCE_ORDER: Record<RosterPresence | 'unknown', number> = {
  active: 0,
  scheduled_next_op: 1,
  unknown: 2,
}

function compareAssignedToPositionChildren(
  left: HaveLinkPositionChild,
  right: HaveLinkPositionChild
): number {
  const leftPresence = left.presence ?? 'unknown'
  const rightPresence = right.presence ?? 'unknown'
  const presenceCompare =
    ASSIGNED_PRESENCE_ORDER[leftPresence] - ASSIGNED_PRESENCE_ORDER[rightPresence]
  if (presenceCompare !== 0) {
    return presenceCompare
  }

  return left.label.localeCompare(right.label)
}

export function getAssignedToPositionChildren(
  node: HaveLinkPositionTreeNode
): HaveLinkPositionChild[] {
  return node.children
    .filter((child) => child.section === 'people' || child.section === 'assets')
    .sort(compareAssignedToPositionChildren)
}

export function getAssignedToPositionSelectableRefs(node: HaveLinkPositionTreeNode): string[] {
  return getAssignedToPositionChildren(node)
    .filter((child) => !child.disabled)
    .map((child) => child.ref)
}

export function partitionAssignedToPositionChildren(node: HaveLinkPositionTreeNode): {
  currentOp: HaveLinkPositionChild[]
  nextOp: HaveLinkPositionChild[]
} {
  const assigned = getAssignedToPositionChildren(node)
  return {
    currentOp: assigned.filter((child) => child.presence === 'active'),
    nextOp: assigned.filter((child) => child.presence === 'scheduled_next_op'),
  }
}

function summarizeAssignedChildren(children: HaveLinkPositionChild[]): {
  currentOp: number
  nextOp: number
  categories: number
} {
  const assigned = children.filter(
    (child) => child.section === 'people' || child.section === 'assets'
  )
  return {
    currentOp: assigned.filter((child) => child.presence === 'active').length,
    nextOp: assigned.filter((child) => child.presence === 'scheduled_next_op').length,
    categories: children.filter((child) => child.section === 'resource_categories').length,
  }
}

export type HaveLinkPositionTree = {
  positions: HaveLinkPositionTreeNode[]
  singleResources: HaveLinkPositionChild[]
  orgChartAssets: HaveLinkPositionChild[]
}

export type BuildHaveLinkPositionTreeInput = {
  positionEntries: PositionRosterEntry[]
  roster: WorkspaceRosterMember[]
  assetsByKey?: Record<string, ResourceListItemData>
}

function childFromEligibility(
  ref: string,
  baseLabel: string,
  targetType: WorkAssignmentTargetType,
  section: HaveLinkPositionChildSection,
  eligibility: AssigneeEligibility,
  extras?: { unfilled?: boolean }
): HaveLinkPositionChild | null {
  if (!eligibility.eligible) return null
  return {
    ref,
    label: formatAssigneeOptionLabel(baseLabel, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
      unfilled: extras?.unfilled,
    }),
    targetType,
    presence: eligibility.presence,
    section,
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
  }
}

function dedupeMembers(members: WorkspaceRosterMember[]): WorkspaceRosterMember[] {
  const seen = new Set<string>()
  const result: WorkspaceRosterMember[] = []
  for (const member of members) {
    if (seen.has(member.id)) continue
    seen.add(member.id)
    result.push(member)
  }
  return result
}

function buildPeopleChildren(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[]
): HaveLinkPositionChild[] {
  const members = dedupeMembers([
    ...entry.members,
    ...entry.scheduledAssignees,
    ...entry.scheduledOrgChartMembers,
  ])
  const children: HaveLinkPositionChild[] = []

  for (const member of members) {
    const eligibility = classifyMemberAtPositionEligibility(member, entry)
    const target = buildWorkAssignmentTarget({
      type: 'member',
      memberId: member.id,
      position: entry.position,
      competencyFunction: member.competencyByPosition?.[entry.position] ?? null,
      roster,
    })
    const child = childFromEligibility(
      target.value,
      target.label,
      'member',
      'people',
      eligibility
    )
    if (child) children.push(child)
  }

  return children
}

function buildAssetChildren(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>
): HaveLinkPositionChild[] {
  const assetRows: Array<{ assetKey: string; name: string; presence: RosterPresence; entry: PositionAssetRosterEntry }> = []
  const seen = new Set<string>()

  const pushAsset = (
    asset: PositionAssetRosterEntry,
    presence: RosterPresence
  ) => {
    if (seen.has(asset.assetKey)) return
    seen.add(asset.assetKey)
    assetRows.push({
      assetKey: asset.assetKey,
      name: asset.name,
      presence,
      entry: asset,
    })
  }

  for (const asset of entry.assets) pushAsset(asset, 'active')
  for (const asset of entry.scheduledAssignAssets) pushAsset(asset, 'scheduled_next_op')
  for (const asset of entry.scheduledOrgChartAssets) pushAsset(asset, 'scheduled_next_op')

  for (const asset of Object.values(assetsByKey)) {
    if (asset.orgChartReportsTo?.trim() !== entry.position) continue
    if (seen.has(asset.assetKey)) continue
    seen.add(asset.assetKey)
    pushAsset(
      {
        assetKey: asset.assetKey,
        name: asset.name,
        type: asset.type,
        pointOfContactMemberId: asset.pointOfContactMemberId,
        pointOfContactEmail: asset.pointOfContact,
        competencyFunction: asset.competencyFunction,
      },
      'active'
    )
  }

  for (const asset of Object.values(assetsByKey)) {
    const pending = asset.pendingOrgChartReportsTo?.trim()
    if (!pending || pending !== entry.position || asset.orgChartReportsTo?.trim()) continue
    if (seen.has(asset.assetKey)) continue
    seen.add(asset.assetKey)
    pushAsset(
      {
        assetKey: asset.assetKey,
        name: asset.name,
        type: asset.type,
        pointOfContactMemberId: asset.pointOfContactMemberId,
        pointOfContactEmail: asset.pointOfContact,
        competencyFunction: asset.competencyFunction,
      },
      'scheduled_next_op'
    )
  }

  const children: HaveLinkPositionChild[] = []
  for (const row of assetRows) {
    const eligibility = classifyPositionAssetEligibility(row.entry, entry, row.presence)
    const target = buildWorkAssignmentTarget({
      type: 'position_asset',
      assetKey: row.assetKey,
      position: entry.position,
      roster,
      assetsByKey,
    })
    const child = childFromEligibility(
      target.value,
      target.label,
      'position_asset',
      'assets',
      eligibility
    )
    if (child) children.push(child)
  }

  return children
}

function buildCategoryChildren(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[],
  resourceCategoriesById: Record<
    string,
    PositionResourceCategoryEntry & { positionName: string }
  >
): HaveLinkPositionChild[] {
  const children: HaveLinkPositionChild[] = []

  for (const category of entry.resourceCategories) {
    const eligibility = classifyResourceCategoryAssigneeEligibility(category, entry)
    const target = buildWorkAssignmentTarget({
      type: 'resource_category',
      categoryId: category.id,
      position: entry.position,
      roster,
      resourceCategoriesById,
    })
    const unfilled = !category.filledMemberId && !category.filledAssetKey
    const child = childFromEligibility(
      target.value,
      target.label,
      'resource_category',
      'resource_categories',
      eligibility,
      { unfilled }
    )
    if (child) children.push(child)
  }

  return children
}

function buildPositionNode(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>,
  resourceCategoriesById: Record<
    string,
    PositionResourceCategoryEntry & { positionName: string }
  >
): HaveLinkPositionTreeNode | null {
  if (!entry.allowWorkAssignment) return null
  if (entry.opAdvanceLabel === 'retire_on_op_advance') return null

  const positionEligibility = classifyPositionAssigneeEligibility(entry)
  if (!positionEligibility.eligible) return null

  const positionTarget = buildWorkAssignmentTarget({
    type: 'position',
    position: entry.position,
    roster,
  })

  const people = buildPeopleChildren(entry, roster)
  const assets = buildAssetChildren(entry, roster, assetsByKey)
  const categories = buildCategoryChildren(entry, roster, resourceCategoriesById)
  const children = [...people, ...assets, ...categories]

  const selectableRefs = children.filter((child) => !child.disabled).map((child) => child.ref)
  const positionRef =
    !positionEligibility.disabled && positionEligibility.presence
      ? positionTarget.value
      : null

  return {
    position: entry.position,
    positionRef,
    positionLabel: formatAssigneeOptionLabel(positionTarget.label, positionEligibility.presence, {
      disabledReason: positionEligibility.disabled ? positionEligibility.disabledReason : undefined,
    }),
    presence: positionEligibility.presence ?? 'active',
    isPlanned: Boolean(entry.isPlanned),
    positionDisabled: positionEligibility.disabled,
    positionDisabledReason: positionEligibility.disabledReason,
    summary: summarizeAssignedChildren(children),
    children,
    selectableRefs,
  }
}

function buildSingleResourceChildren(
  roster: WorkspaceRosterMember[]
): HaveLinkPositionChild[] {
  const children: HaveLinkPositionChild[] = []
  for (const member of roster) {
    if (member.status === 'removed' || member.assignmentKind !== 'single_resource') continue
    const eligibility = classifySingleResourceMemberEligibility(member)
    const target = buildWorkAssignmentTarget({
      type: 'single_resource',
      memberId: member.id,
      roster,
    })
    const child = childFromEligibility(
      target.value,
      target.label,
      'single_resource',
      'people',
      eligibility
    )
    if (child) children.push(child)
  }
  return children.sort((left, right) => left.label.localeCompare(right.label))
}

function buildStandaloneOrgChartAssetChildren(
  roster: WorkspaceRosterMember[],
  assetsByKey: Record<string, ResourceListItemData>,
  refsInPositions: Set<string>
): HaveLinkPositionChild[] {
  const children: HaveLinkPositionChild[] = []

  for (const asset of Object.values(assetsByKey)) {
    const reportsTo = asset.orgChartReportsTo?.trim()
    const pendingReportsTo = asset.pendingOrgChartReportsTo?.trim()
    if (!reportsTo && !pendingReportsTo) continue

    const target = buildWorkAssignmentTarget({
      type: 'org_chart_asset',
      assetKey: asset.assetKey,
      roster,
      assetsByKey,
    })
    if (refsInPositions.has(target.value)) continue

    const presence: RosterPresence = reportsTo ? 'active' : 'scheduled_next_op'
    const child = childFromEligibility(
      target.value,
      target.label,
      'org_chart_asset',
      'assets',
      { eligible: true, disabled: false, presence }
    )
    if (child) children.push(child)
  }

  return children.sort((left, right) => left.label.localeCompare(right.label))
}

export function buildHaveLinkPositionTree(
  input: BuildHaveLinkPositionTreeInput
): HaveLinkPositionTree {
  const roster = input.roster ?? []
  const assetsByKey = input.assetsByKey ?? {}
  const resourceCategoriesById: Record<
    string,
    PositionResourceCategoryEntry & { positionName: string }
  > = {}

  for (const entry of input.positionEntries) {
    for (const category of entry.resourceCategories) {
      resourceCategoriesById[category.id] = { ...category, positionName: entry.position }
    }
  }

  const positions = input.positionEntries
    .map((entry) => buildPositionNode(entry, roster, assetsByKey, resourceCategoriesById))
    .filter((node): node is HaveLinkPositionTreeNode => Boolean(node))
    .sort((left, right) => left.position.localeCompare(right.position))

  const refsInPositions = new Set<string>()
  for (const node of positions) {
    for (const ref of node.selectableRefs) refsInPositions.add(ref)
    for (const child of node.children) refsInPositions.add(child.ref)
    if (node.positionRef) refsInPositions.add(node.positionRef)
  }

  return {
    positions,
    singleResources: buildSingleResourceChildren(roster),
    orgChartAssets: buildStandaloneOrgChartAssetChildren(roster, assetsByKey, refsInPositions),
  }
}

export function filterHaveLinkPositionTree(
  tree: HaveLinkPositionTree,
  query: string
): HaveLinkPositionTree {
  const filterText = query.trim().toLowerCase()
  if (!filterText) return tree

  const matches = (value: string) => value.toLowerCase().includes(filterText)

  const positions = tree.positions
    .map((node) => {
      const positionMatches = matches(node.position) || matches(node.positionLabel)
      const children = node.children.filter(
        (child) => matches(child.label) || matches(child.ref) || matches(child.section)
      )
      if (!positionMatches && children.length === 0) return null
      const nextChildren = positionMatches ? node.children : children
      const selectableRefs = nextChildren.filter((child) => !child.disabled).map((child) => child.ref)
      return {
        ...node,
        children: nextChildren,
        selectableRefs,
        summary: summarizeAssignedChildren(nextChildren),
      }
    })
    .filter((node): node is HaveLinkPositionTreeNode => Boolean(node))

  const singleResources = tree.singleResources.filter(
    (child) => matches(child.label) || matches(child.ref)
  )
  const orgChartAssets = tree.orgChartAssets.filter(
    (child) => matches(child.label) || matches(child.ref)
  )

  return { positions, singleResources, orgChartAssets }
}

export function collectRefsFromPositionTree(tree: HaveLinkPositionTree): Set<string> {
  const refs = new Set<string>()
  for (const node of tree.positions) {
    if (node.positionRef) refs.add(node.positionRef)
    for (const child of node.children) refs.add(child.ref)
  }
  for (const child of tree.singleResources) refs.add(child.ref)
  for (const child of tree.orgChartAssets) refs.add(child.ref)
  return refs
}
