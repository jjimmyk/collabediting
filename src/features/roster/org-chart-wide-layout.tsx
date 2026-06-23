import { useLayoutEffect } from 'react'
import { cn } from '@/lib/utils'
import { OrgChartConnectorOverlay } from '@/features/roster/org-chart-connector-overlay'
import {
  OrgChartConnectorProvider,
  useOrgChartConnectors,
} from '@/features/roster/org-chart-connector-context'
import {
  ORG_CHART_IC_CONNECTOR_ID,
  ORG_CHART_COMMAND_STAFF_HEADER_ID,
  orgChartPositionConnectorId,
} from '@/features/roster/org-chart-node-id'
import {
  ORG_CHART_POSITION_CARD_MAX_WIDTH,
  ORG_CHART_SUBORDINATE_ROW_GAP,
  ORG_CHART_WIDE_GROUPS_ROW_MARGIN_TOP,
  ORG_CHART_WIDE_SUB_HIERARCHY_MARGIN_TOP,
  orgChartSectionColumnClassName,
} from '@/features/roster/org-chart-layout-tokens'
import { OrgChartSubHierarchyColumn } from '@/features/roster/org-chart-spine-layout'
import {
  CommandStaffHeaderCard,
  OrgChartWideSpineTree,
} from '@/features/roster/org-chart-wide-spine-tree'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import {
  filterVisibleOrgChartChildren,
  orgChartNodeKey,
  positionBranchIsVisible,
  positionNodeIsVisible,
} from '@/features/roster/org-chart-visibility'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'

function OrgChartIcBusRegistrar({
  commanderId,
  headerIds,
}: {
  commanderId: string
  headerIds: string[]
}) {
  const { registerIcBus } = useOrgChartConnectors()

  useLayoutEffect(() => {
    registerIcBus(headerIds.length > 0 ? { commanderId, headerIds } : null)
    return () => registerIcBus(null)
  }, [commanderId, headerIds.join('\0'), registerIcBus])

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

  const icBusHeaderIds = [
    ...sectionChiefs.map(({ chief }) => orgChartPositionConnectorId(chief.position)),
    ...(showCommandStaff ? [ORG_CHART_COMMAND_STAFF_HEADER_ID] : []),
  ]

  const commandStaffNodes = visibleCommandStaff
    .map((position) =>
      orgChartLayout.commandStaffBranch.children.find(
        (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
          child.kind === 'position' && child.position === position
      )
    )
    .filter((node): node is Extract<OrgChartNode, { kind: 'position' }> => node !== undefined)

  return (
    <OrgChartConnectorProvider>
      <OrgChartWideLayoutBody
        icVisible={icVisible}
        orgChartLayout={orgChartLayout}
        renderProps={renderProps}
        visibleRootChildren={visibleRootChildren}
        sectionChiefs={sectionChiefs}
        showCommandStaff={showCommandStaff}
        commandStaffNodes={commandStaffNodes}
        icBusHeaderIds={icBusHeaderIds}
        zoom={zoom}
      />
    </OrgChartConnectorProvider>
  )
}

function OrgChartWideLayoutBody({
  icVisible,
  orgChartLayout,
  renderProps,
  visibleRootChildren,
  sectionChiefs,
  showCommandStaff,
  commandStaffNodes,
  icBusHeaderIds,
  zoom,
}: {
  icVisible: boolean
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartWideRenderProps
  visibleRootChildren: OrgChartNode[]
  sectionChiefs: {
    branch: Extract<OrgChartNode, { kind: 'group' }>
    chief: Extract<OrgChartNode, { kind: 'position' }>
  }[]
  showCommandStaff: boolean
  commandStaffNodes: Extract<OrgChartNode, { kind: 'position' }>[]
  icBusHeaderIds: string[]
  zoom: number
}) {
  const { chartRef } = useOrgChartConnectors()

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
          {visibleRootChildren.length > 0 ? (
            <div
              className={cn(
                'mt-4 flex w-full flex-col items-center',
                ORG_CHART_SUBORDINATE_ROW_GAP
              )}
            >
              {visibleRootChildren.map((child, index) => (
                <div key={orgChartNodeKey(child, index)} className="w-full max-w-full">
                  {renderProps.renderLeafNode(child, { suppressChildren: false })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {(sectionChiefs.length > 0 || showCommandStaff) && (
        <>
          <div
            className={cn(
              'flex w-full items-end justify-center gap-10',
              icVisible ? ORG_CHART_WIDE_GROUPS_ROW_MARGIN_TOP : 'mt-4'
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
            {showCommandStaff ? (
              <div className="flex flex-1 flex-col items-center min-w-[14rem]">
                <CommandStaffHeaderCard />
              </div>
            ) : null}
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
            {showCommandStaff ? (
              <div className="min-w-[14rem]">
                <OrgChartSubHierarchyColumn headerId={ORG_CHART_COMMAND_STAFF_HEADER_ID}>
                  <OrgChartWideSpineTree
                    parentId={ORG_CHART_COMMAND_STAFF_HEADER_ID}
                    nodes={commandStaffNodes}
                    parentColor="neutral"
                    renderProps={renderProps}
                  />
                </OrgChartSubHierarchyColumn>
              </div>
            ) : null}
          </div>
        </>
      )}

      {icVisible && icBusHeaderIds.length > 0 ? (
        <OrgChartIcBusRegistrar
          commanderId={ORG_CHART_IC_CONNECTOR_ID}
          headerIds={icBusHeaderIds}
        />
      ) : null}
    </div>
  )
}
