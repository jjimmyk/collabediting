import { useLayoutEffect, useRef } from 'react'
import { buildOrgChartLayoutForExport } from '@/features/roster/build-org-chart-for-export'
import {
  ORG_CHART_EXPORT_DISPLAY_FILTERS,
  type OrgChartExportScope,
} from '@/features/roster/org-chart-export-scope'
import { resolveVisibleRosterPositions } from '@/features/roster/roster-display-filters'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceOrgChartLayout, WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

const noop = () => undefined
const noopAsync = async () => [] as never[]

export type OrgChartExportCaptureTreeProps = {
  scope: OrgChartExportScope
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  orgChartLayout: WorkspaceOrgChartLayout
  workspaceLabel: string
  layoutMode: RosterPanelLayoutMode
  onReady: (element: HTMLElement) => void
}

export function OrgChartExportCaptureTree({
  scope,
  catalog,
  entries,
  entriesByPosition,
  assetsByKey,
  rosterById,
  orgChartLayout,
  workspaceLabel,
  layoutMode,
  onReady,
}: OrgChartExportCaptureTreeProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const visiblePositions = resolveVisibleRosterPositions(
    entries,
    ORG_CHART_EXPORT_DISPLAY_FILTERS,
    catalog
  )

  useLayoutEffect(() => {
    if (rootRef.current) {
      onReady(rootRef.current)
    }
  }, [onReady, orgChartLayout, entries, scope])

  return (
    <div
      ref={rootRef}
      data-org-chart-export-root=""
      className="bg-white text-foreground"
      style={{ width: 'max-content' }}
    >
      <WorkspaceOrgChartRoster
        exportMode
        orgChartLayout={orgChartLayout}
        entriesByPosition={entriesByPosition}
        assetsByKey={assetsByKey}
        rosterById={rosterById}
        visiblePositions={visiblePositions}
        displayFilters={ORG_CHART_EXPORT_DISPLAY_FILTERS}
        assignableByPosition={{}}
        scheduleAssignableByPosition={{}}
        scheduleUnassignableByPosition={{}}
        canManageRoster={false}
        glassItemBorderClasses="border border-neutral-300 bg-white"
        isUpdatingPermission={null}
        isAssigningPosition={null}
        workspaceLabel={workspaceLabel}
        layoutMode={layoutMode}
        zoom={1}
        showOpAdvanceLabels={false}
        positionMetaByName={catalog.positionMetaByName}
        onToggleEditIcs201={noop}
        onAssignExistingMember={noop}
        onSearchOrgMembers={noopAsync}
        onScheduleAssignMember={noop}
        onScheduleUnassignMember={noop}
        onRemoveScheduledAssign={noop}
        onRemoveScheduledUnassign={noop}
        onInviteToPosition={noop}
        onUnassignMember={noop}
      />
    </div>
  )
}

export function buildExportOrgChartLayout(
  catalog: WorkspacePositionCatalog,
  assets: ResourceListItemData[],
  roster: WorkspaceRosterMember[],
  scope: OrgChartExportScope
) {
  return buildOrgChartLayoutForExport(catalog, assets, roster, scope)
}
