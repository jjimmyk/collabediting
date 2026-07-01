import { Info, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent } from '@/components/ui/item'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { IcsSortableVerticalList } from '@/features/ics/shared/IcsSortableVerticalList'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import {
  ICS201_OBJECTIVE_KIND_OPTIONS,
  ICS201_OBJECTIVE_KIND_TOOLTIP,
} from '../constants'
import { ICS201_BOX_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence, Ics201ObjectiveKind, Ics201ObjectiveRow } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { reorderArrayItems } from '@/lib/reorder-array'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201ObjectivesSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  objectives: Ics201ObjectiveRow[]
  draft: Ics201ObjectiveRow[]
  onDraftChange: (draft: Ics201ObjectiveRow[]) => void
  isLiveConnected?: boolean
  liveObjectives?: Ics201ObjectiveRow[]
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  enforcesCharLimit?: boolean
  charLimit?: number
  structureModeLabel?: string
  saveDisabled?: boolean
  canDeleteObjective?: (row: Ics201ObjectiveRow) => boolean
  sectionAriaLabel?: string
}

function nextObjectiveId(rows: Ics201ObjectiveRow[]) {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}

export function Ics201ObjectivesSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  objectives,
  draft,
  onDraftChange,
  isLiveConnected = false,
  liveObjectives,
  editors = [],
  cursor,
  enforcesCharLimit = false,
  charLimit,
  structureModeLabel,
  saveDisabled = false,
  canDeleteObjective = () => true,
  sectionAriaLabel = ICS201_BOX_LABELS.objectives,
}: Ics201ObjectivesSectionProps) {
  const rows = isEditing ? draft : isLiveConnected && liveObjectives ? liveObjectives : objectives

  const updateRow = (id: number, patch: Partial<Ics201ObjectiveRow>) => {
    onDraftChange(
      draft.map((row) => (row.id === id ? { ...row, ...patch } : row))
    )
  }

  const addRow = () => {
    onDraftChange([
      ...draft,
      {
        id: nextObjectiveId(draft),
        kind: 'O',
        objective: '',
      },
    ])
  }

  const deleteRow = (id: number) => {
    const row = draft.find((entry) => entry.id === id)
    if (row && !canDeleteObjective(row)) {
      return
    }
    onDraftChange(draft.filter((row) => row.id !== id))
  }

  const totalLength = (isEditing ? draft : rows).reduce(
    (sum, entry) => sum + entry.objective.length,
    0
  )
  const overLimit = enforcesCharLimit && charLimit !== undefined && totalLength > charLimit
  const nearLimit = enforcesCharLimit && charLimit !== undefined && totalLength >= charLimit

  const headerRow = (
    <div
      className={cn(
        'grid gap-2 text-[11px] font-semibold text-muted-foreground',
        isEditing
          ? 'grid-cols-[auto_4.5rem_minmax(0,1fr)_auto]'
          : 'grid-cols-[4.5rem_minmax(0,1fr)]'
      )}
    >
      {isEditing ? <span className="w-7" aria-hidden /> : null}
      <div className="flex items-center gap-1">
        <span>O/M</span>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                aria-label="O/M field help"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {ICS201_OBJECTIVE_KIND_TOOLTIP}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span>Objective</span>
      {isEditing ? <span /> : null}
    </div>
  )

  const renderEditRows = () => (
    <>
      {headerRow}
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
      <IcsSortableVerticalList
        items={draft}
        onReorder={(fromIndex, toIndex) =>
          onDraftChange(reorderArrayItems(draft, fromIndex, toIndex))
        }
        className="space-y-2"
        renderItem={(row, _index, dragHandle) => (
          <div className="grid grid-cols-[auto_4.5rem_minmax(0,1fr)_auto] items-start gap-2">
            {dragHandle}
            <select
              value={row.kind}
              className="h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
              onChange={(event) =>
                updateRow(row.id, { kind: event.target.value as Ics201ObjectiveKind })
              }
            >
              <option value="">—</option>
              {ICS201_OBJECTIVE_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Ics201RemoteFieldCarets
              fieldKey={`objective:${row.id}`}
              value={row.objective}
              cursors={cursor.remoteCursors}
              publish={cursor.publishCursor}
              clear={cursor.clearCursor}
              placeholder="Objective statement"
              inputClassName="h-7"
              onChange={(event) => updateRow(row.id, { objective: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete objective"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={!canDeleteObjective(row)}
              onClick={() => deleteRow(row.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
      <div
        className={cn(
          'flex justify-end text-[10px]',
          overLimit || nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        )}
      >
        {totalLength.toLocaleString()}
        {enforcesCharLimit && charLimit !== undefined
          ? ` / ${charLimit.toLocaleString()} characters across objectives`
          : structureModeLabel
            ? ` characters across objectives (${structureModeLabel})`
            : ' characters across objectives'}
      </div>
    </>
  )

  const renderReadRows = () => (
    <>
      {headerRow}
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
          No objectives recorded.
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={`ics-objective-${row.id}`}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2"
          >
            <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
              {row.kind || <span className="text-muted-foreground">—</span>}
            </div>
            <Ics201RemoteFieldCaretsView
              fieldKey={`objective:${row.id}`}
              value={row.objective}
              cursors={cursor.remoteCursors}
            />
          </div>
        ))
      )}
    </>
  )

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-3">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.objectives}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit ? (
                !isEditing ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label="Edit objectives"
                    onClick={onBeginEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>
                    + Add Objective
                  </Button>
                )
              ) : null
            }
          />

          {isEditing ? (
            <>
              {renderEditRows()}
              <Ics201SectionEditActions
                isEditing={isEditing}
                onGenerate={onGenerate}
                onCancel={onCancel}
                onSave={onSave}
                saveDisabled={saveDisabled || overLimit}
              />
            </>
          ) : (
            <IcsEditableSectionContent
              enabled={canEdit && !isEditing}
              ariaLabel={`Edit ${sectionAriaLabel} section`}
              onStartEdit={onBeginEdit}
              className="space-y-3"
            >
              {renderReadRows()}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
