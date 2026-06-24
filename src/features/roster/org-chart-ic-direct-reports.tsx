import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import { ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP } from '@/features/roster/org-chart-layout-tokens'
import { OrgChartSectionSubHierarchy } from '@/features/roster/org-chart-spine-layout'
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
  const columnRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const connectorId = resolveOrgChartNodeConnectorId(node, renderProps)

  useLayoutEffect(() => {
    const column = columnRef.current
    const card = cardRef.current
    if (!column || !card) return

    const apply = () => {
      column.style.setProperty('--org-chart-card-width', `${card.offsetWidth}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(card)
    return () => observer.disconnect()
  }, [connectorId])

  if (!connectorId) return null

  const parentColor: OrgChartColor | undefined =
    node.kind === 'position' ? (node.color ?? 'neutral') : 'neutral'

  const nestedNodes =
    node.kind === 'position' ? (node.children ?? []) : []

  return (
    <div ref={columnRef} className="flex flex-col items-start">
      <div ref={cardRef} className="w-full">
        {renderProps.renderLeafNode(node, {
          parentColor,
          suppressChildren: true,
          connectorAnchorId: connectorId,
        })}
      </div>
      {node.kind === 'position' && nestedNodes.length > 0 ? (
        <OrgChartSectionSubHierarchy headerId={connectorId}>
          <OrgChartWideSpineTree
            parentId={connectorId}
            nodes={nestedNodes}
            parentColor={parentColor}
            renderProps={renderProps}
          />
        </OrgChartSectionSubHierarchy>
      ) : null}
    </div>
  )
}
