import type { ReactNode } from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { ICS208_SECTION_LABELS } from '@/features/ics208/constants'
import type {
  Ics208FormSectionDrafts,
  Ics208FormState,
  Ics208IncidentInfoDraft,
  Ics208SectionId,
  Ics208YesNo,
} from '@/features/ics208/types'
import {
  extractIcs208IncidentInfoDraft,
  extractIcs208PreparedByDraft,
  extractIcs208SafetyMessagePlanDraft,
  extractIcs208SiteSafetyPlanDraft,
  formatIcs208YesNo,
} from '@/features/ics208/utils'
import { cn } from '@/lib/utils'
import { Item } from '@/components/ui/item'

type Ics208FormSectionsProps = {
  form: Ics208FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics208SectionId, boolean>>
  drafts: Ics208FormSectionDrafts
  onStartSectionEdit: (section: Ics208SectionId) => void
  onCancelSectionEdit: (section: Ics208SectionId) => void
  onSaveSection: (section: Ics208SectionId) => void
  onGenerateSection: (section: Ics208SectionId) => void
  onPatchDraft: <S extends Ics208SectionId>(
    section: S,
    value: Ics208FormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics208SectionId, boolean>>,
  section: Ics208SectionId
) {
  return !!editingSections[section]
}

export function Ics208FormSections({
  form,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  editingSections,
  drafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
}: Ics208FormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs208IncidentInfoDraft(form)
  const safetyMessagePlan =
    isSectionEditing(editingSections, 'safety-message-plan') && drafts['safety-message-plan']
      ? drafts['safety-message-plan'].safetyMessagePlan
      : extractIcs208SafetyMessagePlanDraft(form).safetyMessagePlan
  const siteSafetyPlan =
    isSectionEditing(editingSections, 'site-safety-plan') && drafts['site-safety-plan']
      ? drafts['site-safety-plan']
      : extractIcs208SiteSafetyPlanDraft(form)
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs208PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics208IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchSiteSafetyPlan = (patch: Partial<typeof siteSafetyPlan>) => {
    onPatchDraft('site-safety-plan', { ...siteSafetyPlan, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const renderSectionShell = (section: Ics208SectionId, content: ReactNode) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <Ics202SectionHeader
            sectionId="incident-info"
            title={ICS208_SECTION_LABELS[section]}
            isEditing={editing}
            canEdit={canEdit}
            disabled={formIsLocked}
            onStartEdit={() => onStartSectionEdit(section)}
          />
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
              ['Operational Period Date From', 'operationalPeriodDateFrom', 'date'],
              ['Operational Period Date To', 'operationalPeriodDateTo', 'date'],
              ['Operational Period Time From', 'operationalPeriodTimeFrom', 'time'],
              ['Operational Period Time To', 'operationalPeriodTimeTo', 'time'],
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
        'safety-message-plan',
        isSectionEditing(editingSections, 'safety-message-plan') ? (
          <Textarea
            value={safetyMessagePlan}
            onChange={(event) =>
              onPatchDraft('safety-message-plan', { safetyMessagePlan: event.target.value })
            }
            className="min-h-32 text-xs"
            placeholder="Safety priorities, known hazards, precautions, and key command emphasis/decisions/directions..."
          />
        ) : (
          <Ics202ReadOnlyTextBlock value={safetyMessagePlan} />
        )
      )}

      {renderSectionShell(
        'site-safety-plan',
        <div className="space-y-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Site Safety Plan Required?</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <select
                value={siteSafetyPlan.siteSafetyPlanRequired}
                onChange={(event) =>
                  patchSiteSafetyPlan({
                    siteSafetyPlanRequired: event.target.value as Ics208YesNo,
                  })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            ) : (
              <Ics202ReadOnlyField value={formatIcs208YesNo(siteSafetyPlan.siteSafetyPlanRequired)} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Approved Site Safety Plan(s) Located At</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <Textarea
                value={siteSafetyPlan.approvedSiteSafetyPlanLocatedAt}
                onChange={(event) =>
                  patchSiteSafetyPlan({ approvedSiteSafetyPlanLocatedAt: event.target.value })
                }
                className="min-h-16 text-xs"
                placeholder="Location of approved site safety plan(s)..."
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={siteSafetyPlan.approvedSiteSafetyPlanLocatedAt} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Name</Ics202FieldLabel>
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
                onChange={(event) =>
                  patchPreparedBy({ preparedBySignature: event.target.value })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedBySignature} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Date/Time</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                type="datetime-local"
                value={preparedBy.preparedByDateTime}
                onChange={(event) =>
                  patchPreparedBy({ preparedByDateTime: event.target.value })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedByDateTime} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
