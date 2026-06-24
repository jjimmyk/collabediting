import type {
  OrgChartIcBusLink,
  OrgChartSpineLink,
} from '@/features/roster/org-chart-connector-context.types'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import {
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS,
} from '@/features/roster/ics-org-chart-structure'
import {
  ORG_CHART_IC_CONNECTOR_ID,
  orgChartPositionConnectorId,
} from '@/features/roster/org-chart-node-id'
import {
  orgChartBranchSectionKey,
  orgChartSectionFilterEnabled,
} from '@/features/roster/roster-org-chart-sections'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import {
  buildIcDirectReportNodes,
  filterVisibleOrgChartChildren,
  positionBranchIsVisible,
  positionNodeIsVisible,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

export type OrgChartConnectorLinkContext = {
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
}

export type WideLayoutVisibility = {
  icVisible: boolean
  visibleRootChildren: OrgChartNode[]
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  visibleCommandStaff: string[]
  showCommandStaff: boolean
  sectionChiefs: {
    branch: Extract<OrgChartNode, { kind: 'group' }>
    chief: Extract<OrgChartNode, { kind: 'position' }>
  }[]
  icDirectReportNodes: OrgChartNode[]
}

export type WideLayoutConnectorLinks = {
  spineLinks: OrgChartSpineLink[]
  icBusLinks: OrgChartIcBusLink[]
}

function getSectionChief(
  branch: Extract<OrgChartNode, { kind: 'group' }>,
  context: OrgChartConnectorLinkContext
): Extract<OrgChartNode, { kind: 'position' }> | null {
  const chief = branch.children.find(
    (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
      child.kind === 'position' &&
      positionBranchIsVisible(child, context.visiblePositions, context.displayFilters)
  )
  return chief ?? null
}

function getCommandStaffPositionNode(
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>,
  position: string
): Extract<OrgChartNode, { kind: 'position' }> | null {
  return (
    commandStaffBranch.children.find(
      (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
        child.kind === 'position' && child.position === position
    ) ?? null
  )
}

function getVisibleCommandStaffPositions(
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>,
  context: OrgChartConnectorLinkContext
): string[] {
  return ICS_ORG_CHART_COMMAND_STAFF_POSITIONS.filter((position) => {
    const node = getCommandStaffPositionNode(commandStaffBranch, position)
    if (!node) return false
    return positionBranchIsVisible(node, context.visiblePositions, context.displayFilters)
  })
}

export function resolveWideLayoutVisibility(
  orgChartLayout: WorkspaceOrgChartLayout,
  context: OrgChartConnectorLinkContext
): WideLayoutVisibility {
  const visibleSectionBranches = orgChartLayout.sectionBranches.filter((branch) => {
    const sectionKey = orgChartBranchSectionKey(branch)
    if (sectionKey && !orgChartSectionFilterEnabled(sectionKey, context.displayFilters)) {
      return false
    }
    return branch.children.some(
      (child) =>
        child.kind === 'position' &&
        positionBranchIsVisible(child, context.visiblePositions, context.displayFilters)
    )
  })

  const visibleCommandStaff = context.displayFilters.showCommandStaff
    ? getVisibleCommandStaffPositions(orgChartLayout.commandStaffBranch, context)
    : []
  const showCommandStaff = visibleCommandStaff.length > 0

  const icVisible =
    context.displayFilters.showIncidentCommander &&
    positionNodeIsVisible(
      orgChartLayout.rootPosition,
      orgChartLayout.rootChildren,
      context.visiblePositions,
      context.displayFilters
    )

  const visibleRootChildren = filterVisibleOrgChartChildren(
    orgChartLayout.rootChildren,
    context.visiblePositions,
    context.displayFilters
  )

  const sectionChiefs = visibleSectionBranches
    .map((branch) => ({ branch, chief: getSectionChief(branch, context) }))
    .filter(
      (entry): entry is {
        branch: Extract<OrgChartNode, { kind: 'group' }>
        chief: Extract<OrgChartNode, { kind: 'position' }>
      } => entry.chief !== null
    )

  const commandStaffNodes = showCommandStaff
    ? visibleCommandStaff
        .map((position) => getCommandStaffPositionNode(orgChartLayout.commandStaffBranch, position))
        .filter((node): node is Extract<OrgChartNode, { kind: 'position' }> => node !== null)
    : []

  const icDirectReportNodes = buildIcDirectReportNodes(commandStaffNodes, visibleRootChildren)

  return {
    icVisible,
    visibleRootChildren,
    visibleSectionBranches,
    visibleCommandStaff,
    showCommandStaff,
    sectionChiefs,
    icDirectReportNodes,
  }
}

function flattenWideSpineNodes(
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): OrgChartNode[] {
  const flattened: OrgChartNode[] = []
  for (const node of nodes) {
    if (node.kind === 'stack' || node.kind === 'fork') {
      flattened.push(
        ...flattenWideSpineNodes(
          filterVisibleOrgChartChildren(
            node.children,
            context.visiblePositions,
            context.displayFilters
          ),
          context
        )
      )
      continue
    }
    flattened.push(node)
  }
  return flattened
}

function collectSpineChildIds(
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    const id = resolveOrgChartNodeConnectorId(node, context)
    if (id) ids.push(id)
  }
  return ids
}

function collectSpineLinksFromNodes(
  parentId: string,
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): OrgChartSpineLink[] {
  const visibleNodes = flattenWideSpineNodes(nodes, context)
  if (visibleNodes.length === 0) return []

  const childIds = collectSpineChildIds(visibleNodes, context)
  if (childIds.length === 0) return []

  const links: OrgChartSpineLink[] = [{ parentId, childIds }]

  for (const node of visibleNodes) {
    if (node.kind !== 'position') continue
    const connectorId = resolveOrgChartNodeConnectorId(node, context)
    if (!connectorId) continue
    const nestedNodes = filterVisibleOrgChartChildren(
      node.children ?? [],
      context.visiblePositions,
      context.displayFilters
    )
    if (nestedNodes.length === 0) continue
    links.push(...collectSpineLinksFromNodes(connectorId, nestedNodes, context))
  }

  return links
}

function collectIcDirectReportSpineLinks(
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): OrgChartSpineLink[] {
  const links: OrgChartSpineLink[] = []
  for (const node of nodes) {
    const connectorId = resolveOrgChartNodeConnectorId(node, context)
    if (!connectorId || node.kind !== 'position') continue
    const nestedNodes = filterVisibleOrgChartChildren(
      node.children ?? [],
      context.visiblePositions,
      context.displayFilters
    )
    if (nestedNodes.length === 0) continue
    links.push(...collectSpineLinksFromNodes(connectorId, nestedNodes, context))
  }
  return links
}

export function buildWideLayoutConnectorLinks(
  orgChartLayout: WorkspaceOrgChartLayout,
  context: OrgChartConnectorLinkContext
): WideLayoutConnectorLinks {
  const visibility = resolveWideLayoutVisibility(orgChartLayout, context)
  const spineLinks: OrgChartSpineLink[] = []

  spineLinks.push(...collectIcDirectReportSpineLinks(visibility.icDirectReportNodes, context))

  for (const { chief } of visibility.sectionChiefs) {
    const chiefId = orgChartPositionConnectorId(chief.position)
    spineLinks.push(
      ...collectSpineLinksFromNodes(chiefId, chief.children ?? [], context)
    )
  }

  const icDirectReportConnectorIds = visibility.icDirectReportNodes
    .map((node) => resolveOrgChartNodeConnectorId(node, context))
    .filter((id): id is string => id !== null)

  const sectionChiefConnectorIds = visibility.sectionChiefs.map(({ chief }) =>
    orgChartPositionConnectorId(chief.position)
  )

  const icBusLinks: OrgChartIcBusLink[] = []
  if (visibility.icVisible) {
    if (icDirectReportConnectorIds.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: icDirectReportConnectorIds,
      })
    }
    if (sectionChiefConnectorIds.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: sectionChiefConnectorIds,
      })
    }
  }

  return { spineLinks, icBusLinks }
}
