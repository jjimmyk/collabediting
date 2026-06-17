import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CHECK_IN_STATUS_OPTIONS,
  formatCheckInStatusLabel,
} from '@/lib/roster-check-in-status'
import type { WorkspaceMemberCheckInStatus } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type RosterMemberCheckInStatusSelectProps = {
  memberId: string
  value: WorkspaceMemberCheckInStatus
  canEdit: boolean
  isUpdating?: boolean
  compact?: boolean
  className?: string
  onChange: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
}

export function RosterMemberCheckInStatusSelect({
  memberId,
  value,
  canEdit,
  isUpdating = false,
  compact = false,
  className,
  onChange,
}: RosterMemberCheckInStatusSelectProps) {
  if (!canEdit) {
    return (
      <Badge variant="outline" className={cn('h-5 shrink-0 px-1.5 text-[9px]', className)}>
        {formatCheckInStatusLabel(value)}
      </Badge>
    )
  }

  return (
    <div className={cn('min-w-0 shrink-0', compact ? 'w-[8.5rem]' : 'w-full', className)}>
      <Label htmlFor={`check-in-status-${memberId}`} className="sr-only">
        Check-In Status
      </Label>
      <Select
        value={value}
        disabled={isUpdating}
        onValueChange={(next) => onChange(memberId, next as WorkspaceMemberCheckInStatus)}
      >
        <SelectTrigger
          id={`check-in-status-${memberId}`}
          className={cn('h-7 text-[11px]', compact ? 'w-[8.5rem]' : 'w-full')}
        >
          <SelectValue placeholder="Check-In Status" />
        </SelectTrigger>
        <SelectContent>
          {CHECK_IN_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
