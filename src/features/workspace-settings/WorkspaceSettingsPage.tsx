import { Button } from '@/components/ui/button'
import { WorkspaceNameLocationFields } from '@/features/workspace-settings/WorkspaceNameLocationFields'
import type { WorkspaceNameLocationDraft } from '@/features/workspace-settings/types'

type FemaAorOption = {
  id: string
  name: string
}

type EventListOption = {
  id: number
  name: string
}

type WorkspaceSettingsPageProps = {
  kind: 'incident' | 'exercise'
  draft: WorkspaceNameLocationDraft
  onDraftChange: (draft: WorkspaceNameLocationDraft) => void
  onSave: () => void
  onCancel: () => void
  canEdit: boolean
  isSaving?: boolean
  eventList: EventListOption[]
  femaAors: FemaAorOption[]
  isDrawingOnPrimaryMap?: boolean
  onRestartMapDraw?: () => void
}

export function WorkspaceSettingsPage({
  kind,
  draft,
  onDraftChange,
  onSave,
  onCancel,
  canEdit,
  isSaving = false,
  eventList,
  femaAors,
  isDrawingOnPrimaryMap,
  onRestartMapDraw,
}: WorkspaceSettingsPageProps) {
  return (
    <div className="space-y-6 px-0.5 pb-4">
      <WorkspaceNameLocationFields
        kind={kind}
        draft={draft}
        onDraftChange={onDraftChange}
        eventList={eventList}
        femaAors={femaAors}
        canEdit={canEdit}
        isDrawingOnPrimaryMap={isDrawingOnPrimaryMap}
        onRestartMapDraw={onRestartMapDraw}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave} disabled={!canEdit || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
