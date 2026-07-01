import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent } from '@/components/ui/item'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { ICS201_ACTION_COLUMN_LABELS, ICS201_BOX_LABELS } from '../field-labels'
import type { Ics201ActionRow, Ics201CollaboratorPresence } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201ActionsSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  actions: Ics201ActionRow[]
  draft: Ics201ActionRow[]
  onDraftChange: (draft: Ics201ActionRow[]) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  sectionAriaLabel?: string
}

const ACTION_FIELDS = ['time', 'action'] as const

function nextActionId(rows: Ics201ActionRow[]) {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}

export function Ics201ActionsSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  actions,
  draft,
  onDraftChange,
  editors = [],
  cursor,
  sectionAriaLabel = ICS201_BOX_LABELS.actions,
}: Ics201ActionsSectionProps) {
  const rows = isEditing ? draft : actions

  const updateRow = (id: number, field: (typeof ACTION_FIELDS)[number], value: string) => {
    onDraftChange(
      draft.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const addRow = () => {
    onDraftChange([
      ...draft,
      {
        id: nextActionId(draft),
        time: '',
        action: '',
      },
    ])
  }

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-3">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.actions}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit ? (
                !isEditing ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label="Edit actions"
                    onClick={onBeginEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>
                    + Add Action
                  </Button>
                )
              ) : null
            }
          />

          {isEditing ? (
            <>
              <div className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-2 text-[11px] font-semibold text-muted-foreground">
                <span>{ICS201_ACTION_COLUMN_LABELS.time}</span>
                <span>{ICS201_ACTION_COLUMN_LABELS.action}</span>
              </div>
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {draft.map((action) => (
                <div key={action.id} className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-2">
                  <Ics201RemoteFieldCarets
                    fieldKey={`actions:${action.id}.time`}
                    value={action.time}
                    cursors={cursor.remoteCursors}
                    publish={cursor.publishCursor}
                    clear={cursor.clearCursor}
                    placeholder={ICS201_ACTION_COLUMN_LABELS.time}
                    inputClassName="h-7"
                    onChange={(event) => updateRow(action.id, 'time', event.target.value)}
                  />
                  <Ics201RemoteFieldCarets
                    fieldKey={`actions:${action.id}.action`}
                    value={action.action}
                    cursors={cursor.remoteCursors}
                    publish={cursor.publishCursor}
                    clear={cursor.clearCursor}
                    placeholder={ICS201_ACTION_COLUMN_LABELS.action}
                    inputClassName="h-7"
                    onChange={(event) => updateRow(action.id, 'action', event.target.value)}
                  />
                </div>
              ))}
              <Ics201SectionEditActions
                isEditing={isEditing}
                onGenerate={onGenerate}
                onCancel={onCancel}
                onSave={onSave}
              />
            </>
          ) : (
            <IcsEditableSectionContent
              enabled={canEdit && !isEditing}
              ariaLabel={`Edit ${sectionAriaLabel} section`}
              onStartEdit={onBeginEdit}
              className="space-y-3"
            >
              <div className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-2 text-[11px] font-semibold text-muted-foreground">
                <span>{ICS201_ACTION_COLUMN_LABELS.time}</span>
                <span>{ICS201_ACTION_COLUMN_LABELS.action}</span>
              </div>
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {rows.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
                  No actions recorded.
                </div>
              ) : (
                rows.map((action) => (
                  <div key={action.id} className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-2">
                    <Ics201RemoteFieldCaretsView
                      fieldKey={`actions:${action.id}.time`}
                      value={action.time}
                      cursors={cursor.remoteCursors}
                    />
                    <Ics201RemoteFieldCaretsView
                      fieldKey={`actions:${action.id}.action`}
                      value={action.action}
                      cursors={cursor.remoteCursors}
                    />
                  </div>
                ))
              )}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
