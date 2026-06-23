import { cn } from '@/lib/utils'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import { ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP } from '@/features/roster/org-chart-layout-tokens'
import {
  orgChartNodeKey,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartColor, OrgChartNode } from '@/features/roster/ics-org-chart-structure'

type OrgChartIcDirectReportsRowProps = {
  nodes: OrgChartNode[]
  renderProps: OrgChartWideRenderProps
  marginClassName?: string
  className?: string
}

export function OrgChartIcDirectReportsRow({
  nodes,
  renderProps,
  marginClassName = ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP,
  className,
}: OrgChartIcDirectReportsRowProps) {
  if (nodes.length === 0) return null

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-start justify-center gap-x-8 gap-y-4',
        marginClassName,
        className
      )}
    >
      {nodes.map((node, index) => (
        <OrgChartIcDirectReportItem
          key={orgChartNodeKey(node, index)}
          node={node}
          renderProps={renderProps}
        />
      ))}
    </div>
  )
}

function OrgChartIcDirectReportItem({
  node,
  renderProps,
}: {
  node: OrgChartNode
  renderProps: OrgChartWideRenderProps
}) {
  const connectorId = resolveOrgChartNodeConnectorId(node, renderProps)
  if (!connectorId) return null

  const parentColor: OrgChartColor | undefined =
    node.kind === 'position' ? (node.color ?? 'neutral') : 'neutral'

  const nestedNodes =
    node.kind === 'position' ? (node.children ?? []) : []

  return (
    <div className="flex flex-col items-center">
      {renderProps.renderLeafNode(node, {
        parentColor,
        suppressChildren: true,
        connectorAnchorId: connectorId,
      })}
      {node.kind === 'position' && nestedNodes.length > 0 ? (
        <OrgChartWideSpineTree
          parentId={connectorId}
          nodes={nestedNodes}
          parentColor={parentColor}
          renderProps={renderProps}
        />
      ) : null}
    </div>
  )
}
