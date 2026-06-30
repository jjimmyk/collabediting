import { OrgChartCrossbarColumns } from '@/features/roster/OrgChartConnectors'
import {
  ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH,
  orgChartForkLayoutTokens,
} from '@/features/roster/org-chart-layout-tokens'
import { OrgChartSpineRegister } from '@/features/roster/org-chart-spine-layout'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import {
  filterVisibleOrgChartChildren,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import { partitionWideSpineConnectorIds } from '@/features/roster/org-chart-wide-spine-partition'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import { cn } from '@/lib/utils'

type OrgChartHwcgSourceControlGroupsForkProps = {
  parentId: string
  node: Extract<OrgChartNode, { kind: 'fork' }>
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}

export function OrgChartHwcgSourceControlGroupsFork({
  parentId,
  node,
  parentColor,
  renderProps,
}: OrgChartHwcgSourceControlGroupsForkProps) {
  const visibleChildren = filterVisibleOrgChartChildren(
    node.children,
    renderProps.visiblePositions,
    renderProps.displayFilters
  )
  const groupPositions = visibleChildren.filter(
    (child): child is Extract<OrgChartNode, { kind: 'position' }> => child.kind === 'position'
  )
  if (groupPositions.length === 0) return null

  const { solid, dashed } = partitionWideSpineConnectorIds(groupPositions, renderProps)
  const forkLayout = orgChartForkLayoutTokens('hwcg_source_control')
  const groupColor = node.color ?? parentColor

  return (
    <>
      {solid.length > 0 ? (
        <OrgChartSpineRegister parentId={parentId} childIds={solid} layout="crossbar" />
      ) : null}
      {dashed.length > 0 ? (
        <OrgChartSpineRegister parentId={parentId} childIds={dashed} dashed layout="crossbar" />
      ) : null}
      <OrgChartCrossbarColumns
        columns={groupPositions.map((group) => {
          const connectorId = resolveOrgChartNodeConnectorId(group, renderProps)
          if (!connectorId) return null
          const nestedNodes = filterVisibleOrgChartChildren(
            group.children ?? [],
            renderProps.visiblePositions,
            renderProps.displayFilters
          )
          return (
            <div
              key={group.position}
              className={cn(
                'flex shrink-0 flex-col items-center',
                ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH
              )}
            >
              {renderProps.renderLeafNode(group, {
                parentColor: group.color ?? groupColor,
                suppressChildren: true,
                connectorAnchorId: connectorId,
              })}
              {nestedNodes.length > 0 ? (
                <OrgChartWideSpineTree
                  parentId={connectorId}
                  nodes={nestedNodes}
                  parentColor={group.color ?? groupColor}
                  renderProps={renderProps}
                />
              ) : null}
            </div>
          )
        })}
        className="w-max"
        columnClassName={forkLayout.columnClassName}
        expandToParent={false}
        showInboundStem
      />
    </>
  )
}

export function resolveForkCrossbarLayout(
  visibleNodes: OrgChartNode[]
): 'crossbar' | undefined {
  if (visibleNodes.length !== 1 || visibleNodes[0].kind !== 'fork') return undefined
  const forkVariant = visibleNodes[0].forkVariant
  if (forkVariant === 'hwcg_ops' || forkVariant === 'hwcg_source_control') {
    return 'crossbar'
  }
  return undefined
}
