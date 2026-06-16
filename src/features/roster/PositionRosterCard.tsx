import { useState } from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import { PositionLifecycleBadges } from '@/features/roster/PositionLifecycleBadges'
import { PositionRosterDetailPanel } from '@/features/roster/PositionRosterDetailPanel'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'
import {
  orgChartColorClasses,
  type OrgChartColor,
} from '@/features/roster/ics-org-chart-structure'
import type { RosterPanelLayoutMode } from '@/features/roster/roster-layout'

type PositionRosterCardProps = {
  entry: PositionRosterEntry
  assignable: WorkspaceRosterMember[]
  canManageRoster: boolean
  glassItemBorderClasses: string
  isPermissionBusy: boolean
  isAssignBusy: boolean
  variant?: 'grid' | 'org'
  color?: OrgChartColor
  layoutMode?: RosterPanelLayoutMode
  showOpAdvanceLabels?: boolean
  positionMeta?: WorkspacePositionMeta
  isUpdatingOpAdvanceLabel?: boolean
  onOpAdvanceLabelChange?: (label: PositionOpAdvanceLabel) => void
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

export function PositionRosterCard({
  entry,
  assignable,
  canManageRoster,
  glassItemBorderClasses,
  isPermissionBusy,
  isAssignBusy,
  variant = 'grid',
  color,
  layoutMode = 'wide',
  showOpAdvanceLabels = false,
  positionMeta,
  isUpdatingOpAdvanceLabel = false,
  onOpAdvanceLabelChange,
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: PositionRosterCardProps) {
  const [orgModalOpen, setOrgModalOpen] = useState(false)
  const leaderEmail = entry.members[0]?.email ?? null
  const isOrg = variant === 'org'

  const panelProps = {
    entry,
    assignable,
    canManageRoster,
    isPermissionBusy,
    isAssignBusy,
    onToggleEditIcs201,
    onAssignExistingMember,
    onInviteToPosition,
    onUnassignMember,
  }

  if (isOrg) {
    return (
      <>
        <button
          type="button"
          aria-label={`Manage ${entry.position}`}
          aria-haspopup="dialog"
          aria-expanded={orgModalOpen}
          onClick={() => setOrgModalOpen(true)}
          className={cn(
            'flex min-w-0 flex-col items-stretch rounded-lg border p-0 text-left shadow-sm outline-none transition',
            'hover:ring-2 hover:ring-ring/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'w-full max-w-full min-w-0 overflow-hidden',
            layoutMode === 'wide' ? 'min-w-[10rem] max-w-[12rem]' : 'min-w-0',
            orgChartColorClasses(color)
          )}
        >
          <div className="space-y-2 overflow-hidden px-2 py-2">
            <div className="space-y-1">
              <ItemTitle className="text-xs leading-snug">{entry.position}</ItemTitle>
              <PositionLifecycleBadges entry={entry} size="org" />
              <ItemDescription className="text-[10px]">
                {entry.members.length === 0
                  ? '0 assigned'
                  : `${entry.members.length} assigned`}
              </ItemDescription>
              {leaderEmail ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  Leader: {leaderEmail}
                </p>
              ) : null}
            </div>
          </div>
        </button>
        <Dialog open={orgModalOpen} onOpenChange={setOrgModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle className="sr-only">{entry.position}</DialogTitle>
            <PositionRosterDetailPanel
              {...panelProps}
              showOpAdvanceLabels={showOpAdvanceLabels}
              positionMeta={positionMeta}
              isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel}
              onOpAdvanceLabelChange={onOpAdvanceLabelChange}
              onInviteToPosition={(position) => {
                setOrgModalOpen(false)
                onInviteToPosition(position)
              }}
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const cardBody = (
    <div className="space-y-3 px-3 py-3">
      <div className="space-y-1">
        <ItemTitle className="text-sm leading-snug">{entry.position}</ItemTitle>
        <ItemDescription>
          {entry.members.length === 0
            ? '0 assigned'
            : `${entry.members.length} assigned`}
        </ItemDescription>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
        <Label htmlFor={`edit-ics201-${entry.position}`} className="text-xs font-medium">
          Edit ICS-201
        </Label>
        <Switch
          id={`edit-ics201-${entry.position}`}
          size="sm"
          checked={entry.editIcs201}
          disabled={!canManageRoster || isPermissionBusy}
          onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
        />
      </div>

      <div className="space-y-1.5">
        {entry.members.length === 0 ? (
          <p className="rounded-md border border-dashed px-2 py-3 text-center text-[11px] text-muted-foreground">
            Assign a roster member to this position.
          </p>
        ) : (
          entry.members.map((member) => (
            <div
              key={`${entry.position}-${member.id}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-background/70 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{member.email}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'outline'}
                    className="h-4 px-1.5 text-[9px]"
                  >
                    {member.status === 'active' ? 'Active' : 'Invited'}
                  </Badge>
                </div>
              </div>
              {canManageRoster && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${member.email} from ${entry.position}`}
                  disabled={isAssignBusy}
                  onClick={() => onUnassignMember(member.id, entry.position)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {canManageRoster && (
        <div className="space-y-1">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-7 w-full min-w-0 gap-1 px-1.5 text-xs leading-tight"
            disabled={isAssignBusy}
            onClick={() => onInviteToPosition(entry.position)}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Add new user</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 w-full min-w-0 gap-1 px-1.5 text-xs leading-tight"
                disabled={isAssignBusy || assignable.length === 0}
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Assign existing user</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              collisionPadding={12}
              className="w-72 max-w-[calc(100vw-2rem)] p-3"
            >
              <PositionRosterDetailPanel {...panelProps} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}>
      {cardBody}
    </Item>
  )
}
