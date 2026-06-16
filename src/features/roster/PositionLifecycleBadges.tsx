import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

type PositionLifecycleBadgesProps = {
  entry: Pick<PositionRosterEntry, 'isPlanned' | 'opAdvanceLabel'>
  className?: string
  size?: 'org' | 'default'
}

export function PositionLifecycleBadges({
  entry,
  className,
  size = 'default',
}: PositionLifecycleBadgesProps) {
  const isScheduledForNextOp =
    entry.isPlanned === true || entry.opAdvanceLabel === 'create_on_op_advance'
  const isRetiringNextOp = entry.opAdvanceLabel === 'retire_on_op_advance'

  if (!isScheduledForNextOp && !isRetiringNextOp) {
    return null
  }

  const badgeClassName = size === 'org' ? 'h-4 px-1.5 text-[9px]' : 'h-5 px-1.5 text-[10px]'

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {isScheduledForNextOp ? (
        <Badge variant="secondary" className={badgeClassName}>
          Scheduled for next OP
        </Badge>
      ) : null}
      {isRetiringNextOp ? (
        <Badge variant="destructive" className={badgeClassName}>
          Retiring next OP
        </Badge>
      ) : null}
    </div>
  )
}
