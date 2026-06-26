import { Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { formatHaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import { cn } from '@/lib/utils'

const TARGET_TYPE_LABELS: Record<string, string> = {
  position: 'Position',
  member: 'Member',
  single_resource: 'Single resource',
  position_asset: 'Asset',
  org_chart_asset: 'Asset',
  resource_category: 'Resource category',
}

type Ics215HaveRosterRefPickRowProps = {
  option: WorkAssignmentTargetOption
  checked: boolean
  disabled?: boolean
  linkedToThisCell?: boolean
  linkedElsewhere?: Ics215HaveLinkLocation
  onToggle: () => void
  onUnlinkFromElsewhere?: () => void
}

export function Ics215HaveRosterRefPickRow({
  option,
  checked,
  disabled = false,
  linkedToThisCell = false,
  linkedElsewhere,
  onToggle,
  onUnlinkFromElsewhere,
}: Ics215HaveRosterRefPickRowProps) {
  const blockedByOtherCell = Boolean(linkedElsewhere) && !linkedToThisCell
  const typeLabel = TARGET_TYPE_LABELS[option.targetType] ?? option.targetType

  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2',
        checked && 'border-primary/40 bg-primary/5',
        blockedByOtherCell && 'opacity-80',
        disabled && !blockedByOtherCell && 'opacity-70'
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={checked}
          disabled={disabled || blockedByOtherCell}
          onCheckedChange={onToggle}
          className="mt-0.5"
          aria-label={`Select ${option.label}`}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{option.label}</span>
            <Badge variant="outline" className="text-[10px]">
              {typeLabel}
            </Badge>
            {linkedToThisCell ? (
              <Badge variant="secondary" className="text-[10px]">
                Linked here
              </Badge>
            ) : null}
          </div>
          {linkedElsewhere ? (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Assigned to {formatHaveLinkLocation(linkedElsewhere)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {linkedToThisCell && checked ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={onToggle}
            >
              <Unlink className="h-3 w-3" />
              Unlink
            </Button>
          ) : null}
          {blockedByOtherCell && onUnlinkFromElsewhere ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={onUnlinkFromElsewhere}
            >
              <Unlink className="h-3 w-3" />
              Unlink there
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function groupHaveLinkTargetOptions(
  options: WorkAssignmentTargetOption[]
): Array<{ group: string; options: WorkAssignmentTargetOption[] }> {
  const groups = new Map<string, WorkAssignmentTargetOption[]>()
  for (const option of options) {
    const existing = groups.get(option.group) ?? []
    existing.push(option)
    groups.set(option.group, existing)
  }
  return [...groups.entries()].map(([group, groupOptions]) => ({ group, options: groupOptions }))
}

export function filterHaveLinkTargetOptions(
  options: WorkAssignmentTargetOption[],
  query: string
): WorkAssignmentTargetOption[] {
  const filterText = query.trim().toLowerCase()
  if (!filterText) return options
  return options.filter((option) => {
    const haystack = [option.label, option.group, option.targetType].join(' ').toLowerCase()
    return haystack.includes(filterText)
  })
}

export function isAssetHaveLinkOption(option: WorkAssignmentTargetOption): boolean {
  return option.targetType === 'position_asset' || option.targetType === 'org_chart_asset'
}

export function isRosterHaveLinkOption(option: WorkAssignmentTargetOption): boolean {
  return !isAssetHaveLinkOption(option)
}
