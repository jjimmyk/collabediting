import { type ReactNode } from 'react'
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
import type {
  Ics215FormSectionDrafts,
  Ics215FormState,
  Ics215IncidentInfoDraft,
  Ics215ResourceTotalsDraft,
  Ics215SectionId,
  Ics215WorkAssignmentsDraft,
} from '@/features/ics215/types'
import {
  computeIcs215ResourceTotals,
  extractIcs215IncidentInfoDraft,
  extractIcs215PreparedByDraft,
  extractIcs215ResourceTotalsDraft,
  extractIcs215WorkAssignmentsDraft,
  appendIcs215ResourceColumn,
} from '@/features/ics215/utils'
import { Item } from '@/components/ui/item'
import { cn } from '@/lib/utils'

type Ics215FormSectionsProps = {
  form: Ics215FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  assigneeOptions: Ics204AssignedUnitOption[]
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
  editingSections,
  drafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
}: Ics215FormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs215IncidentInfoDraft(form)
  const workAssignmentsDraft: Ics215WorkAssignmentsDraft =
    isSectionEditing(editingSections, 'work-assignments') && drafts['work-assignments']
      ? drafts['work-assignments']
      : extractIcs215WorkAssignmentsDraft(form)
  const computedTotals = computeIcs215ResourceTotals(
    workAssignmentsDraft.resourceColumns,
    workAssignmentsDraft.workAssignments
  )
  const resourceTotals =
    isSectionEditing(editingSections, 'resource-totals') && drafts['resource-totals']
      ? drafts['resource-totals']
      : extractIcs215ResourceTotalsDraft(form)
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs215PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics215IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchResourceTotals = (patch: Partial<Ics215ResourceTotalsDraft>) => {
    onPatchDraft('resource-totals', { ...resourceTotals, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const renderSectionShell = (
    section: Ics215SectionId,
    content: ReactNode,
    headerActions?: ReactNode
  ) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <Ics202SectionHeader
              sectionId="incident-info"
              title={ICS215_SECTION_LABELS[section]}
              isEditing={editing}
              canEdit={canEdit}
              disabled={formIsLocked}
              onStartEdit={() => onStartSectionEdit(section)}
            />
            {headerActions}
          </div>
          {content}
          <Ics202SectionEditActions
            isEditing={editing}
            isSaving={isSaving}
            onGenerate={() => onGenerateSection(section)}
            onCancel={() => onCancelSectionEdit(section)}
            onSave={() => onSaveSection(section)}
          />
        </div>
      </Item>
    )
  }

  return (
    <div className="space-y-3">
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

      {renderSectionShell(
        'work-assignments',
        <div className="w-full min-w-0 overflow-hidden">
          <Ics215WorkAssignmentsTable
            resourceColumns={workAssignmentsDraft.resourceColumns}
            workAssignments={workAssignmentsDraft.workAssignments}
            assigneeOptions={assigneeOptions}
            editing={isSectionEditing(editingSections, 'work-assignments')}
            onChange={(next) => onPatchDraft('work-assignments', next)}
          />
        </div>,
        isSectionEditing(editingSections, 'work-assignments') ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs"
            onClick={() =>
              onPatchDraft(
                'work-assignments',
                appendIcs215ResourceColumn(workAssignmentsDraft)
              )
            }
          >
            + Add Resource Requirement
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'resource-totals',
        <div className="space-y-2">
          {!isSectionEditing(editingSections, 'resource-totals') &&
          !isSectionEditing(editingSections, 'work-assignments') ? (
            <p className="text-[11px] text-muted-foreground">
              Values reflect saved work assignment totals. Edit work assignments to recalculate
              automatically on save.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
            {(
              [
                ['Total Resources Required', 'totalResourcesRequired'],
                ['Total Resources Have on Hand', 'totalResourcesHaveOnHand'],
                ['Total Resources Need To Order', 'totalResourcesNeedToOrder'],
              ] as const
            ).map(([label, field]) => {
              const displayValue = isSectionEditing(editingSections, 'work-assignments')
                ? computedTotals[field]
                : resourceTotals[field]

              return (
                <div key={field} className="space-y-1">
                  <Ics202FieldLabel>{label}</Ics202FieldLabel>
                  {isSectionEditing(editingSections, 'resource-totals') ? (
                    <input
                      value={resourceTotals[field]}
                      onChange={(event) => patchResourceTotals({ [field]: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={displayValue} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
            <Ics202FieldLabel>Signature</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                value={preparedBy.preparedBySignature}
                onChange={(event) => patchPreparedBy({ preparedBySignature: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedBySignature} />
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
