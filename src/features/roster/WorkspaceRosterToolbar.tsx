import { DownloadIcon, Network, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RosterAddMemberToolbar } from '@/features/roster/RosterAddMemberToolbar'
import { RosterDisplayFiltersMenu } from '@/features/roster/RosterDisplayFiltersMenu'
import { RosterZoomControls } from '@/features/roster/RosterZoomControls'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'

export type WorkspaceRosterToolbarProps = {
  displayFilters: RosterDisplayFilters
  onDisplayFiltersChange: (filters: RosterDisplayFilters) => void
  operationalPeriodsEnabled?: boolean
  viewMode: 'table' | 'org-chart'
  onViewModeChange: (mode: 'table' | 'org-chart') => void
  zoom: number
  onZoomChange: (zoom: number) => void
  canManageRoster: boolean
  onAddMember: () => void
  onAddPosition?: () => void
  onAddAssetToOrgChart?: () => void
  showWorkingRosterToggle?: boolean
  rosterAlwaysShowWorking?: boolean
  onRosterAlwaysShowWorkingChange?: (value: boolean) => void
  showExportIcs207?: boolean
  exportIcs207Disabled?: boolean
  onExportIcs207?: () => void
  disabled?: boolean
  className?: string
}

export function WorkspaceRosterToolbar({
  displayFilters,
  onDisplayFiltersChange,
  operationalPeriodsEnabled = false,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  canManageRoster,
  onAddMember,
  onAddPosition,
  onAddAssetToOrgChart,
  showWorkingRosterToggle = false,
  rosterAlwaysShowWorking = false,
  onRosterAlwaysShowWorkingChange,
  showExportIcs207 = false,
  exportIcs207Disabled = false,
  onExportIcs207,
  disabled = false,
  className,
}: WorkspaceRosterToolbarProps) {
  return (
    <div className={className ?? 'flex flex-wrap items-center justify-end gap-2'}>
      {showWorkingRosterToggle && onRosterAlwaysShowWorkingChange ? (
        <Button
          type="button"
          size="sm"
          variant={rosterAlwaysShowWorking ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onRosterAlwaysShowWorkingChange(!rosterAlwaysShowWorking)}
        >
          {rosterAlwaysShowWorking ? 'Showing working roster' : 'Show working roster'}
        </Button>
      ) : null}
      <RosterDisplayFiltersMenu
        filters={displayFilters}
        onChange={onDisplayFiltersChange}
        operationalPeriodsEnabled={operationalPeriodsEnabled}
      />
      <RosterZoomControls zoom={zoom} onZoomChange={onZoomChange} />
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
        <ToggleGroupItem
          value="table"
          className="gap-1.5 px-2.5 text-xs"
          disabled={disabled}
        >
          <Table2 className="h-3.5 w-3.5" />
          Table
        </ToggleGroupItem>
        <ToggleGroupItem
          value="org-chart"
          className="gap-1.5 px-2.5 text-xs"
          disabled={disabled}
        >
          <Network className="h-3.5 w-3.5" />
          Org Chart
        </ToggleGroupItem>
      </ToggleGroup>
      {showExportIcs207 && viewMode === 'org-chart' && onExportIcs207 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={exportIcs207Disabled || disabled}
          onClick={onExportIcs207}
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          Export ICS-207
        </Button>
      ) : null}
      <RosterAddMemberToolbar
        canManageRoster={canManageRoster && !disabled}
        onAddMember={onAddMember}
        onAddPosition={onAddPosition}
        onAddAssetToOrgChart={onAddAssetToOrgChart}
      />
    </div>
  )
}

export type HaveLinkRosterWorkspaceControls = Pick<
  WorkspaceRosterToolbarProps,
  | 'displayFilters'
  | 'onDisplayFiltersChange'
  | 'operationalPeriodsEnabled'
  | 'viewMode'
  | 'onViewModeChange'
  | 'zoom'
  | 'onZoomChange'
  | 'canManageRoster'
  | 'onAddMember'
  | 'onAddPosition'
  | 'onAddAssetToOrgChart'
  | 'showWorkingRosterToggle'
  | 'rosterAlwaysShowWorking'
  | 'onRosterAlwaysShowWorkingChange'
  | 'disabled'
> & {
  recenterToken?: number
}
