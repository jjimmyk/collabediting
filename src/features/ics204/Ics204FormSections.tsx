import type { ReactNode } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import {
  Ics204ReadOnlyField,
  Ics204ReadOnlyTextBlock,
  Ics204SectionEditActions,
  Ics204SectionHeader,
} from '@/features/ics204/Ics204SectionToolbar'
import type {
  Ics204AssignmentInfoDraft,
  Ics204CommunicationsDraft,
  Ics204FormSectionDrafts,
  Ics204FormState,
  Ics204Ics215ImportSnapshot,
  Ics204ResourceAssignedRow,
  Ics204SectionId,
  Ics204WorkAssignmentRow,
} from '@/features/ics204/types'
import {
  extractIcs204AssignmentInfoDraft,
  extractIcs204CommunicationsDraft,
  extractIcs204SectionDraft,
  resolveIcs204ResourceSnapshot,
} from '@/features/ics204/utils'
import type { Ics204AssignedUnitOption } from '@/features/ics204/ics204-assigned-unit-options'
import { Ics215WorkAssignmentsTable } from '@/features/ics215/Ics215WorkAssignmentsTable'
import { cn } from '@/lib/utils'

type Ics204FormSectionsProps = {
  form: Ics204FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics204SectionId, boolean>>
  drafts: Ics204FormSectionDrafts
  expandedWorkAssignmentKey: string | null
  onExpandedWorkAssignmentKeyChange: (key: string | null) => void
  onStartSectionEdit: (section: Ics204SectionId) => void
  onCancelSectionEdit: (section: Ics204SectionId) => void
  onSaveSection: (section: Ics204SectionId) => void
  onGenerateSection: (section: Ics204SectionId) => void
  onPatchDraft: <S extends Ics204SectionId>(
    section: S,
    value: Ics204FormSectionDrafts[S]
  ) => void
  onOpenResourcePicker: () => void
  onOpenIcs204a?: (rowId: number) => void
  onFocusResourceMap?: (resourceId: number, mapLocation: [number, number]) => void
  assigneeOptions?: Ics204AssignedUnitOption[]
  onPatchIcs215Import?: (snapshot: Ics204Ics215ImportSnapshot) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics204SectionId, boolean>>,
  section: Ics204SectionId
) {
  return !!editingSections[section]
}

const ICS204_RESOURCES_ASSIGNED_ROW_MIN_WIDTH = '36rem'

export function Ics204FormSections({
  form,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  editingSections,
  drafts,
  expandedWorkAssignmentKey,
  onExpandedWorkAssignmentKeyChange,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
  onOpenResourcePicker,
  onOpenIcs204a,
  onFocusResourceMap,
  assigneeOptions = [],
  onPatchIcs215Import,
}: Ics204FormSectionsProps) {
  const sectionDisabled = formIsLocked || !canEdit
  const assignmentInfo =
    isSectionEditing(editingSections, 'assignment-info') && drafts['assignment-info']
      ? drafts['assignment-info']
      : extractIcs204AssignmentInfoDraft(form)
  const resourcesAssigned =
    isSectionEditing(editingSections, 'resources-assigned') && drafts['resources-assigned']
      ? drafts['resources-assigned']
      : form.resourcesAssigned
  const workAssignments =
    isSectionEditing(editingSections, 'work-assignments') && drafts['work-assignments']
      ? drafts['work-assignments']
      : form.workAssignments
  const ics215Import =
    isSectionEditing(editingSections, 'work-assignments') && drafts['ics215-import']
      ? drafts['ics215-import']
      : form.ics215Import
  const specialInstructions =
    isSectionEditing(editingSections, 'special-instructions') &&
    drafts['special-instructions'] !== undefined
      ? drafts['special-instructions']
      : form.specialInstructions
  const communicationsDraft =
    isSectionEditing(editingSections, 'communications') && drafts.communications !== undefined
      ? drafts.communications
      : extractIcs204CommunicationsDraft(form)

  const patchIcs215Import = (next: {
    resourceColumns: Ics204Ics215ImportSnapshot['resourceColumns']
    workAssignments: Ics204Ics215ImportSnapshot['workAssignments']
  }) => {
    if (!ics215Import || !onPatchIcs215Import) return
    onPatchIcs215Import({
      ...ics215Import,
      resourceColumns: next.resourceColumns,
      workAssignments: next.workAssignments.map((row) => ({
        ...row,
        assignee: ics215Import.assignee,
      })),
    })
  }

  const patchAssignment = (patch: Partial<Ics204AssignmentInfoDraft>) => {
    onPatchDraft('assignment-info', { ...assignmentInfo, ...patch })
  }

  const patchCommunications = (patch: Partial<Ics204CommunicationsDraft>) => {
    onPatchDraft('communications', { ...communicationsDraft, ...patch })
  }

  const patchResourceRow = (
    rowId: number,
    field: 'reportingInfoNotes' | 'has204A',
    value: string | boolean
  ) => {
    onPatchDraft(
      'resources-assigned',
      resourcesAssigned.map((row) => {
        if (row.id !== rowId) return row
        const nextRow = { ...row, [field]: value }
        if (field === 'has204A' && value === false) {
          return { ...nextRow, ics204a: null }
        }
        return nextRow
      })
    )
  }

  const deleteResourceRow = (rowId: number) => {
    onPatchDraft(
      'resources-assigned',
      resourcesAssigned.filter((row) => row.id !== rowId)
    )
  }

  const patchWorkAssignment = (
    rowId: number,
    field: Exclude<keyof Ics204WorkAssignmentRow, 'resourceRequirements'>,
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
        assignment: '',
        priority: '',
        resourceRequirements: [],
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
      },
    ])
  }

  const addResourceRequirementRow = (workAssignmentId: number) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resourceRequirements: [
                ...workAssignment.resourceRequirements,
                {
                  id:
                    workAssignment.resourceRequirements.length === 0
                      ? 1
                      : Math.max(
                          ...workAssignment.resourceRequirements.map((row) => row.id)
                        ) + 1,
                  resource: '',
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

  const patchResourceRequirementCell = (
    workAssignmentId: number,
    requirementId: number,
    field: 'resource' | 'required' | 'have' | 'need',
    value: string
  ) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resourceRequirements: workAssignment.resourceRequirements.map((requirement) =>
                requirement.id === requirementId
                  ? { ...requirement, [field]: value }
                  : requirement
              ),
            }
          : workAssignment
      )
    )
  }

  const deleteResourceRequirementRow = (workAssignmentId: number, requirementId: number) => {
    onPatchDraft(
      'work-assignments',
      workAssignments.map((workAssignment) =>
        workAssignment.id === workAssignmentId
          ? {
              ...workAssignment,
              resourceRequirements: workAssignment.resourceRequirements.filter(
                (requirement) => requirement.id !== requirementId
              ),
            }
          : workAssignment
      )
    )
  }

  const renderSectionShell = (
    section: Ics204SectionId,
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
            <Ics204SectionHeader
              sectionId={section}
              isEditing={editing}
              canEdit={canEdit}
              disabled={formIsLocked}
              onStartEdit={() => onStartSectionEdit(section)}
            />
            {extraActions}
          </div>
          {content}
          <Ics204SectionEditActions
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
        'assignment-info',
        <>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Section Chief</p>
              {isSectionEditing(editingSections, 'assignment-info') ? (
                <input
                  value={assignmentInfo.sectionChief}
                  onChange={(event) => patchAssignment({ sectionChief: event.target.value })}
                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics204ReadOnlyField value={assignmentInfo.sectionChief} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Branch Director</p>
              {isSectionEditing(editingSections, 'assignment-info') ? (
                <input
                  value={assignmentInfo.branchDirector}
                  onChange={(event) => patchAssignment({ branchDirector: event.target.value })}
                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics204ReadOnlyField value={assignmentInfo.branchDirector} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                Division/Group Supervisor
              </p>
              {isSectionEditing(editingSections, 'assignment-info') ? (
                <input
                  value={assignmentInfo.divisionGroupSupervisor}
                  onChange={(event) =>
                    patchAssignment({ divisionGroupSupervisor: event.target.value })
                  }
                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics204ReadOnlyField value={assignmentInfo.divisionGroupSupervisor} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {(
              [
                ['Branch', 'branch', ['Operations Branch', 'Planning Branch', 'Logistics Branch', 'Medical Branch']],
                ['Division', 'division', ['Division A', 'Division B', 'Division C', 'Division D']],
                [
                  'Group',
                  'group',
                  ['Evacuation Group', 'Infrastructure Group', 'Medical Group', 'Shelter Group'],
                ],
                [
                  'Staging Area',
                  'stagingArea',
                  ['North Staging', 'South Staging', 'East Staging', 'West Staging'],
                ],
              ] as const
            ).map(([label, field, options]) => (
              <div key={field} className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                {isSectionEditing(editingSections, 'assignment-info') ? (
                  <select
                    value={assignmentInfo[field]}
                    onChange={(event) => patchAssignment({ [field]: event.target.value })}
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="">{`Select ${label}`}</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Ics204ReadOnlyField value={assignmentInfo[field]} />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {renderSectionShell(
        'resources-assigned',
        <div className="min-w-0 max-w-full rounded-md border p-2">
          <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-gutter:stable]">
            {resourcesAssigned.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">No resources assigned.</p>
            ) : (
              <div
                className="space-y-2"
                style={{ minWidth: ICS204_RESOURCES_ASSIGNED_ROW_MIN_WIDTH }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_14rem_3.5rem_auto] items-end gap-2 px-1 text-[11px] font-semibold text-muted-foreground">
                  <span>Resource</span>
                  <span>Reporting Info/Notes</span>
                  <span className="text-center">204A</span>
                  <span className="w-8" aria-hidden="true" />
                </div>
                {resourcesAssigned.map((row) => {
                  const editingResources = isSectionEditing(editingSections, 'resources-assigned')
                  const resourceSnapshot = resolveIcs204ResourceSnapshot(row)
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[minmax(0,1fr)_14rem_3.5rem_auto] items-start gap-2"
                    >
                      <ResourceListItemCard
                        resource={resourceSnapshot}
                        glassItemBorderClasses={glassItemBorderClasses}
                        onFocusMap={
                          onFocusResourceMap
                            ? () =>
                                onFocusResourceMap(
                                  resourceSnapshot.id,
                                  resourceSnapshot.mapLocation
                                )
                            : undefined
                        }
                      />
                      <div className="min-w-0">
                        {editingResources ? (
                          <Textarea
                            value={row.reportingInfoNotes}
                            onChange={(event) =>
                              patchResourceRow(row.id, 'reportingInfoNotes', event.target.value)
                            }
                            className="min-h-8 w-full min-w-0 text-xs"
                          />
                        ) : (
                          <Ics204ReadOnlyTextBlock compact value={row.reportingInfoNotes} />
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 text-center">
                        {editingResources ? (
                          <>
                            <label className="inline-flex h-8 items-center justify-center gap-1 text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={row.has204A}
                                onChange={(event) =>
                                  patchResourceRow(row.id, 'has204A', event.target.checked)
                                }
                                className="h-3.5 w-3.5"
                              />
                              X
                            </label>
                            {row.has204A && onOpenIcs204a ? (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto px-0 py-0 text-[10px] font-semibold"
                                onClick={() => onOpenIcs204a(row.id)}
                              >
                                Open 204A
                              </Button>
                            ) : null}
                          </>
                        ) : row.has204A && onOpenIcs204a ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-8 px-1 text-xs font-semibold"
                            aria-label={`Open ICS-204A for ${resourceSnapshot.name}`}
                            onClick={() => onOpenIcs204a(row.id)}
                          >
                            X
                          </Button>
                        ) : (
                          <span className="inline-flex h-8 items-center justify-center text-xs font-semibold">
                            —
                          </span>
                        )}
                      </div>
                      <div className="w-8">
                        {editingResources ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete assigned resource row"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteResourceRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>,
        isSectionEditing(editingSections, 'resources-assigned') ? (
          <Button type="button" size="sm" variant="outline" onClick={onOpenResourcePicker}>
            + Add Resource
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'work-assignments',
        ics215Import ? (
          <div className="space-y-2">
            {ics215Import.workAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No work assignments.</p>
            ) : null}
            <Ics215WorkAssignmentsTable
              resourceColumns={ics215Import.resourceColumns}
              workAssignments={ics215Import.workAssignments}
              assigneeOptions={assigneeOptions}
              lockedAssignee={ics215Import.assignee}
              editing={isSectionEditing(editingSections, 'work-assignments')}
              onChange={patchIcs215Import}
            />
          </div>
        ) : (
        <div className="space-y-2">
          {workAssignments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No work assignments.</p>
          ) : (
            workAssignments.map((row) => {
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
                      onExpandedWorkAssignmentKeyChange(open ? workAssignmentKey : null)
                    }
                  >
                    <div className="relative px-3 py-2.5 pr-12">
                      <ItemContent className="min-w-0">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                          {editingWork ? (
                            <>
                              <input
                                value={row.assignment}
                                onChange={(event) =>
                                  patchWorkAssignment(row.id, 'assignment', event.target.value)
                                }
                                placeholder="Work Assignment"
                                className="col-span-2 h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={row.priority}
                                onChange={(event) =>
                                  patchWorkAssignment(row.id, 'priority', event.target.value)
                                }
                                placeholder="Priority"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                            </>
                          ) : (
                            <>
                              <Ics204ReadOnlyField value={row.assignment} />
                              <Ics204ReadOnlyField value={row.priority} />
                            </>
                          )}
                        </div>
                      </ItemContent>
                      <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
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
                      </ItemActions>
                    </div>
                    <CollapsibleContent>
                      <div className="min-w-0 max-w-full space-y-2 border-t px-3 py-2.5 pr-6">
                        {editingWork ? (
                          <input
                            value={row.requestedArrivalTime}
                            onChange={(event) =>
                              patchWorkAssignment(row.id, 'requestedArrivalTime', event.target.value)
                            }
                            placeholder="Requested Arrival Time"
                            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          />
                        ) : (
                          <Ics204ReadOnlyField value={row.requestedArrivalTime} />
                        )}
                        <div className="space-y-2 rounded-md border p-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">Resource Requirements</p>
                            {editingWork ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addResourceRequirementRow(row.id)}
                              >
                                + Add Requirement
                              </Button>
                            ) : null}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-muted-foreground">
                            <span>Resource</span>
                            <span>Required</span>
                            <span>Have</span>
                            <span>Need</span>
                          </div>
                          {row.resourceRequirements.map((requirement) => (
                            <div key={requirement.id} className="flex items-center gap-2">
                              <div className="grid flex-1 grid-cols-4 gap-2">
                                {(['resource', 'required', 'have', 'need'] as const).map((field) =>
                                  editingWork ? (
                                    <input
                                      key={field}
                                      value={requirement[field]}
                                      onChange={(event) =>
                                        patchResourceRequirementCell(
                                          row.id,
                                          requirement.id,
                                          field,
                                          event.target.value
                                        )
                                      }
                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                  ) : (
                                    <Ics204ReadOnlyField key={field} value={requirement[field]} />
                                  )
                                )}
                              </div>
                              {editingWork ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Delete resource requirement"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    deleteResourceRequirementRow(row.id, requirement.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                        {editingWork ? (
                          <>
                            <Textarea
                              value={row.overheadPositions}
                              onChange={(event) =>
                                patchWorkAssignment(row.id, 'overheadPositions', event.target.value)
                              }
                              className="min-h-16 text-xs"
                              placeholder="Overhead Positions"
                            />
                            <Textarea
                              value={row.specialEquipmentSupplies}
                              onChange={(event) =>
                                patchWorkAssignment(
                                  row.id,
                                  'specialEquipmentSupplies',
                                  event.target.value
                                )
                              }
                              className="min-h-16 text-xs"
                              placeholder="Special Equipment & Supplies"
                            />
                            <input
                              value={row.reportingLocation}
                              onChange={(event) =>
                                patchWorkAssignment(row.id, 'reportingLocation', event.target.value)
                              }
                              placeholder="Reporting Location"
                              className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          </>
                        ) : (
                          <>
                            <Ics204ReadOnlyTextBlock value={row.overheadPositions} />
                            <Ics204ReadOnlyTextBlock value={row.specialEquipmentSupplies} />
                            <Ics204ReadOnlyField value={row.reportingLocation} />
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Item>
              )
            })
          )}
        </div>
        ),
        ics215Import
          ? null
          : isSectionEditing(editingSections, 'work-assignments') ? (
          <Button type="button" size="sm" variant="outline" onClick={addWorkAssignment}>
            + Add Assignment
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'special-instructions',
        isSectionEditing(editingSections, 'special-instructions') ? (
          <Textarea
            value={specialInstructions}
            onChange={(event) => onPatchDraft('special-instructions', event.target.value)}
            className="min-h-20 text-xs"
          />
        ) : (
          <Ics204ReadOnlyTextBlock value={specialInstructions} />
        )
      )}

      {renderSectionShell(
        'communications',
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Communications (radio and/or phone contact numbers needed for this assignment)
            </p>
            {isSectionEditing(editingSections, 'communications') ? (
              <Textarea
                value={communicationsDraft.communications}
                onChange={(event) => patchCommunications({ communications: event.target.value })}
                className="min-h-20 text-xs"
                placeholder="Name/Function — Primary contact (cell, pager, or radio frequency/system/channel)"
              />
            ) : (
              <Ics204ReadOnlyTextBlock value={communicationsDraft.communications} />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">Emergency Communications</p>
            <p className="text-[10px] text-muted-foreground">
              Phone numbers or radio frequency for medical, evacuation, or other emergency contacts.
            </p>
            {isSectionEditing(editingSections, 'communications') ? (
              <Textarea
                value={communicationsDraft.emergencyCommunications}
                onChange={(event) =>
                  patchCommunications({ emergencyCommunications: event.target.value })
                }
                className="min-h-16 text-xs"
                placeholder="Medical — Evacuation — Other"
              />
            ) : (
              <Ics204ReadOnlyTextBlock value={communicationsDraft.emergencyCommunications} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}