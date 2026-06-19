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
import { PLANNING_P_DEFAULT_POSITION } from '@/features/planning-p/planning-p-task-templates'
import type { PlanningPTaskTemplate } from '@/features/planning-p/planning-p-task-types'

type PlanningPMyTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseLabel: string
  positions: string[]
  tasks: PlanningPTaskTemplate[]
  completions: Record<string, boolean>
  onTaskCompletedChange: (taskId: string, completed: boolean) => void
  readOnly?: boolean
}

export function PlanningPMyTasksDialog({
  open,
  onOpenChange,
  phaseLabel,
  positions,
  tasks,
  completions,
  onTaskCompletedChange,
  readOnly = false,
}: PlanningPMyTasksDialogProps) {
  const completedCount = tasks.filter((task) => completions[task.id]).length
  const positionSummary =
    positions.length > 0 ? positions.join(', ') : 'Unassigned (general tasks)'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{phaseLabel} — My Tasks</DialogTitle>
          <DialogDescription>
            Position: {positionSummary}
            {readOnly ? ' · Read-only historical view' : null}
          </DialogDescription>
        </DialogHeader>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks are assigned for your position in this phase.
          </p>
        ) : (
          <ul className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const checked = completions[task.id] ?? false
              const checkboxId = `planning-p-task-${task.id}`
              return (
                <li key={task.id} className="flex items-start gap-3">
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    disabled={readOnly}
                    onCheckedChange={(value) => onTaskCompletedChange(task.id, value === true)}
                  />
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor={checkboxId} className="text-sm leading-snug font-normal">
                      {task.label}
                    </Label>
                    {task.position !== PLANNING_P_DEFAULT_POSITION && positions.length > 1 ? (
                      <p className="text-[11px] text-muted-foreground">{task.position}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <DialogFooter className="sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {completedCount} of {tasks.length} complete
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
