import type { ComponentProps } from 'react'
import { RosterTimeHorizonBanner } from '@/features/roster/RosterTimeHorizonBanner'
import {
  WorkspaceRosterPanel,
  type HaveLinkRosterPanelRenderer,
} from '@/features/roster/WorkspaceRosterPanel'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import { WorkspacePositionRosterTable } from '@/features/roster/WorkspacePositionRosterTable'
import { cn } from '@/lib/utils'

export function createHaveLinkRosterPanelRenderer(
  orgChartProps: ComponentProps<typeof WorkspaceOrgChartRoster>,
  tableProps: ComponentProps<typeof WorkspacePositionRosterTable>
): HaveLinkRosterPanelRenderer {
  return (ctx) => {
    const isFull = ctx.presentation === 'full'

    return (
      <div className={cn('flex min-h-0 flex-col gap-2', isFull && 'min-h-[35vh] flex-1')}>
        {isFull && orgChartProps.isProjected ? <RosterTimeHorizonBanner /> : null}
        <WorkspaceRosterPanel
          viewMode={ctx.viewMode}
          onViewModeChange={ctx.onViewModeChange}
          zoom={ctx.zoom}
          onZoomChange={ctx.onZoomChange}
          recenterToken={ctx.recenterToken}
          wrapOrgChartLiveRoot={isFull}
          className={isFull ? 'min-h-0 flex-1' : undefined}
          zoomContainerClassName={
            isFull ? 'min-h-[32vh] flex-1 rounded-md border' : 'max-h-[26rem] min-h-0'
          }
          orgChartProps={{
            ...orgChartProps,
            zoom: ctx.zoom,
            haveLinkIndexByRef: orgChartProps.haveLinkIndexByRef,
            activeHaveCell: ctx.activeHaveCell,
            highlightedHaveRef: ctx.highlightedHaveRef,
          }}
          tableProps={{
            ...tableProps,
            haveLinkIndexByRef: tableProps.haveLinkIndexByRef,
            activeHaveCell: ctx.activeHaveCell,
            highlightedHaveRef: ctx.highlightedHaveRef,
          }}
        />
      </div>
    )
  }
}
