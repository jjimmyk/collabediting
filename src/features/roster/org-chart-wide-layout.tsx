import { useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'
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
  ORG_CHART_WIDE_SUB_HIERARCHY_MARGIN_TOP,
  orgChartSectionColumnClassName,
} from '@/features/roster/org-chart-layout-tokens'
import { OrgChartSubHierarchyColumn } from '@/features/roster/org-chart-spine-layout'
import { OrgChartWideSpineTree } from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import {
  buildIcDirectReportNodes,
  filterVisibleOrgChartChildren,
  positionBranchIsVisible,
  positionNodeIsVisible,
  resolveOrgChartNodeConnectorId,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

function OrgChartIcBusesRegistrar({ links }: { links: OrgChartIcBusLink[] }) {
  const { setIcBusLinks } = useOrgChartConnectors()
  const linksKey = links
    .map((link) => `${link.commanderId}:${link.headerIds.join('\0')}`)
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

type OrgChartWideLayoutProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartWideRenderProps
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  showCommandStaff: boolean
  visibleCommandStaff: string[]
  zoom?: number
}

export function OrgChartWideLayout({
  orgChartLayout,
  renderProps,
  visibleSectionBranches,
  showCommandStaff,
  visibleCommandStaff,
  zoom = 1,
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
  const icDirectReportConnectorIds = icDirectReportNodes
    .map((node) => resolveOrgChartNodeConnectorId(node, renderProps))
    .filter((id): id is string => id !== null)

  const sectionChiefConnectorIds = sectionChiefs.map(({ chief }) =>
    orgChartPositionConnectorId(chief.position)
  )

  const icBusLinks: OrgChartIcBusLink[] = []
  if (icVisible) {
    if (icDirectReportConnectorIds.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: icDirectReportConnectorIds,
      })
    }
    if (sectionChiefConnectorIds.length > 0) {
      icBusLinks.push({
        commanderId: ORG_CHART_IC_CONNECTOR_ID,
        headerIds: sectionChiefConnectorIds,
      })
    }
  }

  return (
    <OrgChartConnectorProvider>
      <OrgChartWideLayoutBody
        icVisible={icVisible}
        orgChartLayout={orgChartLayout}
        renderProps={renderProps}
        icDirectReportNodes={icDirectReportNodes}
        sectionChiefs={sectionChiefs}
        icBusLinks={icBusLinks}
        zoom={zoom}
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
  zoom,
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
  zoom: number
}) {
  const { chartRef } = useOrgChartConnectors()

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
      <OrgChartConnectorOverlay zoom={zoom} />

      {icVisible ? (
        <div className="flex w-full flex-col items-center">
          {renderProps.renderLeafNode(
            {
              kind: 'position',
              position: orgChartLayout.rootPosition,
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
        <>
          <div
            className={cn(
              'flex w-full items-end justify-center gap-10',
              sectionChiefsMarginClass
            )}
          >
            {sectionChiefs.map(({ branch, chief }) => (
              <div
                key={branch.label}
                className={cn(
                  'flex flex-1 flex-col items-center',
                  orgChartSectionColumnClassName(branch.label)
                )}
              >
                {renderProps.renderLeafNode(chief, {
                  parentColor: chief.color ?? branch.color,
                  suppressChildren: true,
                  connectorAnchorId: orgChartPositionConnectorId(chief.position),
                })}
              </div>
            ))}
          </div>

          <div
            className={cn(
              'flex w-full items-start justify-center gap-12',
              ORG_CHART_WIDE_SUB_HIERARCHY_MARGIN_TOP
            )}
          >
            {sectionChiefs.map(({ branch, chief }) => {
              const chiefId = orgChartPositionConnectorId(chief.position)
              return (
                <div
                  key={`${branch.label}-sub`}
                  className={orgChartSectionColumnClassName(branch.label)}
                >
                  <OrgChartSubHierarchyColumn headerId={chiefId}>
                    <OrgChartWideSpineTree
                      parentId={chiefId}
                      nodes={chief.children ?? []}
                      parentColor={chief.color ?? branch.color}
                      renderProps={renderProps}
                    />
                  </OrgChartSubHierarchyColumn>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {icBusLinks.length > 0 ? <OrgChartIcBusesRegistrar links={icBusLinks} /> : null}
    </div>
  )
}
