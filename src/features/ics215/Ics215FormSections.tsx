import { useState, type ReactNode } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { ICS215_SECTION_LABELS } from '@/features/ics215/constants'
import type {
  Ics215FormSectionDrafts,
  Ics215FormState,
  Ics215IncidentInfoDraft,
  Ics215ResourceTotalsDraft,
  Ics215SectionId,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  extractIcs215IncidentInfoDraft,
  extractIcs215PreparedByDraft,
  extractIcs215ResourceTotalsDraft,
} from '@/features/ics215/utils'
import { cn } from '@/lib/utils'

type Ics215FormSectionsProps = {
  form: Ics215FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
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
  editingSections,
  drafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
}: Ics215FormSectionsProps) {
  const [expandedWorkAssignmentKey, setExpandedWorkAssignmentKey] = useState<string | null>(null)

  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs215IncidentInfoDraft(form)
  const workAssignments =
    isSectionEditing(editingSections, 'work-assignments') && drafts['work-assignments']
      ? drafts['work-assignments']
      : form.workAssignments
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

  const patchWorkAssignment = (
    rowId: number,
    field: Exclude<keyof Ics215WorkAssignmentRow, 'resources'>,
    value: string
  ) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addWorkAssignment = () => {
    onPatchDraft('work-assignments', [
      ...workAssignments,
      {
        id:
          workAssignments.length === 0
            ? 1
            : Math.max(...workAssignments.map((row) => row.id)) + 1,
        branch: '',
        divisionGroupOther: '',
        workAssignmentInstructions: '',
        resources: [],
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
      },
    ])
  }

  const deleteWorkAssignment = (rowId: number) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.filter((row) => row.id !== rowId)
    )
  }

  const addResourceLine = (workAssignmentId: number) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resources: [
                ...workAssignment.resources,
                {
                  id:
                    workAssignment.resources.length === 0
                      ? 1
                      : Math.max(...workAssignment.resources.map((row) => row.id)) + 1,
                  categoryKindType: '',
                  required: '',
                  have: '',
                  need: '',
                },
              ],
            }
          : workAssignment
      )
    )
  }

  const patchResourceLine = (
    workAssignmentId: number,
    resourceId: number,
    field: 'categoryKindType' | 'required' | 'have' | 'need',
    value: string
  ) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resources: workAssignment.resources.map((resource) =>
                resource.id === resourceId ? { ...resource, [field]: value } : resource
              ),
            }
          : workAssignment
      )
    )
  }

  const deleteResourceLine = (workAssignmentId: number, resourceId: number) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resources: workAssignment.resources.filter((resource) => resource.id !== resourceId),
            }
          : workAssignment
      )
    )
  }

  const renderSectionShell = (
    section: Ics215SectionId,
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
              sectionId="incident-info"
              title={ICS215_SECTION_LABELS[section]}
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
        <div className="space-y-2">
          {workAssignments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No work assignments.</p>
          ) : (
            workAssignments.map((row, index) => {
              const workAssignmentKey = `${form.id}-${row.id}`
              const isWorkAssignmentOpen = expandedWorkAssignmentKey === workAssignmentKey
              const editingWork = isSectionEditing(editingSections, 'work-assignments')
              return (
                <Item
                  key={row.id}
                  variant="outline"
                  className={cn(
                    'relative min-w-0 w-full max-w-full flex-col items-stretch overflow-hidden p-0 [contain:layout]',
                    glassItemBorderClasses
                  )}
                >
                  <Collapsible
                    open={isWorkAssignmentOpen}
                    onOpenChange={(open) =>
                      setExpandedWorkAssignmentKey(open ? workAssignmentKey : null)
                    }
                  >
                    <div className="relative px-3 py-2.5 pr-12">
                      <ItemContent className="min-w-0">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Assignment {index + 1}
                        </p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {editingWork ? (
                            <>
                              <input
                                value={row.branch}
                                onChange={(event) =>
                                  patchWorkAssignment(row.id, 'branch', event.target.value)
                                }
                                placeholder="Branch"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={row.divisionGroupOther}
                                onChange={(event) =>
                                  patchWorkAssignment(
                                    row.id,
                                    'divisionGroupOther',
                                    event.target.value
                                  )
                                }
                                placeholder="Division/Group/Other"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                            </>
                          ) : (
                            <>
                              <Ics202ReadOnlyField value={row.branch} />
                              <Ics202ReadOnlyField value={row.divisionGroupOther} />
                            </>
                          )}
                        </div>
                      </ItemContent>
                      <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
                        {editingWork ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete work assignment"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteWorkAssignment(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Toggle work assignment details"
                            >
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  isWorkAssignmentOpen && 'rotate-180'
                                )}
                              />
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </ItemActions>
                    </div>
                    <CollapsibleContent>
                      <div className="min-w-0 max-w-full space-y-2 border-t px-3 py-2.5 pr-6">
                        <div className="space-y-1">
                          <Ics202FieldLabel>Work Assignment & Special Instructions</Ics202FieldLabel>
                          {editingWork ? (
                            <Textarea
                              value={row.workAssignmentInstructions}
                              onChange={(event) =>
                                patchWorkAssignment(
                                  row.id,
                                  'workAssignmentInstructions',
                                  event.target.value
                                )
                              }
                              className="min-h-16 text-xs"
                            />
                          ) : (
                            <Ics202ReadOnlyTextBlock value={row.workAssignmentInstructions} />
                          )}
                        </div>

                        <div className="space-y-2 rounded-md border p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">Resources (Req / Have / Need)</p>
                            {editingWork ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => addResourceLine(row.id)}
                              >
                                + Add Resource
                              </Button>
                            ) : null}
                          </div>
                          {row.resources.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No resource lines.</p>
                          ) : (
                            <>
                              <div className="grid grid-cols-[minmax(0,1fr)_4rem_4rem_4rem_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
                                <span>Category/Kind/Type</span>
                                <span>Req</span>
                                <span>Have</span>
                                <span>Need</span>
                                <span />
                              </div>
                              {row.resources.map((resource) => (
                                <div
                                  key={resource.id}
                                  className="grid grid-cols-[minmax(0,1fr)_4rem_4rem_4rem_auto] items-center gap-2"
                                >
                                  {editingWork ? (
                                    <>
                                      <input
                                        value={resource.categoryKindType}
                                        onChange={(event) =>
                                          patchResourceLine(
                                            row.id,
                                            resource.id,
                                            'categoryKindType',
                                            event.target.value
                                          )
                                        }
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                      <input
                                        value={resource.required}
                                        onChange={(event) =>
                                          patchResourceLine(
                                            row.id,
                                            resource.id,
                                            'required',
                                            event.target.value
                                          )
                                        }
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                      <input
                                        value={resource.have}
                                        onChange={(event) =>
                                          patchResourceLine(
                                            row.id,
                                            resource.id,
                                            'have',
                                            event.target.value
                                          )
                                        }
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                      <input
                                        value={resource.need}
                                        onChange={(event) =>
                                          patchResourceLine(
                                            row.id,
                                            resource.id,
                                            'need',
                                            event.target.value
                                          )
                                        }
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete resource line"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => deleteResourceLine(row.id, resource.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Ics202ReadOnlyField value={resource.categoryKindType} />
                                      <Ics202ReadOnlyField value={resource.required} />
                                      <Ics202ReadOnlyField value={resource.have} />
                                      <Ics202ReadOnlyField value={resource.need} />
                                      <span />
                                    </>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>

                        {(
                          [
                            ['Overhead Position(s)', 'overheadPositions'],
                            ['Special Equipment & Supplies', 'specialEquipmentSupplies'],
                            ['Reporting Location', 'reportingLocation'],
                            ['Requested Arrival Time', 'requestedArrivalTime'],
                          ] as const
                        ).map(([label, field]) => (
                          <div key={field} className="space-y-1">
                            <Ics202FieldLabel>{label}</Ics202FieldLabel>
                            {editingWork ? (
                              field === 'specialEquipmentSupplies' ? (
                                <Textarea
                                  value={row[field]}
                                  onChange={(event) =>
                                    patchWorkAssignment(row.id, field, event.target.value)
                                  }
                                  className="min-h-12 text-xs"
                                />
                              ) : (
                                <input
                                  value={row[field]}
                                  onChange={(event) =>
                                    patchWorkAssignment(row.id, field, event.target.value)
                                  }
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                              )
                            ) : field === 'specialEquipmentSupplies' ? (
                              <Ics202ReadOnlyTextBlock value={row[field]} />
                            ) : (
                              <Ics202ReadOnlyField value={row[field]} />
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Item>
              )
            })
          )}
        </div>,
        isSectionEditing(editingSections, 'work-assignments') ? (
          <Button type="button" size="sm" variant="outline" onClick={addWorkAssignment}>
            + Add Assignment
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'resource-totals',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          {(
            [
              ['Total Resources Required', 'totalResourcesRequired'],
              ['Total Resources Have on Hand', 'totalResourcesHaveOnHand'],
              ['Total Resources Need To Order', 'totalResourcesNeedToOrder'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'resource-totals') ? (
                <input
                  value={resourceTotals[field]}
                  onChange={(event) => patchResourceTotals({ [field]: event.target.value })}
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={resourceTotals[field]} />
              )}
            </div>
          ))}
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
