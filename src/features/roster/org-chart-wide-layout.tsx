import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  isHwcgSourceControlOrgChartTemplate,
  resolveOrgChartRootColor,
} from '@/features/roster/build-dynamic-org-chart'
import { OrgChartConnectorOverlay } from '@/features/roster/org-chart-connector-overlay'
import {
  OrgChartConnectorProvider,
  useOrgChartConnectors,
} from '@/features/roster/org-chart-connector-context'
import type { OrgChartIcBusLink } from '@/features/roster/org-chart-connector-context.types'
import { OrgChartIcDirectReportsRow } from '@/features/roster/org-chart-ic-direct-reports'
import {
  ORG_CHART_IC_CONNECTOR_ID,
  orgChartPositionConnectorId,
} from '@/features/roster/org-chart-node-id'
import {
  ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP,
  ORG_CHART_WIDE_GROUPS_ROW_MARGIN_TOP,
  orgChartSectionColumnClassName,
} from '@/features/roster/org-chart-layout-tokens'
import { OrgChartHwcgSectionLayout } from '@/features/roster/org-chart-hwcg-section-layout'
import { OrgChartSectionSubHierarchy } from '@/features/roster/org-chart-spine-layout'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import {
  buildIcDirectReportNodes,
  filterVisibleOrgChartChildren,
  positionBranchIsVisible,
  positionNodeIsVisible,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import {
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

function OrgChartIcBusesRegistrar({ links }: { links: OrgChartIcBusLink[] }) {
  const { setIcBusLinks } = useOrgChartConnectors()
  const linksKey = links
    .map((link) => `${link.commanderId}:${link.dashed ? 'd' : 's'}:${link.headerIds.join('\0')}`)
    .join('|')

  useLayoutEffect(() => {
    setIcBusLinks(links)
    return () => setIcBusLinks([])
  }, [linksKey, links, setIcBusLinks])

  return null
}

function getSectionChief(
  branch: Extract<OrgChartNode, { kind: 'group' }>,
  renderProps: OrgChartWideRenderProps
): Extract<OrgChartNode, { kind: 'position' }> | null {
  const chief = branch.children.find(
    (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
      child.kind === 'position' &&
      positionBranchIsVisible(child, renderProps.visiblePositions, renderProps.displayFilters)
  )
  return chief ?? null
}

function OrgChartSectionColumn({
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
    <div
      ref={columnRef}
      className={cn(
        'flex flex-col items-start',
        orgChartSectionColumnClassName(branch.label, renderProps.orgChartTemplateSlug)
      )}
    >
      <div className="flex w-full flex-col items-center">
        <div ref={chiefCardRef} className="w-full" data-org-chart-section-chief>
          {renderProps.renderLeafNode(chief, {
            parentColor: chief.color ?? branch.color,
            suppressChildren: true,
            connectorAnchorId: chiefId,
          })}
        </div>
        <OrgChartSectionSubHierarchy headerId={chiefId}>
          <OrgChartWideSpineTree
            parentId={chiefId}
            nodes={chief.children ?? []}
            parentColor={chief.color ?? branch.color}
            renderProps={renderProps}
          />
        </OrgChartSectionSubHierarchy>
      </div>
    </div>
  )
}

function resolveIcDirectReportConnectorIds(
  nodes: OrgChartNode[],
  renderProps: OrgChartWideRenderProps
): { solid: string[]; dashed: string[] } {
  const solid: string[] = []
  const dashed: string[] = []

  for (const node of nodes) {
    const connectorId = resolveOrgChartNodeConnectorId(node, renderProps)
    if (!connectorId) continue
    if (node.kind === 'position' && node.connectorStyle === 'dashed') {
      dashed.push(connectorId)
    } else {
      solid.push(connectorId)
    }
  }

  return { solid, dashed }
}

function resolveSectionConnectorIds(
  sectionChiefs: {
    branch: Extract<OrgChartNode, { kind: 'group' }>
    chief: Extract<OrgChartNode, { kind: 'position' }>
  }[]
): string[] {
  return sectionChiefs.map(({ chief }) => orgChartPositionConnectorId(chief.position))
}

type OrgChartWideLayoutProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartWideRenderProps
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  showCommandStaff: boolean
  visibleCommandStaff: string[]
  zoom?: number
  useExportConnectors?: boolean
}

export function OrgChartWideLayout({
  orgChartLayout,
  renderProps,
  visibleSectionBranches,
  showCommandStaff,
  visibleCommandStaff,
  zoom = 1,
  useExportConnectors = false,
}: OrgChartWideLayoutProps) {
  const icVisible =
    renderProps.displayFilters.showIncidentCommander &&
    positionNodeIsVisible(
      orgChartLayout.rootPosition,
      orgChartLayout.rootChildren,
      renderProps.visiblePositions,
      renderProps.displayFilters
    )

  const visibleRootChildren = filterVisibleOrgChartChildren(
    orgChartLayout.rootChildren,
    renderProps.visiblePositions,
    renderProps.displayFilters
  )

  const sectionChiefs = visibleSectionBranches
    .map((branch) => ({ branch, chief: getSectionChief(branch, renderProps) }))
    .filter(
      (entry): entry is {
        branch: Extract<OrgChartNode, { kind: 'group' }>
        chief: Extract<OrgChartNode, { kind: 'position' }>
      } => entry.chief !== null
    )

  const commandStaffNodes = showCommandStaff
    ? visibleCommandStaff
        .map((position) =>
          orgChartLayout.commandStaffBranch.children.find(
            (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
              child.kind === 'position' && child.position === position
          )
        )
        .filter((node): node is Extract<OrgChartNode, { kind: 'position' }> => node !== undefined)
    : []

  const icDirectReportNodes = buildIcDirectReportNodes(commandStaffNodes, visibleRootChildren)
  const icDirectReportConnectorGroups = resolveIcDirectReportConnectorIds(
    icDirectReportNodes,
    renderProps
  )

  const sectionConnectorIds = resolveSectionConnectorIds(sectionChiefs)

  const icBusLinks: OrgChartIcBusLink[] = []
  if (icVisible) {
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

  const rootColor = resolveOrgChartRootColor(renderProps.orgChartTemplateSlug)

  return (
    <OrgChartConnectorProvider>
      <OrgChartWideLayoutBody
        icVisible={icVisible}
        orgChartLayout={orgChartLayout}
        renderProps={renderProps}
        icDirectReportNodes={icDirectReportNodes}
        sectionChiefs={sectionChiefs}
        icBusLinks={icBusLinks}
        rootColor={rootColor}
        zoom={zoom}
        useExportConnectors={useExportConnectors}
      />
    </OrgChartConnectorProvider>
  )
}

function OrgChartWideLayoutBody({
  icVisible,
  orgChartLayout,
  renderProps,
  icDirectReportNodes,
  sectionChiefs,
  icBusLinks,
  rootColor,
  zoom,
  useExportConnectors,
}: {
  icVisible: boolean
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartWideRenderProps
  icDirectReportNodes: OrgChartNode[]
  sectionChiefs: {
    branch: Extract<OrgChartNode, { kind: 'group' }>
    chief: Extract<OrgChartNode, { kind: 'position' }>
  }[]
  icBusLinks: OrgChartIcBusLink[]
  rootColor?: OrgChartColor
  zoom: number
  useExportConnectors: boolean
}) {
  const { chartRef } = useOrgChartConnectors()
  const useHwcgLayout = isHwcgSourceControlOrgChartTemplate(renderProps.orgChartTemplateSlug)

  const sectionChiefsMarginClass =
    icDirectReportNodes.length > 0
      ? ORG_CHART_WIDE_GROUPS_ROW_MARGIN_TOP
      : icVisible
        ? ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP
        : 'mt-4'

  return (
    <div
      ref={chartRef}
      data-org-chart-wide-root
      data-org-chart-zoom={zoom}
      className="relative flex w-full min-w-0 max-w-full flex-col items-center"
    >
      {icVisible ? (
        <div className="flex w-full flex-col items-center">
          {renderProps.renderLeafNode(
            {
              kind: 'position',
              position: orgChartLayout.rootPosition,
              ...(rootColor ? { color: rootColor } : {}),
            },
            { suppressChildren: true, connectorAnchorId: ORG_CHART_IC_CONNECTOR_ID }
          )}
        </div>
      ) : null}

      <OrgChartIcDirectReportsRow
        nodes={icDirectReportNodes}
        renderProps={renderProps}
        marginClassName={
          icVisible ? ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP : 'mt-4'
        }
      />

      {sectionChiefs.length > 0 ? (
        <div
          className={cn(
            'flex items-start justify-center',
            useHwcgLayout ? 'mx-auto w-max' : 'w-full gap-10',
            sectionChiefsMarginClass
          )}
        >
          {useHwcgLayout ? (
            <OrgChartHwcgSectionLayout sectionChiefs={sectionChiefs} renderProps={renderProps} />
          ) : (
            sectionChiefs.map(({ branch, chief }) => (
              <OrgChartSectionColumn
                key={branch.label}
                branch={branch}
                chief={chief}
                renderProps={renderProps}
              />
            ))
          )}
        </div>
      ) : null}

      {icBusLinks.length > 0 ? <OrgChartIcBusesRegistrar links={icBusLinks} /> : null}

      {useExportConnectors ? null : <OrgChartConnectorOverlay zoom={zoom} />}
    </div>
  )
}
