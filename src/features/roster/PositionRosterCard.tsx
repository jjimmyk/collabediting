import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
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
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: PositionRosterCardProps) {
  const leaderEmail = entry.members[0]?.email ?? null
  const isOrg = variant === 'org'

  const cardBody = (
    <div className={cn('space-y-3', isOrg ? 'px-2.5 py-2.5' : 'px-3 py-3')}>
      <div className="space-y-1">
        <ItemTitle className={cn('leading-snug', isOrg ? 'text-xs' : 'text-sm')}>
          {entry.position}
        </ItemTitle>
        <ItemDescription className={isOrg ? 'text-[10px]' : undefined}>
          {entry.members.length === 0
            ? '0 assigned'
            : `${entry.members.length} assigned`}
        </ItemDescription>
        {isOrg && leaderEmail && (
          <p className="truncate text-[10px] text-muted-foreground">Leader: {leaderEmail}</p>
        )}
      </div>

      {!isOrg && (
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
      )}

      {!isOrg && (
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
      )}

      {canManageRoster && (
        <div className="space-y-1.5">
          <Button
            type="button"
            size="sm"
            variant="default"
            className={cn('w-full gap-1 text-xs', isOrg ? 'h-6' : 'h-7')}
            disabled={isAssignBusy}
            onClick={() => onInviteToPosition(entry.position)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add new user
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn('gap-1 text-xs', isOrg ? 'h-6 w-full' : 'h-7 w-full')}
                disabled={isAssignBusy || assignable.length === 0}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {isOrg ? 'Assign existing' : 'Assign existing user'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              collisionPadding={12}
              className="w-72 max-w-[calc(100vw-2rem)] p-3"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{entry.position}</p>
                  <p className="text-xs text-muted-foreground">
                    Assign an existing roster member to this position.
                  </p>
                </div>

                {(isOrg || variant === 'grid') && (
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-2">
                    <Label htmlFor={`edit-ics201-popover-${entry.position}`} className="text-xs">
                      Edit ICS-201
                    </Label>
                    <Switch
                      id={`edit-ics201-popover-${entry.position}`}
                      size="sm"
                      checked={entry.editIcs201}
                      disabled={!canManageRoster || isPermissionBusy}
                      onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
                    />
                  </div>
                )}

                {isOrg && (
                  <div className="space-y-1.5">
                    {entry.members.length === 0 ? (
                      <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
                        No members assigned yet.
                      </p>
                    ) : (
                      entry.members.map((member) => (
                        <div
                          key={`popover-org-${entry.position}-${member.id}`}
                          className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{member.email}</p>
                            <Badge
                              variant={member.status === 'active' ? 'default' : 'outline'}
                              className="mt-0.5 h-4 px-1.5 text-[9px]"
                            >
                              {member.status === 'active' ? 'Active' : 'Invited'}
                            </Badge>
                          </div>
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
                        </div>
                      ))
                    )}
                  </div>
                )}

                {!isOrg && (
                  <div className="space-y-1.5">
                    {entry.members.length === 0 ? (
                      <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
                        No members assigned yet.
                      </p>
                    ) : (
                      entry.members.map((member) => (
                        <div
                          key={`popover-${entry.position}-${member.id}`}
                          className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{member.email}</p>
                            <Badge
                              variant={member.status === 'active' ? 'default' : 'outline'}
                              className="mt-0.5 h-4 px-1.5 text-[9px]"
                            >
                              {member.status === 'active' ? 'Active' : 'Invited'}
                            </Badge>
                          </div>
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
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="space-y-1 border-t pt-2">
                  {assignable.length === 0 ? (
                    <p className="px-2 py-1 text-[11px] text-muted-foreground">
                      All roster members are already assigned here.
                    </p>
                  ) : (
                    assignable.map((member) => (
                      <Button
                        key={member.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-start truncate text-xs"
                        onClick={() => onAssignExistingMember(member.id, entry.position)}
                      >
                        {member.email}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )

  return (
    <Item
      variant="outline"
      className={cn(
        'flex min-w-0 flex-col items-stretch p-0',
        isOrg
          ? cn(
              'w-full max-w-full shadow-sm',
              layoutMode === 'wide' ? 'min-w-[9.5rem] max-w-[11rem]' : 'min-w-0',
              orgChartColorClasses(color)
            )
          : glassItemBorderClasses
      )}
    >
      {cardBody}
    </Item>
  )
}
