import { Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatHaveLinkLocation,
  type Ics215HaveLinkLocation,
} from '@/features/ics215/ics215-have-asset-link'
import { isHaveLinkActiveCell } from '@/features/roster/resolve-roster-have-ref'
import { cn } from '@/lib/utils'

export type RosterHaveLinkIndicatorProps = {
  location?: Ics215HaveLinkLocation | null
  activeHaveCell?: { rowId: number; columnId: string } | null
  compact?: boolean
  className?: string
}

export function RosterHaveLinkIndicator({
  location,
  activeHaveCell = null,
  compact = false,
  className,
}: RosterHaveLinkIndicatorProps) {
  if (!location) return null

  const linkedHere = isHaveLinkActiveCell(location, activeHaveCell)
  const label = formatHaveLinkLocation(location)

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={linkedHere ? 'default' : 'outline'}
            className={cn(
              'h-4 max-w-[12rem] gap-0.5 truncate px-1.5 text-[9px] font-normal',
              linkedHere && 'bg-primary/90',
              !linkedHere && 'border-amber-500/40 text-amber-700 dark:text-amber-300',
              className
            )}
          >
            <Link2 className="h-2.5 w-2.5 shrink-0" aria-hidden />
            {compact ? 'Have' : linkedHere ? 'This Have cell' : 'Have linked'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {linkedHere ? 'Linked to this Have cell' : 'Assigned to'} {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
