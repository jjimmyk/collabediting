import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'

type RosterAddMemberToolbarProps = {
  canManageRoster: boolean
  isSupabaseEnabled: boolean
  layoutMode?: RosterPanelLayoutMode
  onAddMember: () => void
}

export function RosterAddMemberToolbar({
  canManageRoster,
  isSupabaseEnabled,
  layoutMode = 'wide',
  onAddMember,
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
          ? 'Add a user by email. Optionally set a password to create their account immediately, or leave it blank to send an invite email.'
          : 'Add a user by email and assign one or more ICS positions.'}
      </p>
      <Button type="button" size="sm" className="shrink-0 gap-1" onClick={onAddMember}>
        <Plus className="h-3.5 w-3.5" />
        Add member
      </Button>
    </div>
  )
}
