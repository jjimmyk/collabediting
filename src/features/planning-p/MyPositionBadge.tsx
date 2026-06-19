import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type MyPositionBadgeProps = {
  position: string
  allPositions?: string[]
  className?: string
}

export function MyPositionBadge({
  position,
  allPositions = [],
  className,
}: MyPositionBadgeProps) {
  const isUnassigned = position.trim().length === 0 || position === 'Unassigned'
  const displayPosition = isUnassigned ? 'Unassigned' : position
  const extraPositions = allPositions.filter((entry) => entry !== position)

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'ml-2 max-w-[16rem] truncate',
        isUnassigned && 'text-muted-foreground',
        className
      )}
    >
      My Position: {displayPosition}
    </Badge>
  )

  if (extraPositions.length === 0) {
    return badge
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Assigned positions</p>
          <ul className="mt-1 list-disc pl-4 text-xs">
            {allPositions.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
