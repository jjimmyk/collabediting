import { buildOrgChartLayoutForExport } from '@/features/roster/build-org-chart-for-export'
import {
  ICS207_EXPORT_ZOOM,
  ORG_CHART_EXPORT_DISPLAY_FILTERS,
  type OrgChartExportScope,
} from '@/features/roster/org-chart-export-scope'
import { RosterZoomContainer } from '@/features/roster/RosterZoomContainer'
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
  catalog: WorkspacePositionCatalog
  entries: PositionRosterEntry[]
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  orgChartLayout: WorkspaceOrgChartLayout
  workspaceLabel: string
  layoutMode: RosterPanelLayoutMode
  glassItemBorderClasses: string
}

export function OrgChartExportCaptureTree({
  catalog,
  entries,
  entriesByPosition,
  assetsByKey,
  rosterById,
  orgChartLayout,
  workspaceLabel,
  layoutMode,
  glassItemBorderClasses,
}: OrgChartExportCaptureTreeProps) {
  const visiblePositions = resolveVisibleRosterPositions(
    entries,
    ORG_CHART_EXPORT_DISPLAY_FILTERS,
    catalog
  )

  return (
    <div
      data-org-chart-export-root=""
      className="inline-block bg-white text-foreground"
    >
      <RosterZoomContainer zoom={ICS207_EXPORT_ZOOM} centerScroll>
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
          glassItemBorderClasses={glassItemBorderClasses}
          isUpdatingPermission={null}
          isAssigningPosition={null}
          workspaceLabel={workspaceLabel}
          layoutMode={layoutMode}
          zoom={ICS207_EXPORT_ZOOM}
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
      </RosterZoomContainer>
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
