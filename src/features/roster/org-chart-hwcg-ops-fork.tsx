import { OrgChartCrossbarColumns } from '@/features/roster/OrgChartConnectors'
import {
  ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH,
  orgChartForkLayoutTokens,
} from '@/features/roster/org-chart-layout-tokens'
import { OrgChartHwcgSourceControlGroupsFork } from '@/features/roster/org-chart-hwcg-source-control-groups-fork'
import {
  filterVisibleOrgChartChildren,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import { cn } from '@/lib/utils'

type OrgChartHwcgOpsForkProps = {
  node: Extract<OrgChartNode, { kind: 'fork' }>
  parentColor?: OrgChartColor
  renderProps: OrgChartWideRenderProps
}

/**
 * HWCG Operations fork — three branch headers on a tight crossbar; Source Control
 * groups render below the Source Control column only.
 */
export function OrgChartHwcgOpsFork({
  node,
  parentColor,
  renderProps,
}: OrgChartHwcgOpsForkProps) {
  const visibleChildren = filterVisibleOrgChartChildren(
    node.children,
    renderProps.visiblePositions,
    renderProps.displayFilters
  )
  if (visibleChildren.length === 0) return null

  const branchPositions = visibleChildren.filter(
    (child): child is Extract<OrgChartNode, { kind: 'position' }> => child.kind === 'position'
  )
  const sourceControlBranch = branchPositions.find(
    (child) => child.position === 'Source Control Branch'
  )
  const sourceControlConnectorId = sourceControlBranch
    ? resolveOrgChartNodeConnectorId(sourceControlBranch, renderProps)
    : null
  const sourceControlGroupsFork = sourceControlBranch?.children?.find(
    (child): child is Extract<OrgChartNode, { kind: 'fork' }> =>
      child.kind === 'fork' && child.forkVariant === 'hwcg_source_control'
  )

  const forkLayout = orgChartForkLayoutTokens('hwcg_ops')
  const branchColor = node.color ?? parentColor

  const branchCards = branchPositions.map((child) => {
    const connectorId = resolveOrgChartNodeConnectorId(child, renderProps)
    if (!connectorId) return null
    return renderProps.renderLeafNode(child, {
      parentColor: child.color ?? branchColor,
      suppressChildren: true,
      connectorAnchorId: connectorId,
    })
  })

  return (
    <div className="flex w-max flex-col items-center gap-2">
      <OrgChartCrossbarColumns
        columns={branchCards.map((card, index) => (
          <div
            key={branchPositions[index]?.position ?? index}
            className={cn(
              'flex shrink-0 flex-col items-center',
              ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH
            )}
          >
            {card}
          </div>
        ))}
        className="w-max"
        columnClassName={forkLayout.columnClassName}
        expandToParent={false}
        showInboundStem
      />

      {sourceControlBranch && sourceControlConnectorId && sourceControlGroupsFork ? (
        <div className={cn('grid w-max', forkLayout.columnClassName)}>
          <div aria-hidden className={ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH} />
          <OrgChartHwcgSourceControlGroupsFork
            parentId={sourceControlConnectorId}
            node={sourceControlGroupsFork}
            parentColor={sourceControlBranch.color ?? branchColor}
            renderProps={renderProps}
          />
          <div aria-hidden className={ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH} />
        </div>
      ) : null}
    </div>
  )
}
