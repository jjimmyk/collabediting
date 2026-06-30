import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  ORG_CHART_CARD_TO_CHILDREN_GAP,
  orgChartHwcgSectionChiefRowTokens,
} from '@/features/roster/org-chart-layout-tokens'
import { orgChartPositionConnectorId } from '@/features/roster/org-chart-node-id'
import { OrgChartSectionSubHierarchy } from '@/features/roster/org-chart-spine-layout'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'

const OPERATIONS_SECTION_LABEL = 'Operations Section'

type OrgChartHwcgSectionLayoutProps = {
  sectionChiefs: {
    branch: Extract<OrgChartNode, { kind: 'group' }>
    chief: Extract<OrgChartNode, { kind: 'position' }>
  }[]
  renderProps: OrgChartWideRenderProps
}

function OrgChartHwcgSectionChiefCell({
  branch,
  chief,
  renderProps,
}: {
  branch: Extract<OrgChartNode, { kind: 'group' }>
  chief: Extract<OrgChartNode, { kind: 'position' }>
  renderProps: OrgChartWideRenderProps
}) {
  const columnRef = useRef<HTMLDivElement>(null)
  const chiefCardRef = useRef<HTMLDivElement>(null)
  const chiefId = orgChartPositionConnectorId(chief.position)

  useLayoutEffect(() => {
    const column = columnRef.current
    const chiefCard = chiefCardRef.current
    if (!column || !chiefCard) return

    const apply = () => {
      column.style.setProperty('--org-chart-card-width', `${chiefCard.offsetWidth}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(chiefCard)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={columnRef} className="flex flex-col items-center self-start overflow-visible">
      <div ref={chiefCardRef} className="w-full" data-org-chart-section-chief>
        {renderProps.renderLeafNode(chief, {
          parentColor: chief.color ?? branch.color,
          suppressChildren: true,
          connectorAnchorId: chiefId,
        })}
      </div>
    </div>
  )
}

function OrgChartHwcgOperationsSectionCell({
  branch,
  chief,
  renderProps,
}: {
  branch: Extract<OrgChartNode, { kind: 'group' }>
  chief: Extract<OrgChartNode, { kind: 'position' }>
  renderProps: OrgChartWideRenderProps
}) {
  const columnRef = useRef<HTMLDivElement>(null)
  const chiefCardRef = useRef<HTMLDivElement>(null)
  const chiefId = orgChartPositionConnectorId(chief.position)
  const subtreeNodes = chief.children ?? []

  useLayoutEffect(() => {
    const column = columnRef.current
    const chiefCard = chiefCardRef.current
    if (!column || !chiefCard) return

    const apply = () => {
      column.style.setProperty('--org-chart-card-width', `${chiefCard.offsetWidth}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(chiefCard)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={columnRef}
      className={cn(
        'flex flex-col items-center self-start overflow-visible',
        ORG_CHART_CARD_TO_CHILDREN_GAP
      )}
    >
      <div ref={chiefCardRef} className="w-full" data-org-chart-section-chief>
        {renderProps.renderLeafNode(chief, {
          parentColor: chief.color ?? branch.color,
          suppressChildren: true,
          connectorAnchorId: chiefId,
        })}
      </div>
      {subtreeNodes.length > 0 ? (
        <div className="w-max self-center rounded-lg border border-border/60 bg-muted/20 p-3">
          <OrgChartSectionSubHierarchy headerId={chiefId}>
            <OrgChartWideSpineTree
              parentId={chiefId}
              nodes={subtreeNodes}
              parentColor={chief.color ?? branch.color}
              renderProps={renderProps}
            />
          </OrgChartSectionSubHierarchy>
        </div>
      ) : null}
    </div>
  )
}

export function OrgChartHwcgSectionLayout({
  sectionChiefs,
  renderProps,
}: OrgChartHwcgSectionLayoutProps) {
  const { columnClassName, gridTemplateColumnsClassName } =
    orgChartHwcgSectionChiefRowTokens()

  return (
    <div
      className={cn(
        'mx-auto grid w-max items-start',
        columnClassName,
        gridTemplateColumnsClassName
      )}
    >
      {sectionChiefs.map(({ branch, chief }) =>
        branch.label === OPERATIONS_SECTION_LABEL ? (
          <OrgChartHwcgOperationsSectionCell
            key={branch.label}
            branch={branch}
            chief={chief}
            renderProps={renderProps}
          />
        ) : (
          <OrgChartHwcgSectionChiefCell
            key={branch.label}
            branch={branch}
            chief={chief}
            renderProps={renderProps}
          />
        )
      )}
    </div>
  )
}
