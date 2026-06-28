import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import type { Ics204AssignedUnitOption } from '@/features/ics204/ics204-assigned-unit-options'
import { ICS215_SECTION_LABELS } from '@/features/ics215/constants'
import { Ics215WorkAssignmentsTable } from '@/features/ics215/Ics215WorkAssignmentsTable'
import { Ics215WorkAssignmentsLayoutToggle } from '@/features/ics215/Ics215WorkAssignmentsLayoutToggle'
import { Ics215Ics204WorkAssignmentsSyncTooltip } from '@/features/ics204/Ics215Ics204WorkAssignmentsSyncTooltip'
import type { Ics215Ics204WorkSyncTooltipState } from '@/features/ics204/sync-ics215-work-assignments'
import type { ResourceListItemData } from '@/features/resources/types'
import type { Ics234ObjectiveRow } from '@/features/ics234/types'
import type {
  Ics215FormSectionDrafts,
  Ics215FormState,
  Ics215IncidentInfoDraft,
  Ics215SectionId,
  Ics215WorkAssignmentsDraft,
  Ics215WorkAssignmentsLayoutMode,
} from '@/features/ics215/types'
import {
  extractIcs215IncidentInfoDraft,
  extractIcs215PreparedByDraft,
  extractIcs215WorkAssignmentsDraft,
  appendIcs215ResourceColumn,
  appendIcs215WorkAssignmentToDraft,
  fillAllIcs215WorkAssignmentsHaveInDraft,
  normalizeIcs215WorkAssignmentsLayoutMode,
} from '@/features/ics215/utils'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import type { HaveLinkRosterPanelRenderer } from '@/features/roster/WorkspaceRosterPanel'
import type { HaveLinkRosterWorkspaceControls } from '@/features/roster/WorkspaceRosterToolbar'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { Item } from '@/components/ui/item'
import { cn } from '@/lib/utils'

type Ics215FormSectionsProps = {
  form: Ics215FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  assigneeOptions: Ics204AssignedUnitOption[]
  workAssignmentTargetOptions: WorkAssignmentTargetOption[]
  roster?: WorkspaceRosterMember[]
  positionRosterEntries?: PositionRosterEntry[]
  competencyOptions?: string[]
  workspaceAssets?: ResourceListItemData[]
  workspaceId?: string | null
  isSupabaseEnabled?: boolean
  getAccessToken?: () => Promise<string | null>
  autoFillHaveFromAssets?: boolean
  onAutoFillHaveFromAssetsChange?: (enabled: boolean) => void
  onHaveFillComplete?: (filledCount: number) => void
  onWorkAssignmentsLayoutModeChange?: (mode: Ics215WorkAssignmentsLayoutMode) => void
  createHaveLinkRosterActions?: (
    onAssignmentAdded?: (ref: string) => void,
    onAssignmentRemoved?: (ref: string) => void
  ) => HaveLinkRosterActions | undefined
  renderHaveLinkRosterPanel?: HaveLinkRosterPanelRenderer
  haveLinkRosterWorkspaceControls?: HaveLinkRosterWorkspaceControls
  showPositionAssets?: boolean
  ics234Objectives?: Ics234ObjectiveRow[]
  editingSections: Partial<Record<Ics215SectionId, boolean>>
  drafts: Ics215FormSectionDrafts
  onStartSectionEdit: (section: Ics215SectionId) => void
  onCancelSectionEdit: (section: Ics215SectionId) => void
  onSaveSection: (section: Ics215SectionId) => void
  onGenerateSection: (section: Ics215SectionId) => void
  onPatchDraft: <S extends Ics215SectionId>(
    section: S,
    value: Ics215FormSectionDrafts[S]
  ) => void
  onPersistWorkAssignmentsDraft?: (draft: Ics215WorkAssignmentsDraft) => void
  workAssignmentsSyncTooltip?: Ics215Ics204WorkSyncTooltipState
  canLinkNeedAssetRequests?: boolean
  onOpenNeedAssetRequest?: (context: import('@/features/ics215/ics215-need-asset-request-link').Ics215NeedCellContext) => void
  onOpenLinkedNeedAssetRequest?: (storageRecordId: string) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics215SectionId, boolean>>,
  section: Ics215SectionId
) {
  return !!editingSections[section]
}

export function Ics215FormSections({
  form,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  assigneeOptions,
  workAssignmentTargetOptions,
  roster = [],
  positionRosterEntries = [],
  competencyOptions = [],
  editingSections,
  drafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
  onPersistWorkAssignmentsDraft,
  workAssignmentsSyncTooltip,
  workspaceAssets = [],
  workspaceId = null,
  isSupabaseEnabled = false,
  getAccessToken,
  autoFillHaveFromAssets = false,
  onAutoFillHaveFromAssetsChange,
  onHaveFillComplete,
  onWorkAssignmentsLayoutModeChange,
  createHaveLinkRosterActions,
  renderHaveLinkRosterPanel,
  haveLinkRosterWorkspaceControls,
  showPositionAssets = true,
  ics234Objectives = [],
  canLinkNeedAssetRequests = false,
  onOpenNeedAssetRequest,
  onOpenLinkedNeedAssetRequest,
}: Ics215FormSectionsProps) {
  const [workAssignmentsMaximized, setWorkAssignmentsMaximized] = useState(false)

  useEffect(() => {
    if (!workAssignmentsMaximized) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWorkAssignmentsMaximized(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [workAssignmentsMaximized])

  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs215IncidentInfoDraft(form)
  const workAssignmentsDraft: Ics215WorkAssignmentsDraft =
    isSectionEditing(editingSections, 'work-assignments') && drafts['work-assignments']
      ? drafts['work-assignments']
      : extractIcs215WorkAssignmentsDraft(form)
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs215PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics215IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const workAssignmentsEditing = isSectionEditing(editingSections, 'work-assignments')

  const workAssignmentsHeaderActions = workAssignmentsEditing ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <input
          type="checkbox"
          checked={autoFillHaveFromAssets}
          onChange={(event) => onAutoFillHaveFromAssetsChange?.(event.target.checked)}
        />
        Auto-fill Have from assets
      </label>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 text-xs"
        onClick={() =>
          onPatchDraft('work-assignments', appendIcs215WorkAssignmentToDraft(workAssignmentsDraft))
        }
      >
        + Add Assignment
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 text-xs"
        onClick={() => {
          const result = fillAllIcs215WorkAssignmentsHaveInDraft(
            workAssignmentsDraft,
            workspaceAssets,
            true
          )
          onPatchDraft('work-assignments', result.draft)
          if (result.filledCount > 0) {
            onHaveFillComplete?.(result.filledCount)
          }
        }}
      >
        Fill all Have from assets
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 text-xs"
        onClick={() =>
          onPatchDraft('work-assignments', appendIcs215ResourceColumn(workAssignmentsDraft))
        }
      >
        + Add Resource Requirement
      </Button>
    </div>
  ) : null

  const workAssignmentsToolbar = (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <Ics215WorkAssignmentsLayoutToggle
        value={normalizeIcs215WorkAssignmentsLayoutMode(form.workAssignmentsLayoutMode)}
        onChange={(mode) => onWorkAssignmentsLayoutModeChange?.(mode)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        aria-label={
          workAssignmentsMaximized
            ? 'Restore Work Assignments section size'
            : 'Maximize Work Assignments section'
        }
        onClick={() => setWorkAssignmentsMaximized((previous) => !previous)}
      >
        {workAssignmentsMaximized ? (
          <>
            <Minimize2 className="h-3.5 w-3.5" />
            Restore
          </>
        ) : (
          <>
            <Maximize2 className="h-3.5 w-3.5" />
            Maximize
          </>
        )}
      </Button>
    </div>
  )

  const renderWorkAssignmentsTable = (maximized: boolean) => (
    <Ics215WorkAssignmentsTable
      resourceColumns={workAssignmentsDraft.resourceColumns}
      workAssignments={workAssignmentsDraft.workAssignments}
      workAssignmentTargetOptions={workAssignmentTargetOptions}
      roster={roster}
      positionRosterEntries={positionRosterEntries}
      competencyOptions={competencyOptions}
      workspaceAssets={workspaceAssets}
      workspaceId={workspaceId}
      isSupabaseEnabled={isSupabaseEnabled}
      getAccessToken={getAccessToken}
      autoFillHaveFromAssets={autoFillHaveFromAssets}
      layoutMode={normalizeIcs215WorkAssignmentsLayoutMode(form.workAssignmentsLayoutMode)}
      tableLayout={maximized ? 'maximized' : 'default'}
      editing={workAssignmentsEditing}
      canLinkAssets={canEdit && !formIsLocked}
      canLinkNeedAssetRequests={canLinkNeedAssetRequests && canEdit && !formIsLocked}
      onOpenNeedAssetRequest={onOpenNeedAssetRequest}
      onOpenLinkedNeedAssetRequest={onOpenLinkedNeedAssetRequest}
      onRequestEdit={() => onStartSectionEdit('work-assignments')}
      onChange={(next) => onPatchDraft('work-assignments', next)}
      onPersistWorkAssignments={onPersistWorkAssignmentsDraft}
      onHaveFillComplete={onHaveFillComplete}
      createHaveLinkRosterActions={createHaveLinkRosterActions}
      renderHaveLinkRosterPanel={renderHaveLinkRosterPanel}
      haveLinkRosterWorkspaceControls={haveLinkRosterWorkspaceControls}
      showPositionAssets={showPositionAssets}
      ics234Objectives={ics234Objectives}
    />
  )

  const workAssignmentsMaximizedOverlay =
    workAssignmentsMaximized && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ICS215_SECTION_LABELS['work-assignments']}
            className={cn(
              'fixed inset-0 z-40 flex h-dvh flex-col overflow-hidden bg-background',
              glassItemBorderClasses
            )}
          >
            <div className="shrink-0 border-b px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Ics202SectionHeader
                    sectionId="incident-info"
                    title={ICS215_SECTION_LABELS['work-assignments']}
                    isEditing={workAssignmentsEditing}
                    canEdit={canEdit}
                    disabled={formIsLocked}
                    onStartEdit={() => onStartSectionEdit('work-assignments')}
                  />
                  {workAssignmentsSyncTooltip ? (
                    <Ics215Ics204WorkAssignmentsSyncTooltip
                      context="ics215"
                      state={workAssignmentsSyncTooltip}
                    />
                  ) : null}
                </div>
                {workAssignmentsHeaderActions}
              </div>
            </div>
            <div className="shrink-0 px-4 py-2">{workAssignmentsToolbar}</div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-2">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {renderWorkAssignmentsTable(true)}
              </div>
            </div>
            <div className="shrink-0 border-t px-4 py-3">
              <Ics202SectionEditActions
                isEditing={workAssignmentsEditing}
                isSaving={isSaving}
                onGenerate={() => onGenerateSection('work-assignments')}
                onCancel={() => onCancelSectionEdit('work-assignments')}
                onSave={() => onSaveSection('work-assignments')}
              />
            </div>
          </div>,
          document.body
        )
      : null

  const renderSectionShell = (
    section: Ics215SectionId,
    content: ReactNode,
    headerActions?: ReactNode,
    itemClassName?: string,
    headerAccessory?: ReactNode,
    fillViewport = false
  ) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn(
          'min-w-0 max-w-full flex-nowrap flex-col items-stretch overflow-hidden p-0',
          glassItemBorderClasses,
          itemClassName
        )}
      >
        <div
          className={cn(
            'min-w-0 w-full max-w-full space-y-2 px-3 py-2.5',
            fillViewport && 'flex min-h-0 flex-1 flex-col'
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Ics202SectionHeader
                sectionId="incident-info"
                title={ICS215_SECTION_LABELS[section]}
                isEditing={editing}
                canEdit={canEdit}
                disabled={formIsLocked}
                onStartEdit={() => onStartSectionEdit(section)}
              />
              {headerAccessory}
            </div>
            {headerActions}
          </div>
          {fillViewport ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{content}</div>
          ) : (
            content
          )}
          <Ics202SectionEditActions
            isEditing={editing}
            isSaving={isSaving}
            className={fillViewport ? 'shrink-0' : undefined}
            onGenerate={() => onGenerateSection(section)}
            onCancel={() => onCancelSectionEdit(section)}
            onSave={() => onSaveSection(section)}
          />
        </div>
      </Item>
    )
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-3">
      {renderSectionShell(
        'incident-info',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1 xl:col-span-2">
            <Ics202FieldLabel>Incident Name</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'incident-info') ? (
              <input
                value={incidentInfo.incidentName}
                onChange={(event) => patchIncidentInfo({ incidentName: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.incidentName} />
            )}
          </div>
          {(
            [
              ['Date From', 'operationalPeriodDateFrom', 'date'],
              ['Date To', 'operationalPeriodDateTo', 'date'],
              ['Time From', 'operationalPeriodTimeFrom', 'time'],
              ['Time To', 'operationalPeriodTimeTo', 'time'],
            ] as const
          ).map(([label, field, inputType]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'incident-info') ? (
                <input
                  type={inputType}
                  value={incidentInfo[field]}
                  onChange={(event) => patchIncidentInfo({ [field]: event.target.value })}
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={incidentInfo[field]} />
              )}
            </div>
          ))}
        </div>
      )}

      {workAssignmentsMaximizedOverlay}

      {!workAssignmentsMaximized
        ? renderSectionShell(
            'work-assignments',
            <div className="min-w-0 w-full max-w-full space-y-2">
              {workAssignmentsToolbar}
              {renderWorkAssignmentsTable(false)}
            </div>,
            workAssignmentsHeaderActions,
            undefined,
            workAssignmentsSyncTooltip ? (
              <Ics215Ics204WorkAssignmentsSyncTooltip
                context="ics215"
                state={workAssignmentsSyncTooltip}
              />
            ) : null
          )
        : null}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Prepared By (Name)</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                value={preparedBy.preparedByName}
                onChange={(event) => patchPreparedBy({ preparedByName: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedByName} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Position/Title</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                value={preparedBy.preparedByPositionTitle}
                onChange={(event) =>
                  patchPreparedBy({ preparedByPositionTitle: event.target.value })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedByPositionTitle} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Date/Time Prepared</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                type="datetime-local"
                value={preparedBy.preparedDateTime}
                onChange={(event) => patchPreparedBy({ preparedDateTime: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedDateTime} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
