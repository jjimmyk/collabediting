import { RosterZoomContainer } from '@/features/roster/RosterZoomContainer'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import { WorkspacePositionRosterTable } from '@/features/roster/WorkspacePositionRosterTable'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

export type WorkspaceRosterPanelProps = {
  viewMode: 'table' | 'org-chart'
  onViewModeChange: (mode: 'table' | 'org-chart') => void
  zoom: number
  onZoomChange: (zoom: number) => void
  recenterToken?: number
  wrapOrgChartLiveRoot?: boolean
  className?: string
  zoomContainerClassName?: string
  orgChartProps: ComponentProps<typeof WorkspaceOrgChartRoster>
  tableProps: ComponentProps<typeof WorkspacePositionRosterTable>
}

export function WorkspaceRosterPanel({
  viewMode,
  zoom,
  onZoomChange,
  recenterToken,
  wrapOrgChartLiveRoot = false,
  className,
  zoomContainerClassName,
  orgChartProps,
  tableProps,
}: WorkspaceRosterPanelProps) {
  const orgChart = <WorkspaceOrgChartRoster {...orgChartProps} zoom={zoom} />

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <RosterZoomContainer
        zoom={zoom}
        onZoomChange={onZoomChange}
        centerScroll={viewMode === 'org-chart'}
        recenterToken={recenterToken}
        className={cn('min-h-0 flex-1', zoomContainerClassName)}
      >
        {viewMode === 'org-chart' ? (
          wrapOrgChartLiveRoot ? (
            <div data-roster-org-chart-live-root="" className="inline-block">
              {orgChart}
            </div>
          ) : (
            orgChart
          )
        ) : (
          <WorkspacePositionRosterTable {...tableProps} />
        )}
      </RosterZoomContainer>
    </div>
  )
}

export type HaveLinkRosterPresentation = 'inline' | 'full'

export type HaveLinkRosterPanelRenderer = (context: {
  viewMode: 'table' | 'org-chart'
  onViewModeChange: (mode: 'table' | 'org-chart') => void
  zoom: number
  onZoomChange: (zoom: number) => void
  recenterToken?: number
  activeHaveCell: { rowId: number; columnId: string } | null
  highlightedHaveRef: string | null
  presentation: HaveLinkRosterPresentation
  haveLinkPickMode?: import('@/features/ics215/have-link-pick-mode').HaveLinkPickMode
}) => React.ReactNode
