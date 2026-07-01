import type { ReactNode } from 'react'
import { Info, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ICS202_COMMUNITY_LIFELINES,
  ICS202_OBJECTIVE_KIND_OPTIONS,
  ICS202_OBJECTIVE_KIND_TOOLTIP,
  ICS202_PREPARED_BY_SIGNATURE_TOOLTIP,
  ICS202_SECTION_LABELS,
} from '@/features/ics202/constants'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
  Ics202YesNoReadOnly,
} from '@/features/ics202/Ics202SectionToolbar'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type {
  Ics202CommunityLifelines,
  Ics202FormSectionDrafts,
  Ics202FormState,
  Ics202IncidentInfoDraft,
  Ics202ObjectiveKind,
  Ics202ObjectiveRow,
  Ics202PreparedByDraft,
  Ics202SectionId,
  Ics202SiteSafetyPlanDraft,
} from '@/features/ics202/types'
import {
  extractIcs202IncidentInfoDraft,
  extractIcs202SiteSafetyPlanDraft,
  isIcs202ObjectiveLinkedToIcs201,
} from '@/features/ics202/utils'
import { cn } from '@/lib/utils'

type Ics202FormSectionsProps = {
  form: Ics202FormState
  preparedBy: Ics202PreparedByDraft
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
  preparedBy,
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
  const communityLifelines =
    isSectionEditing(editingSections, 'community-lifelines') && drafts['community-lifelines']
      ? drafts['community-lifelines']
      : form.communityLifelines
  const incidentPriorities =
    isSectionEditing(editingSections, 'incident-priorities') &&
    drafts['incident-priorities'] !== undefined
      ? drafts['incident-priorities']
      : form.incidentPriorities
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
  const criticalInformationRequirements =
    isSectionEditing(editingSections, 'critical-information-requirements') &&
    drafts['critical-information-requirements'] !== undefined
      ? drafts['critical-information-requirements']
      : form.criticalInformationRequirements
  const limitationsAndConstraints =
    isSectionEditing(editingSections, 'limitations-constraints') &&
    drafts['limitations-constraints'] !== undefined
      ? drafts['limitations-constraints']
      : form.limitationsAndConstraints
  const keyDecisionsAndProcedures =
    isSectionEditing(editingSections, 'key-decisions-procedures') &&
    drafts['key-decisions-procedures'] !== undefined
      ? drafts['key-decisions-procedures']
      : form.keyDecisionsAndProcedures

  const patchIncidentInfo = (patch: Partial<Ics202IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchCommunityLifelines = (patch: Partial<Ics202CommunityLifelines>) => {
    onPatchDraft('community-lifelines', { ...communityLifelines, ...patch })
  }

  const patchSiteSafetyPlan = (patch: Partial<Ics202SiteSafetyPlanDraft>) => {
    onPatchDraft('site-safety-plan', { ...siteSafetyPlan, ...patch })
  }

  const patchObjectiveRow = (
    rowId: number,
    field: 'kind' | 'objective',
    value: string
  ) => {
    onPatchDraft(
      'objectives',
      objectives.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: field === 'kind' ? (value as Ics202ObjectiveKind) : value,
            }
          : row
      )
    )
  }

  const addObjectiveRow = () => {
    onPatchDraft('objectives', [
      ...objectives,
      {
        id: objectives.length === 0 ? 1 : Math.max(...objectives.map((row) => row.id)) + 1,
        kind: 'O',
        objective: '',
      },
    ])
  }

  const deleteObjectiveRow = (rowId: number) => {
    const row = objectives.find((entry) => entry.id === rowId)
    if (row && isIcs202ObjectiveLinkedToIcs201(row)) {
      return
    }
    onPatchDraft(
      'objectives',
      objectives.filter((row) => row.id !== rowId)
    )
  }

  const renderTextSection = (
    section: Ics202SectionId,
    value: string,
    placeholder: string
  ) =>
    renderSectionShell(
      section,
      isSectionEditing(editingSections, section) ? (
        <Textarea
          value={value}
          onChange={(event) => onPatchDraft(section, event.target.value as never)}
          className="min-h-24 text-xs"
          placeholder={placeholder}
        />
      ) : (
        <Ics202ReadOnlyTextBlock value={value} />
      )
    )

  const renderSectionShell = (
    section: Ics202SectionId,
    content: ReactNode,
    extraActions?: React.ReactNode,
    options?: { allowEdit?: boolean }
  ) => {
    const editing = isSectionEditing(editingSections, section)
    const allowEdit = options?.allowEdit ?? true
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
              canEdit={canEdit && allowEdit}
              disabled={formIsLocked}
              onStartEdit={() => onStartSectionEdit(section)}
            />
            {extraActions}
          </div>
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing && allowEdit}
            ariaLabel={`Edit ${ICS202_SECTION_LABELS[section].toLowerCase()}`}
            onStartEdit={() => onStartSectionEdit(section)}
          >
            {content}
          </IcsEditableSectionContent>
          {allowEdit ? (
            <Ics202SectionEditActions
              isEditing={editing}
              isSaving={isSaving}
              onGenerate={() => onGenerateSection(section)}
              onCancel={() => onCancelSectionEdit(section)}
              onSave={() => onSaveSection(section)}
            />
          ) : null}
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
              ['1. Incident Name', 'incidentName'],
              ['2. Incident Location', 'incidentLocation'],
              ['3. Operational Period From', 'operationalPeriodFrom'],
              ['3. Operational Period To', 'operationalPeriodTo'],
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
        'community-lifelines',
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ICS202_COMMUNITY_LIFELINES.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-2 rounded-md border border-dashed border-border/60 bg-muted/10 px-2 py-1.5 text-xs"
            >
              {isSectionEditing(editingSections, 'community-lifelines') ? (
                <input
                  type="checkbox"
                  checked={communityLifelines[item.id]}
                  onChange={(event) =>
                    patchCommunityLifelines({ [item.id]: event.target.checked })
                  }
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                />
              ) : (
                <span
                  className={cn(
                    'mt-0.5 box-border h-3.5 w-3.5 shrink-0 rounded-[2px] border border-foreground',
                    communityLifelines[item.id] ? 'bg-foreground' : 'bg-background'
                  )}
                  aria-hidden
                />
              )}
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      )}

      {renderTextSection(
        'incident-priorities',
        incidentPriorities,
        'Incident priorities for this operational period'
      )}

      {renderSectionShell(
        'objectives',
        <div className="space-y-2">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>O/M</span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label="O/M field help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {ICS202_OBJECTIVE_KIND_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span>Objective</span>
            <span />
          </div>
          {objectives.length === 0 ? (
            <p className="text-xs text-muted-foreground">No objectives recorded.</p>
          ) : (
            objectives.map((row) => {
              const linkedToIcs201 = isIcs202ObjectiveLinkedToIcs201(row)
              return (
              <div
                key={row.id}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-2"
              >
                {isSectionEditing(editingSections, 'objectives') && !linkedToIcs201 ? (
                  <>
                    <select
                      value={row.kind}
                      onChange={(event) =>
                        patchObjectiveRow(row.id, 'kind', event.target.value)
                      }
                      className="h-8 rounded-md border bg-transparent px-1 text-xs outline-none"
                    >
                      <option value="">—</option>
                      {ICS202_OBJECTIVE_KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                    <div className="space-y-1">
                      <Ics202ReadOnlyTextBlock value={row.objective} />
                      {linkedToIcs201 ? (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          From ICS-201
                        </span>
                      ) : null}
                    </div>
                    <span />
                  </>
                )}
              </div>
            )})
          )}
        </div>,
        isSectionEditing(editingSections, 'objectives') ? (
          <Button type="button" size="sm" variant="outline" onClick={addObjectiveRow}>
            + Add Objective
          </Button>
        ) : null
      )}

      {renderTextSection(
        'command-emphasis',
        commandEmphasis,
        'Safety message, priorities, key decisions, and directions'
      )}

      {renderSectionShell(
        'site-safety-plan',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>8. Site Safety Plan Required?</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <div className="flex h-8 items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="siteSafetyPlanRequired"
                    checked={siteSafetyPlan.siteSafetyPlanRequired}
                    onChange={() => patchSiteSafetyPlan({ siteSafetyPlanRequired: true })}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="siteSafetyPlanRequired"
                    checked={!siteSafetyPlan.siteSafetyPlanRequired}
                    onChange={() => patchSiteSafetyPlan({ siteSafetyPlanRequired: false })}
                  />
                  No
                </label>
              </div>
            ) : (
              <Ics202YesNoReadOnly value={siteSafetyPlan.siteSafetyPlanRequired} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>9. Site Safety Plan Located At</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-safety-plan') ? (
              <Textarea
                value={siteSafetyPlan.siteSafetyPlanLocation}
                onChange={(event) =>
                  patchSiteSafetyPlan({ siteSafetyPlanLocation: event.target.value })
                }
                className="min-h-8 text-xs"
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={siteSafetyPlan.siteSafetyPlanLocation} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['Name', 'preparedByName'],
              ['Position Title', 'preparedByPositionTitle'],
              ['Date/Time', 'preparedDateTime'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              <Ics202ReadOnlyField value={preparedBy[field]} />
            </div>
          ))}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Ics202FieldLabel>Signature</Ics202FieldLabel>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
                      aria-label="Signature field help"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {ICS202_PREPARED_BY_SIGNATURE_TOOLTIP}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Ics202ReadOnlyField
              value={preparedBy.preparedBySignature}
              className={preparedBy.preparedBySignature ? 'font-serif italic' : undefined}
            />
          </div>
        </div>,
        undefined,
        { allowEdit: false }
      )}

      {renderTextSection(
        'critical-information-requirements',
        criticalInformationRequirements,
        'Critical information requirements for this operational period'
      )}

      {renderTextSection(
        'limitations-constraints',
        limitationsAndConstraints,
        'Limitations and constraints affecting operations'
      )}

      {renderTextSection(
        'key-decisions-procedures',
        keyDecisionsAndProcedures,
        'Key decisions and procedures for this operational period'
      )}

      <p className="px-1 text-[10px] text-muted-foreground">
        Section 14 Prepared By repeats section 10 in the exported document.
      </p>
    </div>
  )
}
