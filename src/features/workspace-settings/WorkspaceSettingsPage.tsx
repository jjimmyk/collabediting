import { Button } from '@/components/ui/button'
import { OperationalPeriodSettingsSection } from '@/features/operational-periods/OperationalPeriodSettingsSection'
import { WorkspaceNameLocationFields } from '@/features/workspace-settings/WorkspaceNameLocationFields'
import type { WorkspaceOperationalPeriod } from '@/lib/operational-period-types'
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
  showOperationalPeriods?: boolean
  isSupabaseEnabled?: boolean
  startedOperationalPeriodCount?: number
  workingOperationalPeriodNumber?: number
  operationalPeriods?: WorkspaceOperationalPeriod[]
  isLoadingOperationalPeriods?: boolean
  isStartingOperationalPeriod?: boolean
  operationalPeriodStartError?: string | null
  opAdvanceLifecycleSummary?: import('@/lib/operational-period-roster-types').OpAdvanceLifecycleSummary | null
  onStartOperationalPeriod?: () => Promise<{ ok: boolean; message?: string }>
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
  showOperationalPeriods = false,
  isSupabaseEnabled = false,
  startedOperationalPeriodCount = 0,
  workingOperationalPeriodNumber = 1,
  operationalPeriods = [],
  isLoadingOperationalPeriods = false,
  isStartingOperationalPeriod = false,
  operationalPeriodStartError = null,
  opAdvanceLifecycleSummary = null,
  onStartOperationalPeriod,
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
      {showOperationalPeriods && onStartOperationalPeriod ? (
        <OperationalPeriodSettingsSection
          canEdit={canEdit}
          isSupabaseEnabled={isSupabaseEnabled}
          startedOperationalPeriodCount={startedOperationalPeriodCount}
          workingOperationalPeriodNumber={workingOperationalPeriodNumber}
          periods={operationalPeriods}
          isLoadingPeriods={isLoadingOperationalPeriods}
          isStarting={isStartingOperationalPeriod}
          startError={operationalPeriodStartError}
          lifecycleSummary={opAdvanceLifecycleSummary}
          onStartOperationalPeriod={onStartOperationalPeriod}
        />
      ) : null}
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
