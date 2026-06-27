import { useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Ics202SectionEditActions,
} from '@/features/ics202/Ics202SectionToolbar'
import { formatIcs202SourceLabel } from '@/features/ics234/sync-ics202-objectives'
import type {
  Ics234MatrixItemDraft,
  Ics234MatrixItemEditState,
  Ics234MatrixItemRef,
  Ics234ObjectiveRow,
  Ics234StrategyRow,
  Ics234TacticsRow,
} from '@/features/ics234/types'
import { ics234MatrixItemKey, ics234MatrixItemRefsMatch, isIcs234ObjectiveLinkedToIcs202 } from '@/features/ics234/utils'
import { cn } from '@/lib/utils'

function strategyKey(objectiveId: number, strategyId: number) {
  return `${objectiveId}-${strategyId}`
}

function tacticKey(objectiveId: number, strategyId: number, tacticId: number) {
  return `${objectiveId}-${strategyId}-${tacticId}`
}

function displayName(name: string, fallback: string) {
  const trimmed = name.trim()
  return trimmed || fallback
}

type InlineNameFieldProps = {
  name: string
  editing: boolean
  placeholder: string
  onChange: (name: string) => void
  className?: string
}

function InlineNameField({
  name,
  editing,
  placeholder,
  onChange,
  className,
}: InlineNameFieldProps) {
  if (editing) {
    return (
      <input
        value={name}
        placeholder={placeholder}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm font-medium outline-none',
          className
        )}
      />
    )
  }

  return (
    <span className={cn('text-sm font-medium', className)}>
      {displayName(name, placeholder)}
    </span>
  )
}

type Ics234WorkAnalysisMatrixProps = {
  objectives: Ics234ObjectiveRow[]
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingItem: Ics234MatrixItemEditState | null
  onStartItemEdit: (ref: Ics234MatrixItemRef) => void
  onCancelItemEdit: () => void
  onPatchItemDraft: (draft: Ics234MatrixItemDraft) => void
  onSaveItem: () => void
  onGenerateItem: (ref: Ics234MatrixItemRef) => void
  onAddObjective: () => void
  onAddStrategy: (objectiveId: number) => void
  onAddTactic: (objectiveId: number, strategyId: number) => void
  onDeleteObjective: (objectiveId: number) => void
  onDeleteStrategy: (objectiveId: number, strategyId: number) => void
  onDeleteTactic: (objectiveId: number, strategyId: number, tacticId: number) => void
}

export function Ics234WorkAnalysisMatrix({
  objectives,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  editingItem,
  onStartItemEdit,
  onCancelItemEdit,
  onPatchItemDraft,
  onSaveItem,
  onGenerateItem,
  onAddObjective,
  onAddStrategy,
  onAddTactic,
  onDeleteObjective,
  onDeleteStrategy,
  onDeleteTactic,
}: Ics234WorkAnalysisMatrixProps) {
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<number | null>(null)
  const [expandedStrategyKey, setExpandedStrategyKey] = useState<string | null>(null)
  const [expandedTacticKey, setExpandedTacticKey] = useState<string | null>(null)

  const canMutate = canEdit && !formIsLocked

  const isEditingRef = (ref: Ics234MatrixItemRef) =>
    !!editingItem && ics234MatrixItemRefsMatch(editingItem.ref, ref)

  const draftName = (ref: Ics234MatrixItemRef, fallback: string) => {
    if (isEditingRef(ref) && editingItem?.draft.kind === ref.kind) {
      return editingItem.draft.name
    }
    return fallback
  }

  const renderItemEditActions = (ref: Ics234MatrixItemRef) => (
    <Ics202SectionEditActions
      isEditing={isEditingRef(ref)}
      isSaving={isSaving}
      generateLabel="Generate"
      onGenerate={() => onGenerateItem(ref)}
      onCancel={onCancelItemEdit}
      onSave={onSaveItem}
    />
  )

  const renderEditPencil = (ref: Ics234MatrixItemRef, itemLabel: string) =>
    canMutate && !isEditingRef(ref) ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        aria-label={`Edit ${itemLabel}`}
        onClick={(event) => {
          event.stopPropagation()
          onStartItemEdit(ref)
          if (ref.kind === 'objective') {
            setExpandedObjectiveId(ref.objectiveId)
          } else if (ref.kind === 'strategy') {
            setExpandedObjectiveId(ref.objectiveId)
            setExpandedStrategyKey(strategyKey(ref.objectiveId, ref.strategyId))
          } else {
            setExpandedObjectiveId(ref.objectiveId)
            setExpandedStrategyKey(strategyKey(ref.objectiveId, ref.strategyId))
            setExpandedTacticKey(
              tacticKey(ref.objectiveId, ref.strategyId, ref.tacticId)
            )
          }
        }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    ) : null

  const renderTactic = (
    objective: Ics234ObjectiveRow,
    strategy: Ics234StrategyRow,
    tactic: Ics234TacticsRow,
    tacticIndex: number
  ) => {
    const ref: Ics234MatrixItemRef = {
      kind: 'tactic',
      objectiveId: objective.id,
      strategyId: strategy.id,
      tacticId: tactic.id,
    }
    const key = tacticKey(objective.id, strategy.id, tactic.id)
    const isOpen = expandedTacticKey === key
    const editing = isEditingRef(ref)
    const name = draftName(ref, tactic.name)
    const placeholder = `Tactic ${tacticIndex + 1}`

    return (
      <Collapsible
        key={tactic.id}
        open={isOpen}
        onOpenChange={(open) => setExpandedTacticKey(open ? key : null)}
        className="rounded-md border"
      >
        <div
          className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5"
          onClick={() =>
            setExpandedTacticKey((previous) => (previous === key ? null : key))
          }
        >
          <InlineNameField
            name={name}
            editing={editing}
            placeholder={placeholder}
            onChange={(next) => onPatchItemDraft({ kind: 'tactic', name: next })}
            className="flex-1"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              Tactic
            </Badge>
            {renderEditPencil(ref, 'tactic')}
            {canMutate && !editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete tactic"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteTactic(objective.id, strategy.id, tactic.id)
                  if (expandedTacticKey === key) {
                    setExpandedTacticKey(null)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Toggle tactic details"
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        {editing ? (
          <CollapsibleContent>
            <div className="border-t px-2 py-1.5">{renderItemEditActions(ref)}</div>
          </CollapsibleContent>
        ) : null}
      </Collapsible>
    )
  }

  const renderStrategy = (
    objective: Ics234ObjectiveRow,
    strategy: Ics234StrategyRow,
    strategyIndex: number
  ) => {
    const ref: Ics234MatrixItemRef = {
      kind: 'strategy',
      objectiveId: objective.id,
      strategyId: strategy.id,
    }
    const key = strategyKey(objective.id, strategy.id)
    const isOpen = expandedStrategyKey === key
    const editing = isEditingRef(ref)
    const name = draftName(ref, strategy.name)
    const placeholder = `Strategy ${strategyIndex + 1}`

    return (
      <Collapsible
        key={strategy.id}
        open={isOpen}
        onOpenChange={(open) => setExpandedStrategyKey(open ? key : null)}
        className="rounded-md border"
      >
        <div
          className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5"
          onClick={() =>
            setExpandedStrategyKey((previous) => (previous === key ? null : key))
          }
        >
          <InlineNameField
            name={name}
            editing={editing}
            placeholder={placeholder}
            onChange={(next) => onPatchItemDraft({ kind: 'strategy', name: next })}
            className="flex-1"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              Strategy
            </Badge>
            {renderEditPencil(ref, 'strategy')}
            {canMutate && !editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete strategy"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteStrategy(objective.id, strategy.id)
                  if (expandedStrategyKey === key) {
                    setExpandedStrategyKey(null)
                  }
                  if (
                    editingItem &&
                    ics234MatrixItemKey(editingItem.ref).startsWith(
                      `str-${objective.id}-${strategy.id}`
                    )
                  ) {
                    onCancelItemEdit()
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Toggle strategy details"
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="space-y-2 border-t px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Child Tactics</p>
              {canMutate && !editing ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onAddTactic(objective.id, strategy.id)
                    setExpandedObjectiveId(objective.id)
                    setExpandedStrategyKey(key)
                  }}
                >
                  + Add Tactic
                </Button>
              ) : null}
            </div>
            {strategy.tactics.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tactics recorded.</p>
            ) : (
              <div className="space-y-2">
                {strategy.tactics.map((tactic, tacticIndex) =>
                  renderTactic(objective, strategy, tactic, tacticIndex)
                )}
              </div>
            )}
            {renderItemEditActions(ref)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-2">
      {canMutate ? (
        <div className="mb-2 flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onAddObjective}>
            + Add Objective
          </Button>
        </div>
      ) : null}

      {objectives.length === 0 ? (
        <Item variant="outline" className={glassItemBorderClasses}>
          <ItemContent>
            <ItemTitle>No objectives recorded</ItemTitle>
            <ItemDescription>Add objectives to build the work analysis matrix.</ItemDescription>
          </ItemContent>
        </Item>
      ) : (
        objectives.map((objective, objectiveIndex) => {
          const ref: Ics234MatrixItemRef = { kind: 'objective', objectiveId: objective.id }
          const isOpen = expandedObjectiveId === objective.id
          const isLinkedToIcs202 = isIcs234ObjectiveLinkedToIcs202(objective)
          const editing = isEditingRef(ref) && !isLinkedToIcs202
          const name = draftName(ref, objective.name)
          const placeholder = `Objective ${objectiveIndex + 1}`
          const ics202SourceLabel =
            isLinkedToIcs202 && objective.ics202SourceKind
              ? formatIcs202SourceLabel(objective.ics202SourceKind)
              : null

          return (
            <Item
              key={objective.id}
              variant="outline"
              className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}
            >
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => setExpandedObjectiveId(open ? objective.id : null)}
              >
                <div
                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                  onClick={() =>
                    setExpandedObjectiveId((previous) =>
                      previous === objective.id ? null : objective.id
                    )
                  }
                >
                  <ItemContent className="min-w-0 flex-1">
                    <ItemTitle className="line-clamp-none w-full font-medium">
                      <InlineNameField
                        name={name}
                        editing={editing}
                        placeholder={placeholder}
                        onChange={(next) =>
                          onPatchItemDraft({ kind: 'objective', name: next })
                        }
                      />
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="outline">Objective</Badge>
                    {ics202SourceLabel ? (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="max-w-[12rem] truncate text-xs">
                              From ICS-202 · {ics202SourceLabel}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            Autopopulated from ICS-202 Incident Objectives. The objective name is
                            read-only here.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    {!isLinkedToIcs202 ? renderEditPencil(ref, 'objective') : null}
                    {canMutate && !editing && !isLinkedToIcs202 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete objective"
                        className="text-destructive hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteObjective(objective.id)
                          if (expandedObjectiveId === objective.id) {
                            setExpandedObjectiveId(null)
                          }
                          if (
                            editingItem &&
                            (editingItem.ref.objectiveId === objective.id ||
                              ics234MatrixItemKey(editingItem.ref).startsWith(
                                `str-${objective.id}-`
                              ) ||
                              ics234MatrixItemKey(editingItem.ref).startsWith(
                                `tac-${objective.id}-`
                              ))
                          ) {
                            onCancelItemEdit()
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle objective details"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </ItemActions>
                </div>
                <CollapsibleContent>
                  <div className="border-t px-3 py-2 text-sm">
                    <div className="rounded-md p-2">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">Child Strategies</p>
                        {canMutate && !editing ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onAddStrategy(objective.id)
                              setExpandedObjectiveId(objective.id)
                            }}
                          >
                            + Add Strategy
                          </Button>
                        ) : null}
                      </div>
                      {objective.strategies.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No strategies recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {objective.strategies.map((strategy, strategyIndex) =>
                            renderStrategy(objective, strategy, strategyIndex)
                          )}
                        </div>
                      )}
                    </div>
                    {renderItemEditActions(ref)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Item>
          )
        })
      )}
    </div>
  )
}
