import type { ComponentProps } from 'react'
import {
  WorkspaceRosterPanel,
  type HaveLinkRosterPanelRenderer,
} from '@/features/roster/WorkspaceRosterPanel'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import { WorkspacePositionRosterTable } from '@/features/roster/WorkspacePositionRosterTable'

export function createHaveLinkRosterPanelRenderer(
  orgChartProps: ComponentProps<typeof WorkspaceOrgChartRoster>,
  tableProps: ComponentProps<typeof WorkspacePositionRosterTable>
): HaveLinkRosterPanelRenderer {
  return (ctx) => (
    <WorkspaceRosterPanel
      viewMode={ctx.viewMode}
      onViewModeChange={ctx.onViewModeChange}
      zoom={ctx.zoom}
      onZoomChange={ctx.onZoomChange}
      zoomContainerClassName="max-h-[26rem] min-h-0"
      orgChartProps={{
        ...orgChartProps,
        zoom: ctx.zoom,
        layoutMode: 'compact',
        haveLinkIndexByRef: orgChartProps.haveLinkIndexByRef,
        activeHaveCell: ctx.activeHaveCell,
        highlightedHaveRef: ctx.highlightedHaveRef,
        assignmentSectionsLayout: 'timeline',
      }}
      tableProps={{
        ...tableProps,
        haveLinkIndexByRef: tableProps.haveLinkIndexByRef,
        activeHaveCell: ctx.activeHaveCell,
        highlightedHaveRef: ctx.highlightedHaveRef,
        assignmentSectionsLayout: 'timeline',
      }}
    />
  )
}
