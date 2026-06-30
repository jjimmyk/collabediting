import { getOrgChartCommandStaffPositions } from '@/features/roster/build-dynamic-org-chart'
import type {
  OrgChartIcBusLink,
  OrgChartSpineLink,
} from '@/features/roster/org-chart-connector-context.types'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import {
  ORG_CHART_IC_CONNECTOR_ID,
  orgChartPositionConnectorId,
} from '@/features/roster/org-chart-node-id'
import { resolveForkCrossbarLayout } from '@/features/roster/org-chart-hwcg-source-control-groups-fork'
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
import {
  partitionWideSpineConnectorIds,
} from '@/features/roster/org-chart-wide-spine-partition'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

export type OrgChartConnectorLinkContext = {
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
  orgChartTemplateSlug?: string | null
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
  const positions = getOrgChartCommandStaffPositions(context.orgChartTemplateSlug)
  return positions.filter((position) => {
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

function collectSpineLinksFromNodes(
  parentId: string,
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): OrgChartSpineLink[] {
  const visibleNodes = filterVisibleOrgChartChildren(
    nodes,
    context.visiblePositions,
    context.displayFilters
  )
  if (visibleNodes.length === 0) return []

  const { solid, dashed } = partitionWideSpineConnectorIds(visibleNodes, context)
  const crossbarLayout = resolveForkCrossbarLayout(visibleNodes)
  const links: OrgChartSpineLink[] = []
  if (solid.length > 0) {
    links.push({
      parentId,
      childIds: solid,
      ...(crossbarLayout ? { layout: crossbarLayout } : {}),
    })
  }
  if (dashed.length > 0) {
    links.push({
      parentId,
      childIds: dashed,
      dashed: true,
      ...(crossbarLayout ? { layout: crossbarLayout } : {}),
    })
  }

  for (const node of visibleNodes) {
    if (node.kind === 'fork') {
      const visibleChildren = filterVisibleOrgChartChildren(
        node.children,
        context.visiblePositions,
        context.displayFilters
      )
      for (const child of visibleChildren) {
        links.push(...collectSpineLinksFromSubtree(child, context))
      }
      continue
    }
    if (node.kind === 'stack') {
      links.push(...collectSpineLinksFromSubtree(node, context))
      continue
    }
    links.push(...collectSpineLinksFromSubtree(node, context))
  }

  return links
}

function collectSpineLinksFromSubtree(
  node: OrgChartNode,
  context: OrgChartConnectorLinkContext
): OrgChartSpineLink[] {
  if (node.kind === 'fork' || node.kind === 'stack') {
    const connectorId = resolveOrgChartNodeConnectorId(node, context)
    if (connectorId) {
      return collectSpineLinksFromNodes(connectorId, node.children, context)
    }
    return collectSpineLinksFromNodes('unused', node.children, context)
  }

  if (node.kind !== 'position') return []

  const connectorId = resolveOrgChartNodeConnectorId(node, context)
  if (!connectorId) return []

  const nestedNodes = filterVisibleOrgChartChildren(
    node.children ?? [],
    context.visiblePositions,
    context.displayFilters
  )
  if (nestedNodes.length === 0) return []

  return collectSpineLinksFromNodes(connectorId, nestedNodes, context)
}

function collectIcDirectReportSpineLinks(
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): OrgChartSpineLink[] {
  const links: OrgChartSpineLink[] = []
  for (const node of nodes) {
    links.push(...collectSpineLinksFromSubtree(node, context))
  }
  return links
}

function resolveIcDirectReportConnectorIds(
  nodes: OrgChartNode[],
  context: OrgChartConnectorLinkContext
): { solid: string[]; dashed: string[] } {
  const solid: string[] = []
  const dashed: string[] = []

  for (const node of nodes) {
    const connectorId = resolveOrgChartNodeConnectorId(node, context)
    if (!connectorId) continue
    if (node.kind === 'position' && node.connectorStyle === 'dashed') {
      dashed.push(connectorId)
    } else {
      solid.push(connectorId)
    }
  }

  return { solid, dashed }
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
    spineLinks.push(...collectSpineLinksFromNodes(chiefId, chief.children ?? [], context))
  }

  const icDirectReportConnectorGroups = resolveIcDirectReportConnectorIds(
    visibility.icDirectReportNodes,
    context
  )

  const sectionConnectorIds = visibility.sectionChiefs.map(({ chief }) =>
    orgChartPositionConnectorId(chief.position)
  )

  const icBusLinks: OrgChartIcBusLink[] = []
  if (visibility.icVisible) {
    if (icDirectReportConnectorGroups.dashed.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: icDirectReportConnectorGroups.dashed,
        dashed: true,
      })
    }
    if (icDirectReportConnectorGroups.solid.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: icDirectReportConnectorGroups.solid,
      })
    }
    if (sectionConnectorIds.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: sectionConnectorIds,
      })
    }
  }

  return { spineLinks, icBusLinks }
}
