import { Network, Table2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RosterZoomControls } from '@/features/roster/RosterZoomControls'
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
  showViewToggle?: boolean
  showZoomControls?: boolean
  wrapOrgChartLiveRoot?: boolean
  className?: string
  zoomContainerClassName?: string
  orgChartProps: ComponentProps<typeof WorkspaceOrgChartRoster>
  tableProps: ComponentProps<typeof WorkspacePositionRosterTable>
}

export function WorkspaceRosterPanel({
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  recenterToken,
  showViewToggle = true,
  showZoomControls = false,
  wrapOrgChartLiveRoot = false,
  className,
  zoomContainerClassName,
  orgChartProps,
  tableProps,
}: WorkspaceRosterPanelProps) {
  const orgChart = <WorkspaceOrgChartRoster {...orgChartProps} zoom={zoom} />

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2', className)}>
      {showViewToggle || showZoomControls ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {showZoomControls ? (
            <RosterZoomControls zoom={zoom} onZoomChange={onZoomChange} />
          ) : null}
          {showViewToggle ? (
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'table' || value === 'org-chart') {
                onViewModeChange(value)
              }
            }}
            variant="outline"
            size="sm"
            aria-label="Roster view"
          >
            <ToggleGroupItem value="table" className="gap-1.5 px-2.5 text-xs">
              <Table2 className="h-3.5 w-3.5" />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="org-chart" className="gap-1.5 px-2.5 text-xs">
              <Network className="h-3.5 w-3.5" />
              Org Chart
            </ToggleGroupItem>
          </ToggleGroup>
          ) : null}
        </div>
      ) : null}
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
  activeHaveCell: { rowId: number; columnId: string } | null
  highlightedHaveRef: string | null
  presentation: HaveLinkRosterPresentation
}) => React.ReactNode
