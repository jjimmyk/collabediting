import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PLANNING_P_DEFAULT_POSITION } from '@/features/planning-p/planning-p-task-templates'
import {
  getTaskProgress,
  groupTasksByPosition,
  isPlanningPTaskEditableForUser,
} from '@/features/planning-p/planning-p-task-utils'
import type { PlanningPTaskTemplate, PlanningPTaskDialogScope } from '@/features/planning-p/planning-p-task-types'

type PlanningPTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialScope: PlanningPTaskDialogScope
  phaseLabel: string
  positions: string[]
  myTasks: PlanningPTaskTemplate[]
  allTasks: PlanningPTaskTemplate[]
  completions: Record<string, boolean>
  onTaskCompletedChange: (taskId: string, completed: boolean) => void
  readOnly?: boolean
}

function TaskChecklist({
  tasks,
  positions,
  completions,
  onTaskCompletedChange,
  readOnly,
  showPositionForAllTasks = false,
}: {
  tasks: PlanningPTaskTemplate[]
  positions: string[]
  completions: Record<string, boolean>
  onTaskCompletedChange: (taskId: string, completed: boolean) => void
  readOnly?: boolean
  showPositionForAllTasks?: boolean
}) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks are available for this view in this phase.
      </p>
    )
  }

  return (
    <ul className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
      {tasks.map((task) => {
        const checked = completions[task.id] ?? false
        const checkboxId = `planning-p-task-${task.id}`
        const editable =
          !readOnly && isPlanningPTaskEditableForUser(task, positions)
        const showPositionLabel =
          showPositionForAllTasks && task.position !== PLANNING_P_DEFAULT_POSITION

        return (
          <li key={task.id} className="flex items-start gap-3">
            <Checkbox
              id={checkboxId}
              checked={checked}
              disabled={!editable}
              onCheckedChange={(value) => onTaskCompletedChange(task.id, value === true)}
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor={checkboxId} className={cnLabel(editable)}>
                {task.label}
              </Label>
              {showPositionLabel ? (
                <p className="text-[11px] text-muted-foreground">{task.position}</p>
              ) : null}
              {!editable && !readOnly ? (
                <p className="text-[11px] text-muted-foreground">View only for your position</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function cnLabel(editable: boolean): string {
  return editable
    ? 'text-sm leading-snug font-normal'
    : 'text-sm leading-snug font-normal text-muted-foreground'
}

export function PlanningPTasksDialog({
  open,
  onOpenChange,
  initialScope,
  phaseLabel,
  positions,
  myTasks,
  allTasks,
  completions,
  onTaskCompletedChange,
  readOnly = false,
}: PlanningPTasksDialogProps) {
  const [scope, setScope] = useState<PlanningPTaskDialogScope>(initialScope)

  useEffect(() => {
    if (open) {
      setScope(initialScope)
    }
  }, [open, initialScope])

  const positionSummary =
    positions.length > 0 ? positions.join(', ') : 'Unassigned (general tasks)'
  const myProgress = useMemo(() => getTaskProgress(myTasks, completions), [myTasks, completions])
  const allProgress = useMemo(() => getTaskProgress(allTasks, completions), [allTasks, completions])
  const groupedAllTasks = useMemo(() => groupTasksByPosition(allTasks), [allTasks])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[64rem] !max-w-[min(64rem,calc(100%-2rem))] sm:!max-w-[min(64rem,calc(100%-2rem))]">
        <DialogHeader>
          <DialogTitle>{phaseLabel}</DialogTitle>
          <DialogDescription>
            Position: {positionSummary}
            {readOnly ? ' · Read-only historical view' : null}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={scope} onValueChange={(value) => setScope(value as PlanningPTaskDialogScope)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="whitespace-nowrap">
              My Tasks ({myProgress.completed}/{myProgress.total})
            </TabsTrigger>
            <TabsTrigger value="all" className="whitespace-nowrap">
              All Tasks ({allProgress.completed}/{allProgress.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <TaskChecklist
              tasks={myTasks}
              positions={positions}
              completions={completions}
              onTaskCompletedChange={onTaskCompletedChange}
              readOnly={readOnly}
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {allTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks are defined for this phase.
              </p>
            ) : (
              <div className="max-h-[24rem] space-y-4 overflow-y-auto pr-1">
                {groupedAllTasks.map((group) => (
                  <section key={group.position}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.position}
                    </h3>
                    <TaskChecklist
                      tasks={group.tasks}
                      positions={positions}
                      completions={completions}
                      onTaskCompletedChange={onTaskCompletedChange}
                      readOnly={readOnly}
                      showPositionForAllTasks={false}
                    />
                  </section>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {scope === 'my'
              ? `${myProgress.completed} of ${myProgress.total} complete`
              : `${allProgress.completed} of ${allProgress.total} complete across all positions`}
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
