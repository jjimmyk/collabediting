import { cn } from '@/lib/utils'
import type { PlanningPTaskProgress } from '@/features/planning-p/planning-p-task-types'

type PlanningPMyTasksTrackerProps = {
  progress: PlanningPTaskProgress
  onOpen: () => void
  readOnly?: boolean
  className?: string
}

export function PlanningPMyTasksTracker({
  progress,
  onOpen,
  readOnly = false,
  className,
}: PlanningPMyTasksTrackerProps) {
  const { completed, total, percent } = progress

  return (
    <button
      type="button"
      className={cn(
        'mt-1.5 flex w-full items-center gap-2 rounded-sm px-0.5 py-0.5 text-left transition-colors',
        readOnly ? 'cursor-default opacity-80' : 'hover:bg-muted/60',
        className
      )}
      onClick={(event) => {
        event.stopPropagation()
        onOpen()
      }}
      aria-label={`My Tasks ${completed} of ${total} complete`}
    >
      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">My Tasks</span>
      <span className="shrink-0 text-[10px] font-semibold tabular-nums text-foreground">
        {completed}/{total}
      </span>
      <span className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </span>
    </button>
  )
}
