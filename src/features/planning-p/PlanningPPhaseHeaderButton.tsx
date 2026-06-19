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
  getPlanningPStepById,
  parsePlanningPStepSchedule,
} from '@/features/planning-p/planning-p-steps'
import { cn } from '@/lib/utils'

type PlanningPPhaseHeaderButtonProps = {
  activeStepId: string
  phaseLabel: string
  workflowProgressPercent: number
  phaseTaskProgressPercent: number
  isStepperOpen: boolean
  onToggleStepper: () => void
  className?: string
}

export function PlanningPPhaseHeaderButton({
  activeStepId,
  phaseLabel,
  workflowProgressPercent,
  phaseTaskProgressPercent,
  isStepperOpen,
  onToggleStepper,
  className,
}: PlanningPPhaseHeaderButtonProps) {
  const activeStep = getPlanningPStepById(activeStepId)
  const schedule = activeStep
    ? parsePlanningPStepSchedule(activeStep.timeWindow)
    : { start: '—', end: '—' }

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
        <PlanningPCircularProgress
          percent={workflowProgressPercent}
          label="Planning-P workflow progress"
        />
        <PlanningPCircularProgress
          percent={phaseTaskProgressPercent}
          label="Current phase task completion"
        />
        <span className="hidden min-w-0 truncate sm:inline">{phaseLabel}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex shrink-0 items-center rounded-sm text-current/80 hover:text-current"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
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
