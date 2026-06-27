import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import type { ResourceCategoryLifecycle } from '@/lib/workspace-resource-category-types'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import {
  classifyPositionAssigneeEligibility,
  classifyPositionAssetEligibility,
  classifyResourceCategoryAssigneeEligibility,
  classifySingleResourceMemberEligibility,
  formatAssigneeOptionLabel,
  isAssetScheduledForNextOpAssign,
  isMemberScheduledForNextOpAssign,
  isMemberScheduledToUnassign,
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
  resourceCategoryLifecycle?: ResourceCategoryLifecycle
  linkableForHave: boolean
}

export type HaveLinkPositionTreeNode = {
  position: string
  positionRef: string | null
  positionLabel: string
  presence: RosterPresence
  isPlanned: boolean
  positionDisabled: boolean
  positionDisabledReason?: string
  memberSchedulePolicy: PositionMemberSchedulePolicy
  showPositionAssets: boolean
  summary: { currentOp: number; nextOp: number; linkableNextOp: number; categories: number }
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

export function getHaveLinkSelectableRefs(node: HaveLinkPositionTreeNode): string[] {
  return [...new Set(
    node.children
      .filter((child) => child.linkableForHave && !child.disabled)
      .map((child) => child.ref)
  )]
}

/** @deprecated Use getHaveLinkSelectableRefs */
export function getAssignedToPositionSelectableRefs(node: HaveLinkPositionTreeNode): string[] {
  return getHaveLinkSelectableRefs(node)
}

export function collectNextOpHaveLinkRefsFromTree(tree: HaveLinkPositionTree): Set<string> {
  const refs = new Set<string>()
  for (const node of tree.positions) {
    for (const ref of getHaveLinkSelectableRefs(node)) {
      refs.add(ref)
    }
  }
  for (const child of [...tree.singleResources, ...tree.orgChartAssets]) {
    if (child.linkableForHave && !child.disabled) {
      refs.add(child.ref)
    }
  }
  return refs
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

export function partitionPositionChildrenByOp(node: HaveLinkPositionTreeNode): {
  currentOp: HaveLinkPositionChild[]
  nextOp: HaveLinkPositionChild[]
  scheduledUnassignCategories: HaveLinkPositionChild[]
} {
  const { currentOp, nextOp } = partitionAssignedToPositionChildren(node)
  const categories = node.children.filter((child) => child.section === 'resource_categories')
  return {
    currentOp: [
      ...currentOp,
      ...categories.filter((child) => child.resourceCategoryLifecycle === 'active'),
    ],
    nextOp: [
      ...nextOp,
      ...categories.filter((child) => child.resourceCategoryLifecycle === 'scheduled_assign'),
    ],
    scheduledUnassignCategories: categories.filter(
      (child) => child.resourceCategoryLifecycle === 'scheduled_unassign'
    ),
  }
}

function summarizeAssignedChildren(children: HaveLinkPositionChild[]): {
  currentOp: number
  nextOp: number
  linkableNextOp: number
  categories: number
} {
  const assigned = children.filter(
    (child) => child.section === 'people' || child.section === 'assets'
  )
  return {
    currentOp: assigned.filter((child) => child.presence === 'active').length,
    nextOp: assigned.filter((child) => child.presence === 'scheduled_next_op').length,
    linkableNextOp: children.filter((child) => child.linkableForHave && !child.disabled).length,
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
  showPositionAssets?: boolean
}

function childFromEligibility(
  ref: string,
  baseLabel: string,
  targetType: WorkAssignmentTargetType,
  section: HaveLinkPositionChildSection,
  eligibility: AssigneeEligibility,
  options?: { unfilled?: boolean; linkableForHave?: boolean }
): HaveLinkPositionChild | null {
  if (!eligibility.eligible) return null
  return {
    ref,
    label: formatAssigneeOptionLabel(baseLabel, eligibility.presence, {
      disabledReason: eligibility.disabled ? eligibility.disabledReason : undefined,
      unfilled: options?.unfilled,
    }),
    targetType,
    presence: eligibility.presence,
    section,
    disabled: eligibility.disabled,
    disabledReason: eligibility.disabledReason,
    linkableForHave: options?.linkableForHave ?? false,
  }
}

function memberEligibilityForFacet(
  member: WorkspaceRosterMember,
  entry: PositionRosterEntry,
  presence: RosterPresence
): AssigneeEligibility {
  if (entry.opAdvanceLabel === 'retire_on_op_advance') {
    return { eligible: false, disabled: true, presence: null, disabledReason: 'retiring next OP' }
  }

  const isActive = member.icsPositions.includes(entry.position)
  const isScheduledAssign = isMemberScheduledForNextOpAssign(member.id, entry)

  if (presence === 'active') {
    if (!isActive) {
      return { eligible: false, disabled: true, presence: null }
    }
    if (isMemberScheduledToUnassign(member.id, entry)) {
      return {
        eligible: true,
        disabled: true,
        presence: 'active',
        disabledReason: 'retiring next OP',
      }
    }
    return { eligible: true, disabled: false, presence: 'active' }
  }

  if (!isScheduledAssign) {
    return { eligible: false, disabled: true, presence: null }
  }
  return { eligible: true, disabled: false, presence: 'scheduled_next_op' }
}

function buildPeopleChildren(
  entry: PositionRosterEntry,
  roster: WorkspaceRosterMember[]
): HaveLinkPositionChild[] {
  const children: HaveLinkPositionChild[] = []
  const emittedNext = new Set<string>()

  for (const member of entry.members) {
    const target = buildWorkAssignmentTarget({
      type: 'member',
      memberId: member.id,
      position: entry.position,
      competencyFunction: member.competencyByPosition?.[entry.position] ?? null,
      roster,
    })
    const activeEligibility = memberEligibilityForFacet(member, entry, 'active')
    const activeChild = childFromEligibility(
      target.value,
      target.label,
      'member',
      'people',
      activeEligibility,
      { linkableForHave: false }
    )
    if (activeChild) children.push(activeChild)

    if (isMemberScheduledForNextOpAssign(member.id, entry)) {
      emittedNext.add(member.id)
      const nextEligibility = memberEligibilityForFacet(member, entry, 'scheduled_next_op')
      const nextChild = childFromEligibility(
        target.value,
        target.label,
        'member',
        'people',
        nextEligibility,
        { linkableForHave: true }
      )
      if (nextChild) children.push(nextChild)
    }
  }

  for (const member of [
    ...entry.scheduledAssignees,
    ...entry.scheduledOrgChartMembers,
  ]) {
    if (emittedNext.has(member.id)) continue
    const nextEligibility = memberEligibilityForFacet(member, entry, 'scheduled_next_op')
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
      nextEligibility,
      { linkableForHave: true }
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
  const children: HaveLinkPositionChild[] = []
  const emittedNext = new Set<string>()

  const emitAssetChild = (
    asset: PositionAssetRosterEntry,
    presence: RosterPresence,
    linkableForHave: boolean
  ) => {
    const eligibility = classifyPositionAssetEligibility(asset, entry, presence)
    const target = buildWorkAssignmentTarget({
      type: 'position_asset',
      assetKey: asset.assetKey,
      position: entry.position,
      roster,
      assetsByKey,
    })
    const child = childFromEligibility(
      target.value,
      target.label,
      'position_asset',
      'assets',
      eligibility,
      { linkableForHave }
    )
    if (child) children.push(child)
  }

  for (const asset of entry.assets) {
    emitAssetChild(asset, 'active', false)
    if (isAssetScheduledForNextOpAssign(asset.assetKey, entry)) {
      emittedNext.add(asset.assetKey)
      emitAssetChild(asset, 'scheduled_next_op', true)
    }
  }

  for (const asset of [...entry.scheduledAssignAssets, ...entry.scheduledOrgChartAssets]) {
    if (emittedNext.has(asset.assetKey)) continue
    emitAssetChild(asset, 'scheduled_next_op', true)
  }

  const seenOrgChart = new Set<string>([
    ...entry.assets.map((asset) => asset.assetKey),
    ...entry.scheduledAssignAssets.map((asset) => asset.assetKey),
    ...entry.scheduledOrgChartAssets.map((asset) => asset.assetKey),
  ])

  for (const asset of Object.values(assetsByKey)) {
    if (asset.orgChartReportsTo?.trim() !== entry.position) continue
    if (seenOrgChart.has(asset.assetKey)) continue
    seenOrgChart.add(asset.assetKey)
    emitAssetChild(
      {
        assetKey: asset.assetKey,
        name: asset.name,
        type: asset.type,
        pointOfContactMemberId: asset.pointOfContactMemberId,
        pointOfContactEmail: asset.pointOfContact,
        competencyFunction: asset.competencyFunction,
      },
      'active',
      false
    )
  }

  for (const asset of Object.values(assetsByKey)) {
    const pending = asset.pendingOrgChartReportsTo?.trim()
    if (!pending || pending !== entry.position || asset.orgChartReportsTo?.trim()) continue
    if (seenOrgChart.has(asset.assetKey)) continue
    seenOrgChart.add(asset.assetKey)
    emitAssetChild(
      {
        assetKey: asset.assetKey,
        name: asset.name,
        type: asset.type,
        pointOfContactMemberId: asset.pointOfContactMemberId,
        pointOfContactEmail: asset.pointOfContact,
        competencyFunction: asset.competencyFunction,
      },
      'scheduled_next_op',
      true
    )
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
      {
        unfilled,
        linkableForHave: category.lifecycle === 'scheduled_assign',
      }
    )
    if (child) {
      children.push({ ...child, resourceCategoryLifecycle: category.lifecycle })
    }
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
  >,
  showPositionAssets: boolean
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

  const selectableRefs = [
    ...new Set(
      children.filter((child) => child.linkableForHave && !child.disabled).map((child) => child.ref)
    ),
  ]
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
    memberSchedulePolicy: entry.memberSchedulePolicy,
    showPositionAssets,
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
      eligibility,
      { linkableForHave: eligibility.presence === 'scheduled_next_op' }
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
      { eligible: true, disabled: false, presence },
      { linkableForHave: presence === 'scheduled_next_op' }
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
  const showPositionAssets = input.showPositionAssets ?? true
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
    .map((entry) =>
      buildPositionNode(entry, roster, assetsByKey, resourceCategoriesById, showPositionAssets)
    )
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
      const selectableRefs = [
        ...new Set(
          nextChildren
            .filter((child) => child.linkableForHave && !child.disabled)
            .map((child) => child.ref)
        ),
      ]
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
