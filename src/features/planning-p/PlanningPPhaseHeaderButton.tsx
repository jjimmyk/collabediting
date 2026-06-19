import type { MouseEvent, PointerEvent } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PlanningPCircularProgress } from '@/features/planning-p/PlanningPCircularProgress'
import {
  getPlanningPPhaseCount,
  getPlanningPStepById,
  parsePlanningPStepSchedule,
} from '@/features/planning-p/planning-p-steps'
import { cn } from '@/lib/utils'

type PlanningPPhaseHeaderButtonProps = {
  activeStepId: string
  phaseLabel: string
  workflowProgressPercent: number
  workflowCompletedPhases: number
  phaseTaskProgressPercent: number
  phaseTasksCompleted: number
  phaseTasksTotal: number
  isStepperOpen: boolean
  onToggleStepper: () => void
  className?: string
}

function stopButtonToggle(event: MouseEvent | PointerEvent) {
  event.stopPropagation()
}

export function PlanningPPhaseHeaderButton({
  activeStepId,
  phaseLabel,
  workflowProgressPercent,
  workflowCompletedPhases,
  phaseTaskProgressPercent,
  phaseTasksCompleted,
  phaseTasksTotal,
  isStepperOpen,
  onToggleStepper,
  className,
}: PlanningPPhaseHeaderButtonProps) {
  const activeStep = getPlanningPStepById(activeStepId)
  const schedule = activeStep
    ? parsePlanningPStepSchedule(activeStep.timeWindow)
    : { start: '—', end: '—' }
  const workflowTotalPhases = getPlanningPPhaseCount()

  return (
    <TooltipProvider delayDuration={150}>
      <Button
        type="button"
        variant={isStepperOpen ? 'default' : 'outline'}
        size="sm"
        className={cn('ml-1 h-8 max-w-[24rem] gap-1.5', className)}
        onClick={onToggleStepper}
        aria-pressed={isStepperOpen}
        aria-label={`${phaseLabel} stepper, ${isStepperOpen ? 'expanded' : 'collapsed'}`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex shrink-0"
              onClick={stopButtonToggle}
              onPointerDown={stopButtonToggle}
            >
              <PlanningPCircularProgress
                percent={workflowProgressPercent}
                label="Planning-P workflow progress"
                inverted={isStepperOpen}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">
            <p className="font-medium">Planning-P workflow progress</p>
            <p className="mt-1 text-muted-foreground">
              {workflowCompletedPhases} of {workflowTotalPhases} phases completed ({workflowProgressPercent}
              %). This shows how far you are through the Planning-P meeting sequence before the
              current phase.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex shrink-0"
              onClick={stopButtonToggle}
              onPointerDown={stopButtonToggle}
            >
              <PlanningPCircularProgress
                percent={phaseTaskProgressPercent}
                label="Current phase task completion"
                inverted={isStepperOpen}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">
            <p className="font-medium">Current phase task completion</p>
            <p className="mt-1 text-muted-foreground">
              {phaseTasksCompleted} of {phaseTasksTotal} tasks complete ({phaseTaskProgressPercent}
              %). This is total task completion across all positions for {phaseLabel}.
            </p>
          </TooltipContent>
        </Tooltip>

        <span className="hidden min-w-0 truncate sm:inline">{phaseLabel}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-sm hover:opacity-100',
                isStepperOpen ? 'text-primary-foreground/90' : 'text-current/80 hover:text-current'
              )}
              onClick={stopButtonToggle}
              onPointerDown={stopButtonToggle}
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">{phaseLabel} scheduled time</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p className="font-medium">Scheduled phase time</p>
            <p className="mt-1">
              Start: {schedule.start}
              {schedule.end !== schedule.start ? (
                <>
                  <br />
                  End: {schedule.end}
                </>
              ) : null}
            </p>
          </TooltipContent>
        </Tooltip>
      </Button>
    </TooltipProvider>
  )
}
