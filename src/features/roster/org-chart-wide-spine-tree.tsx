import {
  OrgChartSpineNode,
  OrgChartSpineRegister,
} from '@/features/roster/org-chart-spine-layout'
import { OrgChartFork } from '@/features/roster/OrgChartConnectors'
import { OrgChartHwcgOpsFork } from '@/features/roster/org-chart-hwcg-ops-fork'
import { resolveForkCrossbarLayout } from '@/features/roster/org-chart-hwcg-source-control-groups-fork'
import {
  filterVisibleOrgChartChildren,
  orgChartNodeKey,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import {
  partitionWideSpineConnectorIds,
} from '@/features/roster/org-chart-wide-spine-partition'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import { cn } from '@/lib/utils'

function flattenStackNodes(
  nodes: OrgChartNode[],
  renderProps: OrgChartWideRenderProps
): OrgChartNode[] {
  const flattened: OrgChartNode[] = []
  for (const node of nodes) {
    if (node.kind === 'stack') {
      flattened.push(
        ...flattenStackNodes(
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
    if (node.kind === 'fork') {
      flattened.push(node)
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
  const visibleNodes = filterVisibleOrgChartChildren(
    nodes,
    renderProps.visiblePositions,
    renderProps.displayFilters
  )
  if (visibleNodes.length === 0) return null

  const { solid, dashed } = partitionWideSpineConnectorIds(visibleNodes, renderProps)
  if (solid.length === 0 && dashed.length === 0) return null

  const crossbarLayout = resolveForkCrossbarLayout(visibleNodes)

  return (
    <>
      {solid.length > 0 ? (
        <OrgChartSpineRegister
          parentId={parentId}
          childIds={solid}
          layout={crossbarLayout}
        />
      ) : null}
      {dashed.length > 0 ? (
        <OrgChartSpineRegister
          parentId={parentId}
          childIds={dashed}
          dashed
          layout={crossbarLayout}
        />
      ) : null}
      <div className={cn('flex flex-col gap-2')}>
        {visibleNodes.map((node, index) => (
          <OrgChartWideSpineLayoutNode
            key={orgChartNodeKey(node, index)}
            node={node}
            parentColor={parentColor}
            renderProps={renderProps}
          />
        ))}
      </div>
    </>
  )
}

function OrgChartWideSpineLayoutNode({
  node,
  parentColor,
  renderProps,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}) {
  if (node.kind === 'fork') {
    const visibleChildren = filterVisibleOrgChartChildren(
      node.children,
      renderProps.visiblePositions,
      renderProps.displayFilters
    )
    if (visibleChildren.length === 0) return null

    if (node.forkVariant === 'hwcg_ops') {
      return (
        <OrgChartHwcgOpsFork
          node={node}
          parentColor={parentColor}
          renderProps={renderProps}
        />
      )
    }

    return (
      <OrgChartFork layout="horizontal" forkVariant={node.forkVariant}>
        {visibleChildren.map((child, index) => (
          <OrgChartWideSpineSubtree
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartFork>
    )
  }

  if (node.kind === 'stack') {
    const flattened = flattenStackNodes([node], renderProps)
    if (flattened.length === 0) return null

    return (
      <div className={cn('flex w-full flex-col items-start gap-2')}>
        {flattened.map((child, index) => (
          <OrgChartWideSpineSubtree
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </div>
    )
  }

  return (
    <OrgChartWideSpineSubtree
      node={node}
      parentColor={parentColor}
      renderProps={renderProps}
    />
  )
}

function OrgChartWideSpineSubtree({
  node,
  parentColor,
  renderProps,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}) {
  if (node.kind === 'fork' || node.kind === 'stack') {
    return (
      <OrgChartWideSpineLayoutNode
        node={node}
        parentColor={parentColor}
        renderProps={renderProps}
      />
    )
  }

  return (
    <OrgChartWideSpineNode node={node} parentColor={parentColor} renderProps={renderProps} />
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
