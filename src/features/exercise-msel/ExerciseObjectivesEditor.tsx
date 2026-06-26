import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Item } from '@/components/ui/item'
import type { ExerciseMselState, MselInject } from './types'
import {
  countLinkedInjectsForObjective,
  getExerciseObjectiveLabel,
  nextExerciseObjectiveId,
} from './msel-utils'

export type ExerciseObjectivesEditorProps = {
  objectives: ExerciseMselState['objectives']
  injects: MselInject[]
  onObjectivesChange: (updater: (previous: ExerciseMselState['objectives']) => ExerciseMselState['objectives']) => void
  onInjectsChange?: (updater: (previous: MselInject[]) => MselInject[]) => void
}

export function ExerciseObjectivesEditor({
  objectives,
  injects,
  onObjectivesChange,
  onInjectsChange,
}: ExerciseObjectivesEditorProps) {
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const getDraftName = (objective: ExerciseMselState['objectives'][number]) =>
    drafts[objective.id] ?? objective.name

  const isDraftDirty = (objective: ExerciseMselState['objectives'][number]) =>
    getDraftName(objective) !== objective.name

  const addObjective = () => {
    const nextId = nextExerciseObjectiveId(objectives)
    onObjectivesChange((previous) => [...previous, { id: nextId, name: '' }])
    setDrafts((previous) => ({ ...previous, [nextId]: '' }))
  }

  const saveDraft = (objectiveId: number) => {
    const draft = drafts[objectiveId]
    if (draft == null) {
      return
    }
    onObjectivesChange((previous) =>
      previous.map((entry) => (entry.id === objectiveId ? { ...entry, name: draft } : entry))
    )
    setDrafts((previous) => {
      const next = { ...previous }
      delete next[objectiveId]
      return next
    })
  }

  const cancelDraft = (objectiveId: number) => {
    setDrafts((previous) => {
      const next = { ...previous }
      delete next[objectiveId]
      return next
    })
  }

  const deleteObjective = (objectiveId: number) => {
    onObjectivesChange((previous) => previous.filter((entry) => entry.id !== objectiveId))
    onInjectsChange?.((previous) =>
      previous.map((inject) =>
        inject.objectiveId === objectiveId ? { ...inject, objectiveId: null } : inject
      )
    )
    setDrafts((previous) => {
      const next = { ...previous }
      delete next[objectiveId]
      return next
    })
  }

  const objectiveSummary = useMemo(
    () =>
      objectives.map((objective) => ({
        objective,
        linkedInjectCount: countLinkedInjectsForObjective(injects, objective.id),
        displayName: getExerciseObjectiveLabel(objectives, objective.id),
      })),
    [injects, objectives]
  )

  return (
    <div className="grid gap-3 rounded-md border px-3 py-3" data-testid="exercise-objectives-editor">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Exercise Objectives</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Name each objective for this exercise. Multiple MSEL injects can link to the same
            objective.
          </p>
        </div>
        <Button type="button" size="sm" onClick={addObjective}>
          <Plus className="mr-1 h-4 w-4" /> Add New Exercise Objective
        </Button>
      </div>
      {objectives.length === 0 && (
        <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          No exercise objectives defined.
        </div>
      )}
      {objectiveSummary.map(({ objective, linkedInjectCount, displayName }) => {
        const draftName = getDraftName(objective)
        const dirty = isDraftDirty(objective)
        return (
          <Item key={objective.id} variant="outline" className="flex-col items-stretch">
            <div className="flex items-start gap-2 px-3 py-2.5">
              <div className="grid min-w-0 flex-1 gap-1">
                <Input
                  id={`workspace-exercise-objective-${objective.id}`}
                  value={draftName}
                  onChange={(event) => {
                    setDrafts((previous) => ({
                      ...previous,
                      [objective.id]: event.target.value,
                    }))
                  }}
                  placeholder="Enter objective name"
                  aria-label={`Objective name for ${displayName}`}
                />
                <p className="text-xs text-muted-foreground">
                  {linkedInjectCount} linked MSEL inject{linkedInjectCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-start">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => cancelDraft(objective.id)}
                  disabled={!dirty}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => saveDraft(objective.id)}
                  disabled={!dirty}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete exercise objective ${displayName}`}
                  onClick={() => deleteObjective(objective.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Item>
        )
      })}
    </div>
  )
}
