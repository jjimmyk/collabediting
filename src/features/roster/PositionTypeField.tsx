import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import {
  WORKSPACE_POSITION_TYPE_LABELS,
  WORKSPACE_POSITION_TYPES,
  type WorkspacePositionType,
} from '@/features/roster/workspace-position-type'

type PositionTypeFieldProps = {
  entry: PositionRosterEntry
  canManageRoster: boolean
  isBusy: boolean
  variant?: 'panel' | 'table'
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
}

export function PositionTypeField({
  entry,
  canManageRoster,
  isBusy,
  variant = 'panel',
  onPositionTypeChange,
}: PositionTypeFieldProps) {
  const selectId = `position-type-${variant}-${entry.position}`
  const customLabelId = `position-custom-type-${variant}-${entry.position}`
  const currentType = entry.positionType ?? undefined

  if (!onPositionTypeChange) {
    if (!entry.positionTypeLabel) return null
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Type</p>
        <Badge variant="outline" className="text-[10px] font-normal">
          {entry.positionTypeLabel}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={selectId} className="text-xs">
          Type
        </Label>
        <Select
          value={currentType ?? 'unset'}
          disabled={!canManageRoster || isBusy}
          onValueChange={(value) => {
            if (value === 'unset') {
              onPositionTypeChange(entry.position, null, null)
              return
            }
            const nextType = value as WorkspacePositionType
            onPositionTypeChange(
              entry.position,
              nextType,
              nextType === 'custom_type' ? entry.customTypeLabel : null
            )
          }}
        >
          <SelectTrigger id={selectId} className="h-8 text-xs">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Not set</SelectItem>
            {WORKSPACE_POSITION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {WORKSPACE_POSITION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {currentType === 'custom_type' ? (
        <div className="space-y-1">
          <Label htmlFor={customLabelId} className="text-xs">
            Custom type label
          </Label>
          <Input
            id={customLabelId}
            defaultValue={entry.customTypeLabel ?? ''}
            disabled={!canManageRoster || isBusy}
            className="h-8 text-xs"
            placeholder="Enter custom type"
            onBlur={(event) =>
              onPositionTypeChange(entry.position, 'custom_type', event.target.value.trim())
            }
          />
        </div>
      ) : null}
    </div>
  )
}
