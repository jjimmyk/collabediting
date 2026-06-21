import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { PositionTypeField } from '@/features/roster/PositionTypeField'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'

type PositionPermissionsSectionProps = {
  entry: PositionRosterEntry
  canManageRoster: boolean
  isBusy: boolean
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  variant?: 'panel' | 'table'
}

export function PositionPermissionsSection({
  entry,
  canManageRoster,
  isBusy,
  onToggleEditIcs201,
  variant = 'panel',
}: PositionPermissionsSectionProps) {
  const switchId = `edit-ics201-${variant}-${entry.position}`

  if (variant === 'table') {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Permissions
        </p>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={switchId} className="text-xs">
            Edit ICS-201
          </Label>
          <Switch
            id={switchId}
            size="sm"
            checked={entry.editIcs201}
            disabled={!canManageRoster || isBusy}
            onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/20 px-2.5 py-2">
      <p className="text-xs font-medium text-muted-foreground">Permissions</p>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={switchId} className="text-xs">
          Edit ICS-201
        </Label>
        <Switch
          id={switchId}
          size="sm"
          checked={entry.editIcs201}
          disabled={!canManageRoster || isBusy}
          onCheckedChange={(checked) => onToggleEditIcs201(entry.position, checked)}
        />
      </div>
    </div>
  )
}

type PositionPropertiesSectionProps = {
  entry: PositionRosterEntry
  canManageRoster: boolean
  isBusy: boolean
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
  variant?: 'panel' | 'table'
}

export function PositionPropertiesSection({
  entry,
  canManageRoster,
  isBusy,
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
  onPositionTypeChange,
  variant = 'panel',
}: PositionPropertiesSectionProps) {
  const switchId = `allow-work-assignment-${variant}-${entry.position}`
  const showWorkAssignment = showAllowWorkAssignment && onToggleAllowWorkAssignment

  if (variant === 'table') {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Position Properties
        </p>
        <PositionTypeField
          entry={entry}
          canManageRoster={canManageRoster}
          isBusy={isBusy}
          variant={variant}
          onPositionTypeChange={onPositionTypeChange}
        />
        {showWorkAssignment ? (
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={switchId} className="text-xs">
              Allow Work Assignment
            </Label>
            <Switch
              id={switchId}
              size="sm"
              checked={entry.allowWorkAssignment}
              disabled={!canManageRoster || isBusy}
              onCheckedChange={(checked) => onToggleAllowWorkAssignment(entry.position, checked)}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2">
      <p className="text-xs font-medium text-muted-foreground">Position Properties</p>
      <PositionTypeField
        entry={entry}
        canManageRoster={canManageRoster}
        isBusy={isBusy}
        variant={variant}
        onPositionTypeChange={onPositionTypeChange}
      />
      {showWorkAssignment ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={switchId} className="text-xs">
            Allow Work Assignment
          </Label>
          <Switch
            id={switchId}
            size="sm"
            checked={entry.allowWorkAssignment}
            disabled={!canManageRoster || isBusy}
            onCheckedChange={(checked) => onToggleAllowWorkAssignment(entry.position, checked)}
          />
        </div>
      ) : null}
    </div>
  )
}
