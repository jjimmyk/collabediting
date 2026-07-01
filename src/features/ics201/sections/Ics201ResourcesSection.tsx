import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Item, ItemContent } from '@/components/ui/item'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { ICS201_BOX_LABELS, ICS201_RESOURCE_COLUMN_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence, Ics201ResourceSummaryRow } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type ResourceTextField = Exclude<keyof Ics201ResourceSummaryRow, 'id' | 'onScene'>

const RESOURCE_TEXT_FIELDS: ReadonlyArray<{ field: ResourceTextField; label: string }> = [
  { field: 'resource', label: ICS201_RESOURCE_COLUMN_LABELS.resource },
  { field: 'resourceIdentifier', label: ICS201_RESOURCE_COLUMN_LABELS.resourceIdentifier },
  { field: 'dateTimeOrdered', label: ICS201_RESOURCE_COLUMN_LABELS.dateTimeOrdered },
  { field: 'eta', label: ICS201_RESOURCE_COLUMN_LABELS.eta },
  { field: 'notes', label: ICS201_RESOURCE_COLUMN_LABELS.notes },
]

type Ics201ResourcesSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  resources: Ics201ResourceSummaryRow[]
  draft: Ics201ResourceSummaryRow[]
  onDraftChange: (draft: Ics201ResourceSummaryRow[]) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  sectionAriaLabel?: string
}

function nextResourceId(rows: Ics201ResourceSummaryRow[]) {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}

export function Ics201ResourcesSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  resources,
  draft,
  onDraftChange,
  editors = [],
  cursor,
  sectionAriaLabel = ICS201_BOX_LABELS.resources,
}: Ics201ResourcesSectionProps) {
  const rows = isEditing ? draft : resources

  const updateTextField = (id: number, field: ResourceTextField, value: string) => {
    onDraftChange(
      draft.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const updateOnScene = (id: number, onScene: boolean) => {
    onDraftChange(
      draft.map((row) => (row.id === id ? { ...row, onScene } : row))
    )
  }

  const addRow = () => {
    onDraftChange([
      ...draft,
      {
        id: nextResourceId(draft),
        resource: '',
        resourceIdentifier: '',
        dateTimeOrdered: '',
        eta: '',
        onScene: false,
        notes: '',
      },
    ])
  }

  const renderOnSceneCell = (row: Ics201ResourceSummaryRow, editing: boolean) => {
    if (editing) {
      return (
        <div className="flex h-7 items-center justify-center">
          <Checkbox
            checked={row.onScene}
            aria-label={`${ICS201_RESOURCE_COLUMN_LABELS.onScene} for resource ${row.id}`}
            onCheckedChange={(checked) => updateOnScene(row.id, checked === true)}
          />
        </div>
      )
    }

    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
        {row.onScene ? 'Yes' : 'No'}
      </div>
    )
  }

  const headerGrid = (
    <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem] gap-2 text-[11px] font-semibold text-muted-foreground">
      {RESOURCE_TEXT_FIELDS.map(({ label }) => (
        <span key={label}>{label}</span>
      ))}
      <span className="text-center">{ICS201_RESOURCE_COLUMN_LABELS.onScene}</span>
    </div>
  )

  return (
    <Item variant="outline" className={cn('flex-col items-stretch p-0', className)}>
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-3">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.resources}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit ? (
                !isEditing ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label="Edit resources summary"
                    onClick={onBeginEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>
                    + Add Resource
                  </Button>
                )
              ) : null
            }
          />

          {isEditing ? (
            <>
              {headerGrid}
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {draft.map((resource) => (
                <div
                  key={resource.id}
                  className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem] items-center gap-2"
                >
                  {RESOURCE_TEXT_FIELDS.map(({ field, label }) => (
                    <Ics201RemoteFieldCarets
                      key={`${resource.id}-${field}`}
                      fieldKey={`resources:${resource.id}.${field}`}
                      value={resource[field]}
                      cursors={cursor.remoteCursors}
                      publish={cursor.publishCursor}
                      clear={cursor.clearCursor}
                      placeholder={label}
                      inputClassName="h-7"
                      onChange={(event) => updateTextField(resource.id, field, event.target.value)}
                    />
                  ))}
                  {renderOnSceneCell(resource, true)}
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
              {headerGrid}
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {rows.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
                  No resources recorded.
                </div>
              ) : (
                rows.map((resource) => (
                  <div
                    key={resource.id}
                    className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem] items-center gap-2"
                  >
                    {RESOURCE_TEXT_FIELDS.map(({ field }) => (
                      <Ics201RemoteFieldCaretsView
                        key={`${resource.id}-${field}`}
                        fieldKey={`resources:${resource.id}.${field}`}
                        value={resource[field]}
                        cursors={cursor.remoteCursors}
                      />
                    ))}
                    {renderOnSceneCell(resource, false)}
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
