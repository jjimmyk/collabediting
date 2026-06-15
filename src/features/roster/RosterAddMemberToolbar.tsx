import { Map as MapIcon, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'

type RosterAddMemberToolbarProps = {
  canManageRoster: boolean
  isSupabaseEnabled: boolean
  layoutMode?: RosterPanelLayoutMode
  onAddMember: () => void
  onAddPosition?: () => void
  onAddAssetToOrgChart?: () => void
  showAddAssetToOrgChart?: boolean
}

export function RosterAddMemberToolbar({
  canManageRoster,
  isSupabaseEnabled,
  layoutMode = 'wide',
  onAddMember,
  onAddPosition,
  onAddAssetToOrgChart,
  showAddAssetToOrgChart = false,
}: RosterAddMemberToolbarProps) {
  if (!canManageRoster) return null

  return (
    <div
      className={
        layoutMode === 'compact'
          ? 'flex flex-col gap-2 rounded-md border bg-muted/20 px-3 py-2'
          : 'flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2'
      }
    >
      <p className="max-w-prose text-xs text-muted-foreground">
        {isSupabaseEnabled
          ? 'Manage positions, roster members, and assigned assets on the org chart.'
          : 'Add custom positions, roster members, or assigned assets to the org chart.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {showAddAssetToOrgChart && onAddAssetToOrgChart ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1"
            onClick={onAddAssetToOrgChart}
          >
            + Add asset
          </Button>
        ) : null}
        {onAddPosition ? (
          <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1" onClick={onAddPosition}>
            Add position
          </Button>
        ) : null}
        <Button type="button" size="sm" className="shrink-0 gap-1" onClick={onAddMember}>
          <UserPlus className="h-3.5 w-3.5" />
          Add member
        </Button>
      </div>
    </div>
  )
}
