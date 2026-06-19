import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlanningPTasksTracker } from '@/features/planning-p/PlanningPTasksTracker'
import { PLANNING_P_STEPS } from '@/features/planning-p/planning-p-steps'
import type { PlanningPTaskProgress, PlanningPTaskDialogScope } from '@/features/planning-p/planning-p-task-types'

type PlanningPStepperProps = {
  activeStepId: string
  onStepChange: (stepId: string) => void
  onHide?: () => void
  myTaskProgressByStepId?: Record<string, PlanningPTaskProgress>
  allTaskProgressByStepId?: Record<string, PlanningPTaskProgress>
  onOpenTasks?: (stepId: string, scope: PlanningPTaskDialogScope) => void
  tasksReadOnly?: boolean
  className?: string
}

export function PlanningPStepper({
  activeStepId,
  onStepChange,
  onHide,
  myTaskProgressByStepId,
  allTaskProgressByStepId,
  onOpenTasks,
  tasksReadOnly = false,
  className,
}: PlanningPStepperProps) {
  const activeIndex = PLANNING_P_STEPS.findIndex((step) => step.id === activeStepId)

  return (
    <nav
      aria-label="Planning-P workflow"
      className={cn('flex h-full flex-col', className)}
    >
      <div className="flex items-start justify-between gap-2 border-b px-3 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Planning-P
          </p>
        </div>
        {onHide && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onHide}
            aria-label="Hide Planning P stepper"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ol className="min-h-0 flex-1 space-y-0 overflow-y-auto px-2 py-3">
        {PLANNING_P_STEPS.map((step, index) => {
          const isActive = step.id === activeStepId
          const isComplete = activeIndex > index
          const myTaskProgress = myTaskProgressByStepId?.[step.id] ?? {
            completed: 0,
            total: 0,
            percent: 0,
          }
          const allTaskProgress = allTaskProgressByStepId?.[step.id] ?? {
            completed: 0,
            total: 0,
            percent: 0,
          }
          return (
            <li key={step.id} className="relative pb-3 last:pb-0">
              {index < PLANNING_P_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-6 left-[0.69rem] h-[calc(100%-0.35rem)] w-px',
                    isComplete ? 'bg-primary/60' : 'bg-border'
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onStepChange(step.id)}
                className={cn(
                  'relative flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors',
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-muted/50'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isComplete
                        ? 'border-emerald-600 bg-emerald-100 text-emerald-700'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-xs font-medium leading-snug',
                      isActive ? 'text-foreground' : 'text-foreground/90'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {step.timeWindow}
                  </span>
                  {onOpenTasks ? (
                    <>
                      <PlanningPTasksTracker
                        label="My Tasks"
                        progress={myTaskProgress}
                        readOnly={tasksReadOnly}
                        onOpen={() => onOpenTasks(step.id, 'my')}
                      />
                      <PlanningPTasksTracker
                        label="All Tasks"
                        progress={allTaskProgress}
                        readOnly={tasksReadOnly}
                        onOpen={() => onOpenTasks(step.id, 'all')}
                      />
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
