import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Item,
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
import { buildIcs234MatrixTableRows } from '@/features/ics234/build-ics234-matrix-table-rows'
import {
  getIcs234MatrixItemDraftName,
  Ics234MatrixInlineNameField,
  Ics234MatrixItemEditControls,
  type Ics234WorkAnalysisMatrixProps,
} from '@/features/ics234/Ics234MatrixShared'
import { formatIcs202SourceLabel } from '@/features/ics234/sync-ics202-objectives'
import type { Ics234MatrixItemRef } from '@/features/ics234/types'
import { ics234MatrixItemKey, ics234MatrixItemRefsMatch, isIcs234ObjectiveLinkedToIcs202 } from '@/features/ics234/utils'
import { cn } from '@/lib/utils'

const TABLE_CELL_CLASS =
  'min-w-[14rem] max-w-[24rem] border-b px-2 py-2 align-top whitespace-pre-wrap break-words'

const TABLE_NAME_FIELD_CLASS = 'block w-full whitespace-pre-wrap break-words'

const TABLE_MIN_WIDTH = '42rem'

export function Ics234WorkAnalysisMatrixTable({
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
  const canMutate = canEdit && !formIsLocked
  const rows = buildIcs234MatrixTableRows(objectives)

  const isEditingRef = (ref: Ics234MatrixItemRef) =>
    !!editingItem && ics234MatrixItemRefsMatch(editingItem.ref, ref)

  const renderEmptyCell = () => (
    <span className="text-muted-foreground">—</span>
  )

  const renderObjectiveCell = (row: ReturnType<typeof buildIcs234MatrixTableRows>[number]) => {
    const { objective, objectiveIndex } = row
    const ref: Ics234MatrixItemRef = { kind: 'objective', objectiveId: objective.id }
    const isLinkedToIcs202 = isIcs234ObjectiveLinkedToIcs202(objective)
    const editing = isEditingRef(ref) && !isLinkedToIcs202
    const name = getIcs234MatrixItemDraftName(ref, objective.name, editingItem)
    const placeholder = `Objective ${objectiveIndex + 1}`
    const ics202SourceLabel =
      isLinkedToIcs202 && objective.ics202SourceKind
        ? formatIcs202SourceLabel(objective.ics202SourceKind)
        : null

    return (
      <td rowSpan={row.objectiveRowSpan} className={TABLE_CELL_CLASS}>
        <div className="space-y-2">
          <Ics234MatrixInlineNameField
            name={name}
            editing={editing}
            readOnly={isLinkedToIcs202}
            placeholder={placeholder}
            className={TABLE_NAME_FIELD_CLASS}
            onChange={(next) => onPatchItemDraft({ kind: 'objective', name: next })}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              Objective
            </Badge>
            {ics202SourceLabel ? (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="whitespace-normal break-words text-xs"
                    >
                      From ICS-202 · {ics202SourceLabel}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Autopopulated from ICS-202 Incident Objectives. The objective name is
                    read-only here.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Operational
              </Badge>
            )}
            {canMutate && !editing ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={() => onAddStrategy(objective.id)}
              >
                + Strategy
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Ics234MatrixItemEditControls
              ref={ref}
              itemLabel="objective"
              canMutate={canMutate}
              isSaving={isSaving}
              editingItem={editingItem}
              disabled={isLinkedToIcs202}
              onStartItemEdit={onStartItemEdit}
              onCancelItemEdit={onCancelItemEdit}
              onSaveItem={onSaveItem}
              onGenerateItem={onGenerateItem}
              compact
            />
            {canMutate && !editing && !isLinkedToIcs202 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete objective"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  onDeleteObjective(objective.id)
                  if (
                    editingItem &&
                    (editingItem.ref.objectiveId === objective.id ||
                      ics234MatrixItemKey(editingItem.ref).startsWith(`str-${objective.id}-`) ||
                      ics234MatrixItemKey(editingItem.ref).startsWith(`tac-${objective.id}-`))
                  ) {
                    onCancelItemEdit()
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </td>
    )
  }

  const renderStrategyCell = (row: ReturnType<typeof buildIcs234MatrixTableRows>[number]) => {
    if (!row.strategy || row.strategyIndex === null) {
      return (
        <td className={TABLE_CELL_CLASS}>
          {renderEmptyCell()}
        </td>
      )
    }

    const { objective, strategy, strategyIndex } = row
    const ref: Ics234MatrixItemRef = {
      kind: 'strategy',
      objectiveId: objective.id,
      strategyId: strategy.id,
    }
    const editing = isEditingRef(ref)
    const name = getIcs234MatrixItemDraftName(ref, strategy.name, editingItem)
    const placeholder = `Strategy ${strategyIndex + 1}`

    return (
      <td rowSpan={row.strategyRowSpan ?? 1} className={TABLE_CELL_CLASS}>
        <div className="space-y-2">
          <Ics234MatrixInlineNameField
            name={name}
            editing={editing}
            placeholder={placeholder}
            className={TABLE_NAME_FIELD_CLASS}
            onChange={(next) => onPatchItemDraft({ kind: 'strategy', name: next })}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              Strategy
            </Badge>
            {canMutate && !editing ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={() => onAddTactic(objective.id, strategy.id)}
              >
                + Tactic
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Ics234MatrixItemEditControls
              ref={ref}
              itemLabel="strategy"
              canMutate={canMutate}
              isSaving={isSaving}
              editingItem={editingItem}
              onStartItemEdit={onStartItemEdit}
              onCancelItemEdit={onCancelItemEdit}
              onSaveItem={onSaveItem}
              onGenerateItem={onGenerateItem}
              compact
            />
            {canMutate && !editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete strategy"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => {
                  onDeleteStrategy(objective.id, strategy.id)
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
          </div>
        </div>
      </td>
    )
  }

  const renderTacticCell = (row: ReturnType<typeof buildIcs234MatrixTableRows>[number]) => {
    if (!row.strategy || !row.tactic || row.tacticIndex === null) {
      return (
        <td className={TABLE_CELL_CLASS}>
          {renderEmptyCell()}
        </td>
      )
    }

    const { objective, strategy, tactic, tacticIndex } = row
    const ref: Ics234MatrixItemRef = {
      kind: 'tactic',
      objectiveId: objective.id,
      strategyId: strategy.id,
      tacticId: tactic.id,
    }
    const editing = isEditingRef(ref)
    const name = getIcs234MatrixItemDraftName(ref, tactic.name, editingItem)
    const placeholder = `Tactic ${tacticIndex + 1}`

    return (
      <td className={TABLE_CELL_CLASS}>
        <div className="space-y-2">
          <Ics234MatrixInlineNameField
            name={name}
            editing={editing}
            placeholder={placeholder}
            className={TABLE_NAME_FIELD_CLASS}
            onChange={(next) => onPatchItemDraft({ kind: 'tactic', name: next })}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              Tactic
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Ics234MatrixItemEditControls
              ref={ref}
              itemLabel="tactic"
              canMutate={canMutate}
              isSaving={isSaving}
              editingItem={editingItem}
              onStartItemEdit={onStartItemEdit}
              onCancelItemEdit={onCancelItemEdit}
              onSaveItem={onSaveItem}
              onGenerateItem={onGenerateItem}
              compact
            />
            {canMutate && !editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete tactic"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDeleteTactic(objective.id, strategy.id, tactic.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </td>
    )
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-2">
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
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-md border">
          <div
            className="w-0 min-w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
            tabIndex={0}
            aria-label="Work analysis matrix table — scroll horizontally to view additional columns"
          >
            <table
              className="w-full border-collapse text-xs"
              style={{ minWidth: TABLE_MIN_WIDTH }}
            >
            <thead>
              <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                <th className={cn(TABLE_CELL_CLASS, 'font-semibold')}>Objective</th>
                <th className={cn(TABLE_CELL_CLASS, 'font-semibold')}>Strategy</th>
                <th className={cn(TABLE_CELL_CLASS, 'font-semibold')}>Tactic</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowKey} className="align-top">
                  {row.showObjective ? renderObjectiveCell(row) : null}
                  {row.showStrategy || (!row.strategy && row.showObjective)
                    ? renderStrategyCell(row)
                    : null}
                  {renderTacticCell(row)}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
