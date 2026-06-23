import { cn } from '@/lib/utils'
import { OrgChartCardAnchor } from '@/features/roster/org-chart-card-anchor'
import {
  ORG_CHART_COMMAND_STAFF_HEADER_ID,
  orgChartNodeConnectorId,
} from '@/features/roster/org-chart-node-id'
import {
  OrgChartSpineChildren,
  OrgChartSpineNode,
} from '@/features/roster/org-chart-spine-layout'
import {
  filterVisibleOrgChartChildren,
  orgChartNodeKey,
  positionNodeIsVisible,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'

function collectSpineChildIds(
  nodes: OrgChartNode[],
  renderProps: OrgChartWideRenderProps
): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    const id = resolveSpineNodeConnectorId(node, renderProps)
    if (id) ids.push(id)
  }
  return ids
}

function resolveSpineNodeConnectorId(
  node: OrgChartNode,
  renderProps: OrgChartWideRenderProps
): string | null {
  if (node.kind === 'asset') {
    return renderProps.assetsByKey[node.assetKey] ? orgChartNodeConnectorId(node) : null
  }
  if (node.kind === 'single_resource') {
    return renderProps.rosterById[node.memberId] ? orgChartNodeConnectorId(node) : null
  }
  if (node.kind === 'position') {
    if (
      !positionNodeIsVisible(
        node.position,
        node.children ?? [],
        renderProps.visiblePositions,
        renderProps.displayFilters
      )
    ) {
      return null
    }
    if (!renderProps.entriesByPosition[node.position]) return null
    return orgChartNodeConnectorId(node)
  }
  return null
}

function flattenWideSpineNodes(
  nodes: OrgChartNode[],
  renderProps: OrgChartWideRenderProps
): OrgChartNode[] {
  const flattened: OrgChartNode[] = []
  for (const node of nodes) {
    if (node.kind === 'stack' || node.kind === 'fork') {
      flattened.push(
        ...flattenWideSpineNodes(
          filterVisibleOrgChartChildren(
            node.children,
            renderProps.visiblePositions,
            renderProps.displayFilters
          ),
          renderProps
        )
      )
      continue
    }
    flattened.push(node)
  }
  return flattened
}

type OrgChartWideSpineTreeProps = {
  parentId: string
  nodes: OrgChartNode[]
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}

export function OrgChartWideSpineTree({
  parentId,
  nodes,
  parentColor,
  renderProps,
}: OrgChartWideSpineTreeProps) {
  const visibleNodes = flattenWideSpineNodes(nodes, renderProps)
  if (visibleNodes.length === 0) return null

  const childIds = collectSpineChildIds(visibleNodes, renderProps)
  if (childIds.length === 0) return null

  return (
    <OrgChartSpineChildren parentId={parentId} childIds={childIds}>
      {visibleNodes.map((node, index) => (
        <OrgChartWideSpineNode
          key={orgChartNodeKey(node, index)}
          node={node}
          parentColor={parentColor}
          renderProps={renderProps}
        />
      ))}
    </OrgChartSpineChildren>
  )
}

function OrgChartWideSpineNode({
  node,
  parentColor,
  renderProps,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}) {
  const connectorId = resolveSpineNodeConnectorId(node, renderProps)
  if (!connectorId) return null

  const card = renderProps.renderLeafNode(node, {
    parentColor,
    suppressChildren: true,
    connectorAnchorId: connectorId,
  })

  if (node.kind !== 'position') {
    return <OrgChartSpineNode card={card} />
  }

  const nestedNodes = filterVisibleOrgChartChildren(
    node.children ?? [],
    renderProps.visiblePositions,
    renderProps.displayFilters
  )
  if (nestedNodes.length === 0) {
    return <OrgChartSpineNode card={card} />
  }

  return (
    <OrgChartSpineNode
      card={card}
      nested={
        <OrgChartWideSpineTree
          parentId={connectorId}
          nodes={nestedNodes}
          parentColor={node.color ?? parentColor}
          renderProps={renderProps}
        />
      }
    />
  )
}

export function CommandStaffHeaderCard({ className }: { className?: string }) {
  return (
    <OrgChartCardAnchor
      id={ORG_CHART_COMMAND_STAFF_HEADER_ID}
      className={cn(
        'rounded-xl border-2 border-border px-3 py-2.5 text-center shadow-sm',
        className
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
        Command Staff
      </p>
    </OrgChartCardAnchor>
  )
}
