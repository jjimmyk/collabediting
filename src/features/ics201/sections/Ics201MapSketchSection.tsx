import type { ReactNode } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent, ItemDescription } from '@/components/ui/item'
import { Ics201FieldFocusIndicators } from '@/features/ics201/Ics201FieldFocusIndicators'
import {
  Ics201RemoteFieldCarets,
  Ics201RemoteFieldCaretsView,
} from '@/features/ics201/Ics201RemoteFieldCarets'
import { Ics201MapSketchRemotePointers } from '@/features/ics201/Ics201MapSketchRemotePointers'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { ICS201_BOX_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence, Ics201MapSketchVertex } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201SectionCursorApi } from '@/hooks/useIcs201AllSectionCursors'
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201MapSketchSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  mapSketchPolygon: Ics201MapSketchVertex[]
  draft: Ics201MapSketchVertex[]
  onDraftChange: (draft: Ics201MapSketchVertex[]) => void
  isDrawing?: boolean
  onToggleDrawing?: () => void
  onClearDraft?: () => void
  onAddVertex?: () => void
  onRemoveVertex?: (index: number) => void
  editors?: Ics201CollaboratorPresence[]
  cursor: Ics201SectionCursorApi
  headerExtra?: ReactNode
  sketchLayerRef?: React.RefObject<GraphicsLayer | null>
  remotePointerRefreshKey?: string | number
  sectionAriaLabel?: string
  tutorialDataAttribute?: string
}

export function Ics201MapSketchSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  mapSketchPolygon,
  draft,
  onDraftChange,
  isDrawing = false,
  onToggleDrawing,
  onClearDraft,
  onAddVertex,
  onRemoveVertex,
  editors = [],
  cursor,
  headerExtra,
  sketchLayerRef,
  remotePointerRefreshKey,
  sectionAriaLabel = ICS201_BOX_LABELS.mapSketch,
  tutorialDataAttribute,
}: Ics201MapSketchSectionProps) {
  const vertices = isEditing ? draft : mapSketchPolygon

  const updateVertex = (index: number, axis: 'latitude' | 'longitude', raw: string) => {
    const parsed = raw === '' ? 0 : Number(raw)
    onDraftChange(
      draft.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              [axis]: Number.isFinite(parsed) ? parsed : 0,
            }
          : entry
      )
    )
  }

  const readOnlyBody = (
    <div className="space-y-1.5">
      <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
      <span className="text-[11px] text-muted-foreground">
        {vertices.length} {vertices.length === 1 ? 'vertex' : 'vertices'}
      </span>
      {vertices.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-3 text-center text-[11px] text-muted-foreground">
          No polygon defined.
        </div>
      ) : (
        vertices.map((vertex, index) => (
          <div key={index} className="grid grid-cols-[1.5rem_1fr_1fr] items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
            <Ics201RemoteFieldCaretsView
              fieldKey={`mapSketch:${index}.lat`}
              value={String(vertex.latitude)}
              cursors={cursor.remoteCursors}
            />
            <Ics201RemoteFieldCaretsView
              fieldKey={`mapSketch:${index}.lng`}
              value={String(vertex.longitude)}
              cursors={cursor.remoteCursors}
            />
          </div>
        ))
      )}
    </div>
  )

  return (
    <Item
      variant="outline"
      className={cn('flex-col items-stretch p-0', className)}
      data-ics201-tutorial={tutorialDataAttribute}
    >
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-2">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.mapSketch}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              <>
                {headerExtra}
                {canEdit && !isEditing ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label="Edit map sketch"
                    onClick={onBeginEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </>
            }
          />

          <ItemDescription className="text-xs">
            Draw the incident perimeter on the ArcGIS map to the right or enter coordinates manually.
          </ItemDescription>

          {sketchLayerRef ? (
            <Ics201MapSketchRemotePointers
              cursors={cursor.remoteCursors}
              layerRef={sketchLayerRef}
              refreshKey={remotePointerRefreshKey}
            />
          ) : null}

          {isEditing ? (
            <>
              <Ics201FieldFocusIndicators cursors={cursor.remoteCursors} />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onToggleDrawing ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={isDrawing ? 'default' : 'outline'}
                    className="h-7 gap-1 text-xs"
                    onClick={onToggleDrawing}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {isDrawing ? 'Cancel drawing' : 'Draw polygon'}
                  </Button>
                ) : null}
                {onClearDraft ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={draft.length === 0}
                    onClick={onClearDraft}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {draft.length} {draft.length === 1 ? 'vertex' : 'vertices'}
                  {draft.length > 0 && draft.length < 3 && ' (need at least 3 to form a polygon)'}
                </span>
              </div>
              {isDrawing ? (
                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                  Click on the map to add vertices. Double-click the last vertex to finish.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1.5rem_1fr_1fr_1.75rem] items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>#</span>
                  <span>Latitude</span>
                  <span>Longitude</span>
                  <span className="sr-only">Actions</span>
                </div>
                {draft.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-3 text-center text-[11px] text-muted-foreground">
                    No vertices yet. Use Draw polygon or Add vertex to start.
                  </div>
                ) : (
                  draft.map((vertex, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1.5rem_1fr_1fr_1.75rem] items-center gap-2"
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <Ics201RemoteFieldCarets
                        fieldKey={`mapSketch:${index}.lat`}
                        type="number"
                        step="any"
                        value={Number.isFinite(vertex.latitude) ? String(vertex.latitude) : ''}
                        cursors={cursor.remoteCursors}
                        publish={cursor.publishCursor}
                        clear={cursor.clearCursor}
                        aria-label={`Latitude for vertex ${index + 1}`}
                        placeholder="Latitude"
                        inputClassName="h-7"
                        onChange={(event) => updateVertex(index, 'latitude', event.target.value)}
                      />
                      <Ics201RemoteFieldCarets
                        fieldKey={`mapSketch:${index}.lng`}
                        type="number"
                        step="any"
                        value={Number.isFinite(vertex.longitude) ? String(vertex.longitude) : ''}
                        cursors={cursor.remoteCursors}
                        publish={cursor.publishCursor}
                        clear={cursor.clearCursor}
                        aria-label={`Longitude for vertex ${index + 1}`}
                        placeholder="Longitude"
                        inputClassName="h-7"
                        onChange={(event) => updateVertex(index, 'longitude', event.target.value)}
                      />
                      {onRemoveVertex ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label={`Remove vertex ${index + 1}`}
                          onClick={() => onRemoveVertex(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span />
                      )}
                    </div>
                  ))
                )}
              </div>
              {onAddVertex ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 w-fit gap-1 text-xs"
                  onClick={onAddVertex}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add vertex
                </Button>
              ) : null}
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
              className="space-y-1.5"
            >
              {readOnlyBody}
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
