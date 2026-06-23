import {
  OrgChartSpineChildren,
  OrgChartSpineNode,
} from '@/features/roster/org-chart-spine-layout'
import {
  filterVisibleOrgChartChildren,
  orgChartNodeKey,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'

function collectSpineChildIds(
  nodes: OrgChartNode[],
  renderProps: OrgChartWideRenderProps
): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    const id = resolveOrgChartNodeConnectorId(node, renderProps)
    if (id) ids.push(id)
  }
  return ids
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
  const connectorId = resolveOrgChartNodeConnectorId(node, renderProps)
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
