import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import {
  ICS202_OBJECTIVE_LABELS,
} from '@/features/ics202/constants'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
  Ics202YesNoReadOnly,
} from '@/features/ics202/Ics202SectionToolbar'
import type {
  Ics202FormSectionDrafts,
  Ics202FormState,
  Ics202IncidentInfoDraft,
  Ics202ObjectiveRow,
  Ics202SectionId,
  Ics202SiteSafetyPlanDraft,
} from '@/features/ics202/types'
import {
  extractIcs202IncidentInfoDraft,
  extractIcs202PreparedByDraft,
  extractIcs202SiteSafetyPlanDraft,
} from '@/features/ics202/utils'
import { cn } from '@/lib/utils'

type Ics202FormSectionsProps = {
  form: Ics202FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics202SectionId, boolean>>
  drafts: Ics202FormSectionDrafts
  onStartSectionEdit: (section: Ics202SectionId) => void
  onCancelSectionEdit: (section: Ics202SectionId) => void
  onSaveSection: (section: Ics202SectionId) => void
  onGenerateSection: (section: Ics202SectionId) => void
  onPatchDraft: <S extends Ics202SectionId>(
    section: S,
    value: Ics202FormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics202SectionId, boolean>>,
  section: Ics202SectionId
) {
  return !!editingSections[section]
}

export function Ics202FormSections({
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
}: Ics202FormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs202IncidentInfoDraft(form)
  const objectives =
    isSectionEditing(editingSections, 'objectives') && drafts.objectives
      ? drafts.objectives
      : form.objectives
  const commandEmphasis =
    isSectionEditing(editingSections, 'command-emphasis') &&
    drafts['command-emphasis'] !== undefined
      ? drafts['command-emphasis']
      : form.commandEmphasis
  const siteSafetyPlan =
    isSectionEditing(editingSections, 'site-safety-plan') && drafts['site-safety-plan']
      ? drafts['site-safety-plan']
      : extractIcs202SiteSafetyPlanDraft(form)
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs202PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics202IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchSiteSafetyPlan = (patch: Partial<Ics202SiteSafetyPlanDraft>) => {
    onPatchDraft('site-safety-plan', { ...siteSafetyPlan, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchObjectiveRow = (
    rowId: number,
    field: keyof Ics202ObjectiveRow,
    value: string
  ) => {
    onPatchDraft(
      'objectives',
      objectives.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addObjectiveRow = () => {
    const nextLabel =
      ICS202_OBJECTIVE_LABELS[objectives.length] ?? String.fromCharCode(65 + objectives.length)
    onPatchDraft('objectives', [
      ...objectives,
      {
        id: objectives.length === 0 ? 1 : Math.max(...objectives.map((row) => row.id)) + 1,
        kind: 'O',
        label: nextLabel,
        objective: '',
      },
    ])
  }

  const deleteObjectiveRow = (rowId: number) => {
    onPatchDraft(
      'objectives',
      objectives.filter((row) => row.id !== rowId)
    )
  }

  const renderSectionShell = (
    section: Ics202SectionId,
    content: ReactNode,
    extraActions?: React.ReactNode
  ) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Ics202SectionHeader
              sectionId={section}
              isEditing={editing}
              canEdit={canEdit}
              disabled={formIsLocked}
              onStartEdit={() => onStartSectionEdit(section)}
            />
            {extraActions}
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
          {(
            [
              ['Incident Name', 'incidentName'],
              ['Incident Location', 'incidentLocation'],
              ['Operational Period From', 'operationalPeriodFrom'],
              ['Operational Period To', 'operationalPeriodTo'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'incident-info') ? (
                <input
                  type={field.includes('Period') ? 'datetime-local' : 'text'}
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
        'objectives',
        <div className="space-y-2">
          <div className="grid grid-cols-[3rem_3rem_minmax(0,1fr)_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>O/M</span>
            <span>Label</span>
            <span>Objective</span>
            <span />
          </div>
          {objectives.length === 0 ? (
            <p className="text-xs text-muted-foreground">No objectives recorded.</p>
          ) : (
            objectives.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[3rem_3rem_minmax(0,1fr)_auto] items-start gap-2"
              >
                {isSectionEditing(editingSections, 'objectives') ? (
                  <>
                    <select
                      value={row.kind}
                      onChange={(event) =>
                        patchObjectiveRow(row.id, 'kind', event.target.value)
                      }
                      className="h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
                    >
                      <option value="">—</option>
                      <option value="O">O</option>
                      <option value="M">M</option>
                    </select>
                    <input
                      value={row.label}
                      onChange={(event) =>
                        patchObjectiveRow(row.id, 'label', event.target.value)
                      }
                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                    <Textarea
                      value={row.objective}
                      onChange={(event) =>
                        patchObjectiveRow(row.id, 'objective', event.target.value)
                      }
                      className="min-h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete objective row"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteObjectiveRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Ics202ReadOnlyField value={row.kind} />
                    <Ics202ReadOnlyField value={row.label} />
                    <Ics202ReadOnlyTextBlock value={row.objective} />
                    <span />
                  </>
                )}
              </div>
            ))
          )}
        </div>,
        isSectionEditing(editingSections, 'objectives') ? (
          <Button type="button" size="sm" variant="outline" onClick={addObjectiveRow}>
            + Add Objective
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'command-emphasis',
        isSectionEditing(editingSections, 'command-emphasis') ? (
          <Textarea
            value={commandEmphasis}
            onChange={(event) => onPatchDraft('command-emphasis', event.target.value)}
            className="min-h-24 text-xs"
            placeholder="Safety message, priorities, key decisions, and directions"
          />
        ) : (
          <Ics202ReadOnlyTextBlock value={commandEmphasis} />
        )
      )}

      {renderSectionShell(
        'site-safety-plan',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Site Safety Plan Required?</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <label className="flex h-8 items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={siteSafetyPlan.siteSafetyPlanRequired}
                  onChange={(event) =>
                    patchSiteSafetyPlan({ siteSafetyPlanRequired: event.target.checked })
                  }
                  className="h-3.5 w-3.5"
                />
                Required
              </label>
            ) : (
              <Ics202YesNoReadOnly value={siteSafetyPlan.siteSafetyPlanRequired} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Site Safety Plan Located At</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <input
                value={siteSafetyPlan.siteSafetyPlanLocation}
                onChange={(event) =>
                  patchSiteSafetyPlan({ siteSafetyPlanLocation: event.target.value })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={siteSafetyPlan.siteSafetyPlanLocation} />
            )}
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
