import { STANDARD_ICS_POSITIONS, WORKSPACE_ROSTER_POSITIONS } from '@/lib/ics-positions'
import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type {
  PositionLifecycleStatus,
  PositionOpAdvanceLabel,
  StandardPositionLifecycleRow,
} from '@/lib/operational-period-roster-types'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'

export type WorkspaceCustomPosition = {
  id: string
  name: string
  reportsTo: string
  sortOrder: number
  lifecycleStatus: PositionLifecycleStatus
  archivedAt?: string | null
  activatedAt?: string | null
}

export type WorkspacePositionMeta = {
  name: string
  source: 'standard' | 'custom'
  lifecycleStatus: PositionLifecycleStatus
  opAdvanceLabel: PositionOpAdvanceLabel
  isPlanned: boolean
  isArchived: boolean
  isOnOrgChart: boolean
  customPositionId?: string
  reportsTo?: string
}

export type WorkspacePositionCatalog = {
  standardPositions: readonly string[]
  customPositions: WorkspaceCustomPosition[]
  /** Active roster positions (excludes archived; includes planned + retiring). */
  rosterPositionNames: string[]
  /** Positions eligible for org chart, assignments, and permissions. */
  allPositionNames: string[]
  orgChartPositionNames: string[]
  customPositionNames: Set<string>
  positionMetaByName: Record<string, WorkspacePositionMeta>
}

const MAX_POSITION_NAME_LENGTH = 80
const MIN_POSITION_NAME_LENGTH = 2

function opAdvanceLabelFromCustom(status: PositionLifecycleStatus): PositionOpAdvanceLabel {
  if (status === 'planned_create') return 'create_on_op_advance'
  if (status === 'retire_on_op_advance') return 'retire_on_op_advance'
  return null
}

function isArchivedStandard(row: StandardPositionLifecycleRow | undefined): boolean {
  return Boolean(row?.archivedAt)
}

export function buildWorkspacePositionCatalog(
  customPositions: WorkspaceCustomPosition[],
  standardLifecycle: StandardPositionLifecycleRow[] = []
): WorkspacePositionCatalog {
  const standardLifecycleByName = Object.fromEntries(
    standardLifecycle.map((row) => [row.positionName, row])
  )
  const activeCustom = customPositions.filter((row) => row.lifecycleStatus !== 'archived')
  const customPositionNames = new Set(
    activeCustom.filter((row) => row.lifecycleStatus !== 'planned_create').map((row) => row.name)
  )

  const positionMetaByName: Record<string, WorkspacePositionMeta> = {}
  const rosterPositionNames: string[] = []
  const orgChartPositionNames: string[] = []

  for (const position of WORKSPACE_ROSTER_POSITIONS) {
    const lifecycleRow = standardLifecycleByName[position]
    if (isArchivedStandard(lifecycleRow)) {
      continue
    }
    const opAdvanceLabel: PositionOpAdvanceLabel = lifecycleRow?.opAdvanceLabel ?? null
    positionMetaByName[position] = {
      name: position,
      source: 'standard',
      lifecycleStatus: 'active',
      opAdvanceLabel,
      isPlanned: false,
      isArchived: false,
      isOnOrgChart: true,
    }
    rosterPositionNames.push(position)
    orgChartPositionNames.push(position)
  }

  for (const custom of activeCustom) {
    const opAdvanceLabel = opAdvanceLabelFromCustom(custom.lifecycleStatus)
    const isPlanned = custom.lifecycleStatus === 'planned_create'
    positionMetaByName[custom.name] = {
      name: custom.name,
      source: 'custom',
      lifecycleStatus: custom.lifecycleStatus,
      opAdvanceLabel,
      isPlanned,
      isArchived: false,
      isOnOrgChart: !isPlanned,
      customPositionId: custom.id,
      reportsTo: custom.reportsTo,
    }
    rosterPositionNames.push(custom.name)
    if (!isPlanned) {
      orgChartPositionNames.push(custom.name)
    }
  }

  return {
    standardPositions: WORKSPACE_ROSTER_POSITIONS,
    customPositions: activeCustom,
    rosterPositionNames,
    allPositionNames: orgChartPositionNames,
    orgChartPositionNames,
    customPositionNames,
    positionMetaByName,
  }
}

export function emptyWorkspacePositionCatalog(): WorkspacePositionCatalog {
  return buildWorkspacePositionCatalog([])
}

export function normalizePositionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function isStandardPositionName(name: string): boolean {
  const normalized = normalizePositionName(name).toLowerCase()
  return STANDARD_ICS_POSITIONS.some(
    (position) => position.toLowerCase() === normalized
  )
}

export function validateCustomPositionName(
  name: string,
  catalog: WorkspacePositionCatalog,
  excludeId?: string
): string | null {
  const normalized = normalizePositionName(name)
  if (normalized.length < MIN_POSITION_NAME_LENGTH) {
    return `Position name must be at least ${MIN_POSITION_NAME_LENGTH} characters.`
  }
  if (normalized.length > MAX_POSITION_NAME_LENGTH) {
    return `Position name must be ${MAX_POSITION_NAME_LENGTH} characters or fewer.`
  }
  if (isStandardPositionName(normalized)) {
    return 'That name matches a standard ICS position. Choose a different name.'
  }
  const duplicate = catalog.customPositions.some(
    (row) => row.id !== excludeId && row.name.toLowerCase() === normalized.toLowerCase()
  )
  if (duplicate) {
    return 'A custom position with that name already exists in this workspace.'
  }
  return null
}

export function validateReportsToPosition(
  reportsTo: string,
  catalog: WorkspacePositionCatalog,
  positionName?: string
): string | null {
  const normalized = normalizePositionName(reportsTo)
  if (!normalized) {
    return 'Select a position to report to.'
  }
  if (positionName && normalizePositionName(positionName).toLowerCase() === normalized.toLowerCase()) {
    return 'A position cannot report to itself.'
  }
  if (!catalog.allPositionNames.includes(normalized)) {
    return 'Reports-to position must be an existing position in this workspace.'
  }
  if (positionName && wouldCreatePositionCycle(catalog.customPositions, positionName, normalized)) {
    return 'That reports-to choice would create a circular hierarchy.'
  }
  return null
}

export function wouldCreatePositionCycle(
  customPositions: WorkspaceCustomPosition[],
  positionName: string,
  reportsTo: string,
  excludeId?: string
): boolean {
  const parentByName = new Map<string, string>()
  for (const row of customPositions) {
    if (row.id === excludeId) continue
    parentByName.set(row.name, row.reportsTo)
  }

  const target = normalizePositionName(positionName)
  let current: string | undefined = normalizePositionName(reportsTo)
  const visiting = new Set<string>()

  while (current) {
    if (current.toLowerCase() === target.toLowerCase()) {
      return true
    }
    if (visiting.has(current.toLowerCase())) {
      return true
    }
    visiting.add(current.toLowerCase())
    const next = parentByName.get(current)
    if (!next) break
    current = next
  }

  return false
}

export function normalizeWorkspaceIcsPositions(
  positions: string[],
  catalog: WorkspacePositionCatalog
): string[] {
  const allowed = new Set(catalog.allPositionNames)
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const position of positions) {
    const trimmed = normalizePositionName(position)
    if (!allowed.has(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    normalized.push(trimmed)
  }
  return normalized
}

export function sortCustomPositionsForInsert(
  customPositions: WorkspaceCustomPosition[]
): WorkspaceCustomPosition[] {
  const byName = new Map(customPositions.map((row) => [row.name, row]))
  const depthCache = new Map<string, number>()

  const depth = (name: string, visiting = new Set<string>()): number => {
    const cached = depthCache.get(name)
    if (cached !== undefined) return cached
    if (visiting.has(name)) return Number.POSITIVE_INFINITY
    visiting.add(name)
    const row = byName.get(name)
    if (!row) {
      depthCache.set(name, 0)
      visiting.delete(name)
      return 0
    }
    const parentIsStandard = WORKSPACE_ROSTER_POSITIONS.includes(
      row.reportsTo as (typeof WORKSPACE_ROSTER_POSITIONS)[number]
    )
    const value = parentIsStandard ? 1 : depth(row.reportsTo, visiting) + 1
    depthCache.set(name, value)
    visiting.delete(name)
    return value
  }

  return [...customPositions].sort((a, b) => {
    const depthDiff = depth(a.name) - depth(b.name)
    if (depthDiff !== 0) return depthDiff
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}

export function buildOpAdvanceLifecycleSummary(
  catalog: WorkspacePositionCatalog
): import('@/lib/operational-period-roster-types').OpAdvanceLifecycleSummary {
  const retiring: string[] = []
  const creating: string[] = []
  let persistingCount = 0

  for (const name of catalog.rosterPositionNames) {
    const meta = catalog.positionMetaByName[name]
    if (!meta) continue
    if (meta.opAdvanceLabel === 'retire_on_op_advance') {
      retiring.push(name)
    } else if (meta.opAdvanceLabel === 'create_on_op_advance') {
      creating.push(name)
    } else {
      persistingCount += 1
    }
  }

  return { retiring, creating, persistingCount }
}

export function canAssignMembersToPositionNow(
  catalog: WorkspacePositionCatalog,
  positionName: string
): boolean {
  const meta = catalog.positionMetaByName[positionName]
  if (!meta || meta.isArchived) return false
  if (!meta.isOnOrgChart && !meta.isPlanned) return false
  return getPositionMemberSchedulePolicy(meta).allowActiveAssignment
}

export function canScheduleMembersForPosition(
  catalog: WorkspacePositionCatalog,
  positionName: string
): boolean {
  const meta = catalog.positionMetaByName[positionName]
  if (!meta || meta.isArchived) return false
  const policy = getPositionMemberSchedulePolicy(meta)
  return policy.allowScheduleAssign || policy.allowScheduleUnassign
}

export function canAssignMembersToPosition(
  catalog: WorkspacePositionCatalog,
  positionName: string
): boolean {
  return canAssignMembersToPositionNow(catalog, positionName)
}

export function buildReportsToOptions(catalog: WorkspacePositionCatalog): string[] {
  return [...catalog.orgChartPositionNames].sort((a, b) => a.localeCompare(b))
}

export function canSetOpAdvanceLabelForPosition(
  catalog: WorkspacePositionCatalog,
  positionName: string,
  label: PositionOpAdvanceLabel
): boolean {
  const meta = catalog.positionMetaByName[positionName]
  if (!meta || meta.isArchived) return false
  if (label === 'create_on_op_advance') {
    return meta.source === 'custom' && meta.isPlanned
  }
  if (label === 'retire_on_op_advance') {
    return meta.isOnOrgChart
  }
  return true
}

export function isCustomWorkspacePosition(
  position: string,
  catalog: WorkspacePositionCatalog
): boolean {
  return catalog.customPositionNames.has(position)
}

export type WorkspaceOrgChartLayout = {
  rootPosition: string
  rootChildren: OrgChartNode[]
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>
  sectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
}

function cloneOrgChartNode(node: OrgChartNode): OrgChartNode {
  if (node.kind === 'position') {
    return {
      ...node,
      children: node.children ? node.children.map(cloneOrgChartNode) : undefined,
    }
  }
  if (node.kind === 'asset') {
    return { ...node }
  }
  if (node.kind === 'single_resource') {
    return { ...node }
  }
  if (node.kind === 'stack' || node.kind === 'fork') {
    return {
      ...node,
      children: node.children.map(cloneOrgChartNode),
    }
  }
  return {
    ...node,
    children: node.children.map(cloneOrgChartNode),
  }
}

function attachCustomPositionToTree(
  nodes: OrgChartNode[],
  parentName: string,
  child: OrgChartNode
): boolean {
  for (const node of nodes) {
    if (node.kind === 'asset' || node.kind === 'single_resource') {
      continue
    }
    if (node.kind === 'position') {
      if (node.position === parentName) {
        node.children = [...(node.children ?? []), child]
        return true
      }
      if (node.children && attachCustomPositionToTree(node.children, parentName, child)) {
        return true
      }
      continue
    }
    if (node.kind === 'stack' || node.kind === 'fork' || node.kind === 'group') {
      if (attachCustomPositionToTree(node.children, parentName, child)) {
        return true
      }
    }
  }
  return false
}

export function buildWorkspaceOrgChartLayout(
  catalog: WorkspacePositionCatalog,
  base: {
    rootPosition: string
    commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>
    sectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  }
): WorkspaceOrgChartLayout {
  const commandStaffBranch = cloneOrgChartNode(
    base.commandStaffBranch
  ) as Extract<OrgChartNode, { kind: 'group' }>
  const sectionBranches = base.sectionBranches.map(
    (branch) => cloneOrgChartNode(branch) as Extract<OrgChartNode, { kind: 'group' }>
  )
  const rootChildren: OrgChartNode[] = []
  const allBranches: OrgChartNode[] = [
    ...rootChildren,
    ...commandStaffBranch.children,
    ...sectionBranches.flatMap((branch) => branch.children),
  ]

  const sortedCustom = sortCustomPositionsForInsert(catalog.customPositions)
  for (const custom of sortedCustom) {
    const childNode: OrgChartNode = {
      kind: 'position',
      position: custom.name,
    }
    if (custom.reportsTo === base.rootPosition) {
      rootChildren.push(childNode)
      continue
    }
    attachCustomPositionToTree(allBranches, custom.reportsTo, childNode)
  }

  return {
    rootPosition: base.rootPosition,
    rootChildren,
    commandStaffBranch,
    sectionBranches,
  }
}
