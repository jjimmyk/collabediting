import type { ReactNode } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Item } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ExerciseMselState, MselInject } from './types'
import { getExerciseObjectiveLabel } from './msel-utils'

export type FunctionalMselInjectsEditorProps = {
  objectives: ExerciseMselState['objectives']
  injects: MselInject[]
  expandedInjectId: number | null
  onExpandedInjectIdChange: (injectId: number | null) => void
  onInjectsChange: (updater: (previous: MselInject[]) => MselInject[]) => void
  renderExtraActions?: (inject: MselInject) => ReactNode
  renderInjectSummarySuffix?: (inject: MselInject) => ReactNode
}

export function FunctionalMselInjectsEditor({
  objectives,
  injects,
  expandedInjectId,
  onExpandedInjectIdChange,
  onInjectsChange,
  renderExtraActions,
  renderInjectSummarySuffix,
}: FunctionalMselInjectsEditorProps) {
  const addInject = () => {
    const nextId = injects.length > 0 ? Math.max(...injects.map((row) => row.id)) + 1 : 1
    onInjectsChange((previous) => [
      ...previous,
      {
        id: nextId,
        objectiveId: objectives[0]?.id ?? null,
        scheduledTime: '',
        category: 'Operations',
        inject: '',
        expectedAction: '',
        mapLocation: null,
      },
    ])
    onExpandedInjectIdChange(nextId)
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Master Scenario Events List</p>
          <p className="mt-1 text-xs text-muted-foreground">
            MSEL injects delivered to exercise participants. Each inject links to one exercise
            objective; an objective may have multiple injects.
          </p>
        </div>
        <Button type="button" size="sm" onClick={addInject}>
          <Plus className="mr-1 h-4 w-4" /> Add Inject
        </Button>
      </div>
      {injects.length === 0 && (
        <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          No MSEL injects defined.
        </div>
      )}
      {injects.map((row) => {
        const isInjectOpen = expandedInjectId === row.id
        return (
          <Item
            key={row.id}
            variant="outline"
            className="flex-col items-stretch"
            data-testid={`msel-inject-row-${row.id}`}
          >
            <Collapsible
              open={isInjectOpen}
              onOpenChange={(open) => onExpandedInjectIdChange(open ? row.id : null)}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Toggle MSEL inject ${row.id}`}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isInjectOpen && 'rotate-180')}
                    />
                  </Button>
                </CollapsibleTrigger>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {row.inject.trim() || `Inject ${row.id}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.scheduledTime || 'No time set'} · {row.category} ·{' '}
                    {getExerciseObjectiveLabel(objectives, row.objectiveId)}
                    {renderInjectSummarySuffix?.(row)}
                  </p>
                </div>
                {renderExtraActions?.(row)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete MSEL inject ${row.id}`}
                  onClick={() => {
                    onInjectsChange((previous) => previous.filter((entry) => entry.id !== row.id))
                    if (expandedInjectId === row.id) {
                      onExpandedInjectIdChange(null)
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CollapsibleContent>
                <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor={`exercise-msel-objective-${row.id}`}>Exercise Objective</Label>
                    <Select
                      value={row.objectiveId != null ? String(row.objectiveId) : ''}
                      onValueChange={(value) => {
                        const objectiveId = value ? Number.parseInt(value, 10) : null
                        onInjectsChange((previous) =>
                          previous.map((entry) =>
                            entry.id === row.id ? { ...entry, objectiveId } : entry
                          )
                        )
                      }}
                    >
                      <SelectTrigger id={`exercise-msel-objective-${row.id}`}>
                        <SelectValue placeholder="Select an exercise objective" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            Add exercise objectives first
                          </SelectItem>
                        ) : (
                          objectives.map((objective) => (
                            <SelectItem key={objective.id} value={String(objective.id)}>
                              {getExerciseObjectiveLabel(objectives, objective.id)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`exercise-msel-time-${row.id}`}>Scheduled Time</Label>
                    <Input
                      id={`exercise-msel-time-${row.id}`}
                      type="datetime-local"
                      value={row.scheduledTime}
                      onChange={(event) => {
                        const value = event.target.value
                        onInjectsChange((previous) =>
                          previous.map((entry) =>
                            entry.id === row.id ? { ...entry, scheduledTime: value } : entry
                          )
                        )
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`exercise-msel-category-${row.id}`}>Category</Label>
                    <Input
                      id={`exercise-msel-category-${row.id}`}
                      value={row.category}
                      onChange={(event) => {
                        const value = event.target.value
                        onInjectsChange((previous) =>
                          previous.map((entry) =>
                            entry.id === row.id ? { ...entry, category: value } : entry
                          )
                        )
                      }}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor={`exercise-msel-inject-${row.id}`}>Inject</Label>
                    <Textarea
                      id={`exercise-msel-inject-${row.id}`}
                      value={row.inject}
                      onChange={(event) => {
                        const value = event.target.value
                        onInjectsChange((previous) =>
                          previous.map((entry) =>
                            entry.id === row.id ? { ...entry, inject: value } : entry
                          )
                        )
                      }}
                      className="min-h-20"
                      placeholder="Describe the scenario inject delivered to participants."
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor={`exercise-msel-expected-${row.id}`}>Expected Action</Label>
                    <Textarea
                      id={`exercise-msel-expected-${row.id}`}
                      value={row.expectedAction}
                      onChange={(event) => {
                        const value = event.target.value
                        onInjectsChange((previous) =>
                          previous.map((entry) =>
                            entry.id === row.id ? { ...entry, expectedAction: value } : entry
                          )
                        )
                      }}
                      className="min-h-20"
                      placeholder="Describe the expected participant or controller response."
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
    </div>
  )
}
