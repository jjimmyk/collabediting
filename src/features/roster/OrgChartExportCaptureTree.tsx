import { useRef } from 'react'
import { buildOrgChartLayoutForExport } from '@/features/roster/build-org-chart-for-export'
import { resolveVisibleRosterPositions } from '@/features/roster/roster-display-filters'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspaceOrgChartLayout, WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import type { Ics207OrgChartVisualSnapshot } from '@/features/ics207/export-org-chart-ics207'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import { RosterZoomContainer } from '@/features/roster/RosterZoomContainer'
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
  visualSnapshot: Ics207OrgChartVisualSnapshot
  isProjected?: boolean
  rosterTimeHorizon?: OrgChartExportScope
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
  visualSnapshot,
  isProjected = false,
  rosterTimeHorizon = 'current_op',
}: OrgChartExportCaptureTreeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  const visiblePositions = resolveVisibleRosterPositions(
    entries,
    visualSnapshot.displayFilters,
    catalog
  )

  return (
    <div ref={rootRef} data-ics207-capture-root="" className="inline-block bg-white text-foreground">
      <RosterZoomContainer
        zoom={visualSnapshot.zoom}
        centerScroll={false}
        initialScrollLeft={visualSnapshot.scrollLeft}
        initialScrollTop={visualSnapshot.scrollTop}
      >
        <WorkspaceOrgChartRoster
          exportMode
          orgChartLayout={orgChartLayout}
          entriesByPosition={entriesByPosition}
          assetsByKey={assetsByKey}
          rosterById={rosterById}
          visiblePositions={visiblePositions}
          displayFilters={visualSnapshot.displayFilters}
          isProjected={isProjected}
          rosterTimeHorizon={rosterTimeHorizon}
          assignableByPosition={{}}
          scheduleAssignableByPosition={{}}
          scheduleUnassignableByPosition={{}}
          canManageRoster={false}
          glassItemBorderClasses={glassItemBorderClasses}
          isUpdatingPermission={null}
          isAssigningPosition={null}
          workspaceLabel={workspaceLabel}
          layoutMode={layoutMode}
          zoom={visualSnapshot.zoom}
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
