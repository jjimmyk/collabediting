import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Item, ItemContent } from '@/components/ui/item'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
  Ics201RemoteTextareaCarets,
  Ics201RemoteTextareaCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { createIcs201ResourceRowFromAsset, resolveIcs201ResourceSnapshot } from '../resource-summary-utils'
import { ICS201_BOX_LABELS, ICS201_RESOURCE_COLUMN_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence, Ics201ResourceSummaryRow } from '../types'
import { OrganizationAssetPickerDialog } from '@/features/resources/OrganizationAssetPickerDialog'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type LegacyResourceTextField = Exclude<
  keyof Ics201ResourceSummaryRow,
  'id' | 'onScene' | 'assetKey' | 'resourceId' | 'resourceSnapshot'
>

type LocalResourceField = 'dateTimeOrdered' | 'eta' | 'notes'

const LEGACY_RESOURCE_TEXT_FIELDS: ReadonlyArray<{ field: LegacyResourceTextField; label: string }> =
  [
    { field: 'resource', label: ICS201_RESOURCE_COLUMN_LABELS.resource },
    { field: 'resourceIdentifier', label: ICS201_RESOURCE_COLUMN_LABELS.resourceIdentifier },
    { field: 'dateTimeOrdered', label: ICS201_RESOURCE_COLUMN_LABELS.dateTimeOrdered },
    { field: 'eta', label: ICS201_RESOURCE_COLUMN_LABELS.eta },
    { field: 'notes', label: ICS201_RESOURCE_COLUMN_LABELS.notes },
  ]

const LOCAL_RESOURCE_FIELDS: ReadonlyArray<{ field: LocalResourceField; label: string }> = [
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
  hubAssets: ResourceListItemData[]
  workspaceOptions: AssetWorkspaceOption[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses: string
  onFocusResourceMap?: (resourceId: number, mapLocation: [number, number]) => void
}

function nextResourceId(rows: Ics201ResourceSummaryRow[]) {
  return rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id)) + 1
}

function isLinkedResourceRow(row: Ics201ResourceSummaryRow) {
  return row.assetKey != null && row.assetKey.trim().length > 0
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
  hubAssets,
  workspaceOptions,
  orgAssetIdsByKey = {},
  glassItemBorderClasses,
  onFocusResourceMap,
}: Ics201ResourcesSectionProps) {
  const rows = isEditing ? draft : resources
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)

  const assetsByKey = useMemo(() => {
    const map: Record<string, ResourceListItemData> = {}
    for (const asset of hubAssets) {
      map[asset.assetKey] = asset
    }
    return map
  }, [hubAssets])

  const excludeAssetKeys = useMemo(
    () =>
      draft
        .map((row) => row.assetKey)
        .filter((assetKey): assetKey is string => Boolean(assetKey?.trim())),
    [draft]
  )

  const updateLegacyTextField = (id: number, field: LegacyResourceTextField, value: string) => {
    onDraftChange(draft.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const updateLocalField = (id: number, field: LocalResourceField, value: string) => {
    onDraftChange(draft.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const updateOnScene = (id: number, onScene: boolean) => {
    onDraftChange(draft.map((row) => (row.id === id ? { ...row, onScene } : row)))
  }

  const removeRow = (id: number) => {
    onDraftChange(draft.filter((row) => row.id !== id))
  }

  const handleAddAsset = (asset: ResourceListItemData) => {
    const newRow = createIcs201ResourceRowFromAsset(nextResourceId(draft), asset)
    onDraftChange([...draft, newRow])
    setAssetPickerOpen(false)
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

  const legacyHeaderGrid = (
    <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem] gap-2 text-[11px] font-semibold text-muted-foreground">
      {LEGACY_RESOURCE_TEXT_FIELDS.map(({ label }) => (
        <span key={label}>{label}</span>
      ))}
      <span className="text-center">{ICS201_RESOURCE_COLUMN_LABELS.onScene}</span>
    </div>
  )

  const linkedLocalHeaderGrid = (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem_minmax(0,1.5fr)_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
      {LOCAL_RESOURCE_FIELDS.slice(0, 2).map(({ label }) => (
        <span key={label}>{label}</span>
      ))}
      <span className="text-center">{ICS201_RESOURCE_COLUMN_LABELS.onScene}</span>
      <span>{ICS201_RESOURCE_COLUMN_LABELS.notes}</span>
      <span className="w-8" aria-hidden="true" />
    </div>
  )

  const renderLinkedRowEdit = (row: Ics201ResourceSummaryRow) => {
    const resourceSnapshot = resolveIcs201ResourceSnapshot(row, assetsByKey)
    return (
      <div key={row.id} className="space-y-2 rounded-md border border-border/60 p-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <ResourceListItemCard
              resource={resourceSnapshot}
              glassItemBorderClasses={glassItemBorderClasses}
              workspaceOptions={workspaceOptions}
              onFocusMap={
                onFocusResourceMap
                  ? () => onFocusResourceMap(resourceSnapshot.id, resourceSnapshot.mapLocation)
                  : undefined
              }
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            aria-label={`Remove resource ${row.id}`}
            onClick={() => removeRow(row.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem_minmax(0,1.5fr)] items-start gap-2">
          {LOCAL_RESOURCE_FIELDS.slice(0, 2).map(({ field, label }) => (
            <Ics201RemoteFieldCarets
              key={`${row.id}-${field}`}
              fieldKey={`resources:${row.id}.${field}`}
              value={row[field]}
              cursors={cursor.remoteCursors}
              publish={cursor.publishCursor}
              clear={cursor.clearCursor}
              placeholder={label}
              inputClassName="h-7"
              onChange={(event) => updateLocalField(row.id, field, event.target.value)}
            />
          ))}
          {renderOnSceneCell(row, true)}
          <Ics201RemoteTextareaCarets
            fieldKey={`resources:${row.id}.notes`}
            value={row.notes}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder={ICS201_RESOURCE_COLUMN_LABELS.notes}
            className="min-h-8"
            onChange={(event) => updateLocalField(row.id, 'notes', event.target.value)}
          />
        </div>
      </div>
    )
  }

  const renderLinkedRowView = (row: Ics201ResourceSummaryRow) => {
    const resourceSnapshot = resolveIcs201ResourceSnapshot(row, assetsByKey)
    return (
      <div key={row.id} className="space-y-2 rounded-md border border-border/60 p-2">
        <ResourceListItemCard
          resource={resourceSnapshot}
          glassItemBorderClasses={glassItemBorderClasses}
          workspaceOptions={workspaceOptions}
          onFocusMap={
            onFocusResourceMap
              ? () => onFocusResourceMap(resourceSnapshot.id, resourceSnapshot.mapLocation)
              : undefined
          }
        />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4rem_minmax(0,1.5fr)] items-start gap-2">
          {LOCAL_RESOURCE_FIELDS.slice(0, 2).map(({ field }) => (
            <Ics201RemoteFieldCaretsView
              key={`${row.id}-${field}`}
              fieldKey={`resources:${row.id}.${field}`}
              value={row[field]}
              cursors={cursor.remoteCursors}
            />
          ))}
          {renderOnSceneCell(row, false)}
          <Ics201RemoteTextareaCaretsView
            fieldKey={`resources:${row.id}.notes`}
            value={row.notes}
            cursors={cursor.remoteCursors}
            className="min-h-8"
          />
        </div>
      </div>
    )
  }

  const renderLegacyRowEdit = (row: Ics201ResourceSummaryRow) => (
    <div
      key={row.id}
      className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem_auto] items-center gap-2"
    >
      {LEGACY_RESOURCE_TEXT_FIELDS.map(({ field, label }) =>
        field === 'notes' ? (
          <Ics201RemoteTextareaCarets
            key={`${row.id}-${field}`}
            fieldKey={`resources:${row.id}.${field}`}
            value={String(row[field] ?? '')}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder={label}
            className="min-h-8"
            onChange={(event) => updateLegacyTextField(row.id, field, event.target.value)}
          />
        ) : (
          <Ics201RemoteFieldCarets
            key={`${row.id}-${field}`}
            fieldKey={`resources:${row.id}.${field}`}
            value={String(row[field] ?? '')}
            cursors={cursor.remoteCursors}
            publish={cursor.publishCursor}
            clear={cursor.clearCursor}
            placeholder={label}
            inputClassName="h-7"
            onChange={(event) => updateLegacyTextField(row.id, field, event.target.value)}
          />
        )
      )}
      {renderOnSceneCell(row, true)}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground"
        aria-label={`Remove resource ${row.id}`}
        onClick={() => removeRow(row.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  const renderLegacyRowView = (row: Ics201ResourceSummaryRow) => (
    <div
      key={row.id}
      className="grid grid-cols-[repeat(5,minmax(0,1fr))_4rem] items-center gap-2"
    >
      {LEGACY_RESOURCE_TEXT_FIELDS.map(({ field }) =>
        field === 'notes' ? (
          <Ics201RemoteTextareaCaretsView
            key={`${row.id}-${field}`}
            fieldKey={`resources:${row.id}.${field}`}
            value={String(row[field] ?? '')}
            cursors={cursor.remoteCursors}
            className="min-h-8"
          />
        ) : (
          <Ics201RemoteFieldCaretsView
            key={`${row.id}-${field}`}
            fieldKey={`resources:${row.id}.${field}`}
            value={String(row[field] ?? '')}
            cursors={cursor.remoteCursors}
          />
        )
      )}
      {renderOnSceneCell(row, false)}
    </div>
  )

  const hasLegacyRows = rows.some((row) => !isLinkedResourceRow(row))
  const hasLinkedRows = rows.some((row) => isLinkedResourceRow(row))

  const renderRows = (editing: boolean) => {
    if (rows.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
          No resources recorded.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {hasLinkedRows ? (
          <div className="space-y-2">
            {hasLegacyRows ? (
              <p className="text-[11px] font-semibold text-muted-foreground">Linked assets</p>
            ) : null}
            {linkedLocalHeaderGrid}
            {rows
              .filter(isLinkedResourceRow)
              .map((row) => (editing ? renderLinkedRowEdit(row) : renderLinkedRowView(row)))}
          </div>
        ) : null}
        {hasLegacyRows ? (
          <div className="space-y-2">
            {hasLinkedRows ? (
              <p className="text-[11px] font-semibold text-muted-foreground">Manual entries</p>
            ) : null}
            {legacyHeaderGrid}
            {rows
              .filter((row) => !isLinkedResourceRow(row))
              .map((row) => (editing ? renderLegacyRowEdit(row) : renderLegacyRowView(row)))}
          </div>
        ) : null}
      </div>
    )
  }

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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAssetPickerOpen(true)}
                  >
                    + Add asset
                  </Button>
                )
              ) : null
            }
          />

          {isEditing ? (
            <>
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {renderRows(true)}
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
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              {renderRows(false)}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>

      <OrganizationAssetPickerDialog
        assets={hubAssets}
        orgAssetIdsByKey={orgAssetIdsByKey}
        glassItemBorderClasses={glassItemBorderClasses}
        selected={[]}
        onChange={() => {}}
        workspaceOptions={workspaceOptions}
        idPrefix="ics201-resources"
        mode="replace-single"
        excludeAssetKeys={excludeAssetKeys}
        onReplaceSelect={handleAddAsset}
        showSelectedSection={false}
        triggerLabel="+ Add asset"
        dialogTitle="Add asset to Resources Summary"
        dialogDescription="Search organization assets, expand each row to review details, then add an asset to Box 11."
        open={assetPickerOpen}
        onOpenChange={setAssetPickerOpen}
        hideTrigger
      />
    </Item>
  )
}
