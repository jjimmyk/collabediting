import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import { Ics201RemoteTextCursors } from '@/features/ics201/Ics201RemoteTextCursors'
import { Ics201SectionEditorBadges } from '@/features/ics201/Ics201SectionEditorBadges'
import { ICS201_BOX_LABELS } from '../field-labels'
import type { Ics201CollaboratorPresence } from '../types'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { cn } from '@/lib/utils'
import { Ics201BoxHeader } from './Ics201BoxHeader'
import { Ics201SectionEditActions } from './Ics201SectionEditActions'

type Ics201CurrentSituationSectionProps = {
  className?: string
  canEdit: boolean
  isEditing: boolean
  onBeginEdit: () => void
  onCancel: () => void
  onSave: () => void
  onGenerate?: () => void
  currentSituationSummary: string
  draftSummary: string
  onDraftChange: (value: string) => void
  isLiveConnected?: boolean
  liveValue?: string
  editors?: Ics201CollaboratorPresence[]
  remoteCursors?: Ics201CursorState[]
  onSelectionChange?: (element: HTMLTextAreaElement) => void
  onBlur?: () => void
  enforcesCharLimit?: boolean
  charLimit?: number
  structureModeLabel?: string
  saveDisabled?: boolean
  sectionAriaLabel?: string
  tutorialDataAttribute?: string
}

export function Ics201CurrentSituationSection({
  className,
  canEdit,
  isEditing,
  onBeginEdit,
  onCancel,
  onSave,
  onGenerate,
  currentSituationSummary,
  draftSummary,
  onDraftChange,
  isLiveConnected = false,
  liveValue,
  editors = [],
  remoteCursors = [],
  onSelectionChange,
  onBlur,
  enforcesCharLimit = false,
  charLimit,
  structureModeLabel,
  saveDisabled = false,
  sectionAriaLabel = ICS201_BOX_LABELS.currentSituation,
  tutorialDataAttribute,
}: Ics201CurrentSituationSectionProps) {
  const displayValue = isLiveConnected ? (liveValue ?? draftSummary) : currentSituationSummary
  const editValue = draftSummary
  const charCount = editValue.length
  const overLimit = enforcesCharLimit && charLimit !== undefined && charCount > charLimit
  const nearLimit = enforcesCharLimit && charLimit !== undefined && charCount >= charLimit

  return (
    <Item
      variant="outline"
      className={cn('flex-col items-stretch p-0', className)}
      data-ics201-tutorial={tutorialDataAttribute}
    >
      <div className="px-3 py-2.5">
        <ItemContent className="space-y-2">
          <Ics201BoxHeader
            title={ICS201_BOX_LABELS.currentSituation}
            editors={<Ics201SectionEditorBadges editors={editors} />}
            actions={
              canEdit && !isEditing ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Edit current situation"
                  onClick={onBeginEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null
            }
          />

          {isEditing ? (
            <>
              <div className="relative">
                <Textarea
                  autoFocus
                  value={editValue}
                  maxLength={enforcesCharLimit ? charLimit : undefined}
                  className="min-h-24 text-xs"
                  placeholder="Current situation summary"
                  onChange={(event) => onDraftChange(event.target.value)}
                  onSelect={(event) => onSelectionChange?.(event.currentTarget)}
                  onKeyUp={(event) => onSelectionChange?.(event.currentTarget)}
                  onInput={(event) => onSelectionChange?.(event.currentTarget)}
                  onClick={(event) => onSelectionChange?.(event.currentTarget)}
                  onBlur={onBlur}
                />
                <Ics201RemoteTextCursors
                  value={editValue}
                  cursors={remoteCursors}
                  className="min-h-24 text-xs"
                />
              </div>
              <div
                className={cn(
                  'flex justify-end text-[10px]',
                  overLimit || nearLimit
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                )}
              >
                {charCount.toLocaleString()}
                {enforcesCharLimit && charLimit !== undefined
                  ? ` / ${charLimit.toLocaleString()} characters`
                  : structureModeLabel
                    ? ` characters (${structureModeLabel})`
                    : ' characters'}
              </div>
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
            >
              <div className="relative min-h-24 whitespace-pre-wrap rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
                {displayValue || <span className="text-muted-foreground">—</span>}
                <Ics201RemoteTextCursors
                  value={displayValue}
                  cursors={remoteCursors}
                  className="text-xs"
                />
              </div>
            </IcsEditableSectionContent>
          )}
        </ItemContent>
      </div>
    </Item>
  )
}
