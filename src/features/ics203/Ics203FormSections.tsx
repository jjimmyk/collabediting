import type { ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import {
  ICS203_COMMAND_STAFF_FIELDS,
  ICS203_FINANCE_UNIT_FIELDS,
  ICS203_LOGISTICS_UNIT_FIELDS,
  ICS203_OPERATIONS_TOP_FIELDS,
  ICS203_PLANNING_UNIT_FIELDS,
  ICS203_SECTION_LABELS,
} from '@/features/ics203/constants'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202SectionEditActions,
} from '@/features/ics202/Ics202SectionToolbar'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import type {
  Ics203AgencyRepresentativeRow,
  Ics203DivisionGroupRow,
  Ics203FormSectionDrafts,
  Ics203FormState,
  Ics203OperationsBranch,
  Ics203SectionId,
} from '@/features/ics203/types'
import { extractIcs203SectionDraft, nextRowId } from '@/features/ics203/utils'
import { cn } from '@/lib/utils'

type Ics203FormSectionsProps = {
  form: Ics203FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics203SectionId, boolean>>
  drafts: Ics203FormSectionDrafts
  onStartSectionEdit: (section: Ics203SectionId) => void
  onCancelSectionEdit: (section: Ics203SectionId) => void
  onSaveSection: (section: Ics203SectionId) => void
  onGenerateSection: (section: Ics203SectionId) => void
  onPatchDraft: <S extends Ics203SectionId>(
    section: S,
    value: Ics203FormSectionDrafts[S]
  ) => void
}

function isEditing(
  editingSections: Partial<Record<Ics203SectionId, boolean>>,
  section: Ics203SectionId
) {
  return !!editingSections[section]
}

function PositionFields<T extends Record<string, string>>({
  fields,
  values,
  editing,
  onChange,
}: {
  fields: ReadonlyArray<readonly [string, keyof T & string]>
  values: T
  editing: boolean
  onChange: (field: keyof T & string, value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      {fields.map(([label, field]) => (
        <div key={field} className="space-y-1">
          <Ics202FieldLabel>{label}</Ics202FieldLabel>
          {editing ? (
            <input
              value={values[field] ?? ''}
              onChange={(event) => onChange(field, event.target.value)}
              className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
            />
          ) : (
            <Ics202ReadOnlyField value={values[field] ?? ''} />
          )}
        </div>
      ))}
    </div>
  )
}

function DivisionGroupTable({
  rows,
  editing,
  onChange,
  onAdd,
  onDelete,
}: {
  rows: Ics203DivisionGroupRow[]
  editing: boolean
  onChange: (rowId: number, field: keyof Ics203DivisionGroupRow, value: string) => void
  onAdd: () => void
  onDelete: (rowId: number) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground">Division/Group</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No division/group entries.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
            {editing ? (
              <>
                <input
                  value={row.identifier}
                  placeholder="Identifier"
                  onChange={(event) => onChange(row.id, 'identifier', event.target.value)}
                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <input
                  value={row.supervisorName}
                  placeholder="Supervisor"
                  onChange={(event) => onChange(row.id, 'supervisorName', event.target.value)}
                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Ics202ReadOnlyField value={row.identifier} />
                <Ics202ReadOnlyField value={row.supervisorName} />
                <span />
              </>
            )}
          </div>
        ))
      )}
      {editing ? (
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          + Add Division/Group
        </Button>
      ) : null}
    </div>
  )
}

export function Ics203FormSections({
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
}: Ics203FormSectionsProps) {
  const getDraft = <S extends Ics203SectionId>(
    section: S
  ): NonNullable<Ics203FormSectionDrafts[S]> => {
    if (isEditing(editingSections, section) && drafts[section] !== undefined) {
      return drafts[section] as NonNullable<Ics203FormSectionDrafts[S]>
    }
    return extractIcs203SectionDraft(form, section) as NonNullable<Ics203FormSectionDrafts[S]>
  }

  const incidentInfo = getDraft('incident-info')
  const commandStaff = getDraft('command-staff')
  const agencyRows = getDraft('agency-representatives') as Ics203AgencyRepresentativeRow[]
  const planning = getDraft('planning-section')
  const logistics = getDraft('logistics-section')
  const operations = getDraft('operations-section')
  const finance = getDraft('finance-section')
  const preparedBy = getDraft('prepared-by')

  const renderSectionShell = (
    section: Ics203SectionId,
    content: ReactNode,
    extraActions?: React.ReactNode
  ) => {
    const editing = isEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">{ICS203_SECTION_LABELS[section]}</p>
            {canEdit && !formIsLocked && !editing ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                aria-label={`Edit ${ICS203_SECTION_LABELS[section].toLowerCase()}`}
                onClick={() => onStartSectionEdit(section)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {extraActions}
          </div>
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing}
            ariaLabel={`Edit ${ICS203_SECTION_LABELS[section].toLowerCase()}`}
            onStartEdit={() => onStartSectionEdit(section)}
          >
            {content}
          </IcsEditableSectionContent>
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
              ['Operational Period From', 'operationalPeriodFrom'],
              ['Operational Period To', 'operationalPeriodTo'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isEditing(editingSections, 'incident-info') ? (
                <input
                  type={field.includes('Period') ? 'datetime-local' : 'text'}
                  value={incidentInfo[field]}
                  onChange={(event) =>
                    onPatchDraft('incident-info', { ...incidentInfo, [field]: event.target.value })
                  }
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
        'command-staff',
        <PositionFields
          fields={ICS203_COMMAND_STAFF_FIELDS}
          values={commandStaff}
          editing={isEditing(editingSections, 'command-staff')}
          onChange={(field, value) =>
            onPatchDraft('command-staff', { ...commandStaff, [field]: value })
          }
        />
      )}

      {renderSectionShell(
        'agency-representatives',
        <div className="space-y-2">
          {agencyRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No agency representatives recorded.</p>
          ) : (
            agencyRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
              >
                {isEditing(editingSections, 'agency-representatives') ? (
                  <>
                    <input
                      value={row.agencyOrganization}
                      placeholder="Agency/Organization"
                      onChange={(event) =>
                        onPatchDraft(
                          'agency-representatives',
                          agencyRows.map((entry) =>
                            entry.id === row.id
                              ? { ...entry, agencyOrganization: event.target.value }
                              : entry
                          )
                        )
                      }
                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                    <input
                      value={row.representativeName}
                      placeholder="Representative Name"
                      onChange={(event) =>
                        onPatchDraft(
                          'agency-representatives',
                          agencyRows.map((entry) =>
                            entry.id === row.id
                              ? { ...entry, representativeName: event.target.value }
                              : entry
                          )
                        )
                      }
                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() =>
                        onPatchDraft(
                          'agency-representatives',
                          agencyRows.filter((entry) => entry.id !== row.id)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Ics202ReadOnlyField value={row.agencyOrganization} />
                    <Ics202ReadOnlyField value={row.representativeName} />
                    <span />
                  </>
                )}
              </div>
            ))
          )}
        </div>,
        isEditing(editingSections, 'agency-representatives') ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onPatchDraft('agency-representatives', [
                ...agencyRows,
                {
                  id: nextRowId(agencyRows),
                  agencyOrganization: '',
                  representativeName: '',
                },
              ])
            }
          >
            + Add Representative
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'planning-section',
        <div className="space-y-3">
          <PositionFields
            fields={ICS203_PLANNING_UNIT_FIELDS}
            values={planning as unknown as Record<string, string>}
            editing={isEditing(editingSections, 'planning-section')}
            onChange={(field, value) =>
              onPatchDraft('planning-section', { ...planning, [field]: value })
            }
          />
          <DivisionGroupTable
            rows={planning.planningDivisionGroups}
            editing={isEditing(editingSections, 'planning-section')}
            onChange={(rowId, field, value) =>
              onPatchDraft('planning-section', {
                ...planning,
                planningDivisionGroups: planning.planningDivisionGroups.map((row) =>
                  row.id === rowId ? { ...row, [field]: value } : row
                ),
              })
            }
            onAdd={() =>
              onPatchDraft('planning-section', {
                ...planning,
                planningDivisionGroups: [
                  ...planning.planningDivisionGroups,
                  { id: nextRowId(planning.planningDivisionGroups), identifier: '', supervisorName: '' },
                ],
              })
            }
            onDelete={(rowId) =>
              onPatchDraft('planning-section', {
                ...planning,
                planningDivisionGroups: planning.planningDivisionGroups.filter(
                  (row) => row.id !== rowId
                ),
              })
            }
          />
        </div>
      )}

      {renderSectionShell(
        'logistics-section',
        <div className="space-y-3">
          <PositionFields
            fields={ICS203_LOGISTICS_UNIT_FIELDS}
            values={logistics as unknown as Record<string, string>}
            editing={isEditing(editingSections, 'logistics-section')}
            onChange={(field, value) =>
              onPatchDraft('logistics-section', { ...logistics, [field]: value })
            }
          />
          <DivisionGroupTable
            rows={logistics.logisticsDivisionGroups}
            editing={isEditing(editingSections, 'logistics-section')}
            onChange={(rowId, field, value) =>
              onPatchDraft('logistics-section', {
                ...logistics,
                logisticsDivisionGroups: logistics.logisticsDivisionGroups.map((row) =>
                  row.id === rowId ? { ...row, [field]: value } : row
                ),
              })
            }
            onAdd={() =>
              onPatchDraft('logistics-section', {
                ...logistics,
                logisticsDivisionGroups: [
                  ...logistics.logisticsDivisionGroups,
                  {
                    id: nextRowId(logistics.logisticsDivisionGroups),
                    identifier: '',
                    supervisorName: '',
                  },
                ],
              })
            }
            onDelete={(rowId) =>
              onPatchDraft('logistics-section', {
                ...logistics,
                logisticsDivisionGroups: logistics.logisticsDivisionGroups.filter(
                  (row) => row.id !== rowId
                ),
              })
            }
          />
        </div>
      )}

      {renderSectionShell(
        'operations-section',
        <div className="space-y-3">
          <PositionFields
            fields={ICS203_OPERATIONS_TOP_FIELDS}
            values={operations as unknown as Record<string, string>}
            editing={isEditing(editingSections, 'operations-section')}
            onChange={(field, value) =>
              onPatchDraft('operations-section', { ...operations, [field]: value })
            }
          />
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground">Branches</p>
            {operations.operationsBranches.length === 0 ? (
              <p className="text-xs text-muted-foreground">No branches recorded.</p>
            ) : (
              operations.operationsBranches.map((branch) => (
                <div key={branch.id} className="space-y-2 rounded-md border border-dashed p-2">
                  {isEditing(editingSections, 'operations-section') ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() =>
                          onPatchDraft('operations-section', {
                            ...operations,
                            operationsBranches: operations.operationsBranches.filter(
                              (entry) => entry.id !== branch.id
                            ),
                          })
                        }
                      >
                        Remove Branch
                      </Button>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {(
                      [
                        ['Branch Director', 'branchDirector'],
                        ['Deputy', 'deputy'],
                      ] as const
                    ).map(([label, field]) => (
                      <div key={field} className="space-y-1">
                        <Ics202FieldLabel>{label}</Ics202FieldLabel>
                        {isEditing(editingSections, 'operations-section') ? (
                          <input
                            value={branch[field]}
                            onChange={(event) =>
                              onPatchDraft('operations-section', {
                                ...operations,
                                operationsBranches: operations.operationsBranches.map((entry) =>
                                  entry.id === branch.id
                                    ? { ...entry, [field]: event.target.value }
                                    : entry
                                ),
                              })
                            }
                            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          />
                        ) : (
                          <Ics202ReadOnlyField value={branch[field]} />
                        )}
                      </div>
                    ))}
                  </div>
                  <DivisionGroupTable
                    rows={branch.divisionGroups}
                    editing={isEditing(editingSections, 'operations-section')}
                    onChange={(rowId, field, value) =>
                      onPatchDraft('operations-section', {
                        ...operations,
                        operationsBranches: operations.operationsBranches.map((entry) =>
                          entry.id === branch.id
                            ? {
                                ...entry,
                                divisionGroups: entry.divisionGroups.map((row) =>
                                  row.id === rowId ? { ...row, [field]: value } : row
                                ),
                              }
                            : entry
                        ),
                      })
                    }
                    onAdd={() =>
                      onPatchDraft('operations-section', {
                        ...operations,
                        operationsBranches: operations.operationsBranches.map((entry) =>
                          entry.id === branch.id
                            ? {
                                ...entry,
                                divisionGroups: [
                                  ...entry.divisionGroups,
                                  {
                                    id: nextRowId(entry.divisionGroups),
                                    identifier: '',
                                    supervisorName: '',
                                  },
                                ],
                              }
                            : entry
                        ),
                      })
                    }
                    onDelete={(rowId) =>
                      onPatchDraft('operations-section', {
                        ...operations,
                        operationsBranches: operations.operationsBranches.map((entry) =>
                          entry.id === branch.id
                            ? {
                                ...entry,
                                divisionGroups: entry.divisionGroups.filter(
                                  (row) => row.id !== rowId
                                ),
                              }
                            : entry
                        ),
                      })
                    }
                  />
                </div>
              ))
            )}
            {isEditing(editingSections, 'operations-section') ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const newBranch: Ics203OperationsBranch = {
                    id: nextRowId(operations.operationsBranches),
                    branchDirector: '',
                    deputy: '',
                    divisionGroups: [],
                  }
                  onPatchDraft('operations-section', {
                    ...operations,
                    operationsBranches: [...operations.operationsBranches, newBranch],
                  })
                }}
              >
                + Add Branch
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {renderSectionShell(
        'finance-section',
        <PositionFields
          fields={ICS203_FINANCE_UNIT_FIELDS}
          values={finance}
          editing={isEditing(editingSections, 'finance-section')}
          onChange={(field, value) =>
            onPatchDraft('finance-section', { ...finance, [field]: value })
          }
        />
      )}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['Prepared By (Name)', 'preparedByName', 'text'],
              ['Position/Title', 'preparedByPositionTitle', 'text'],
              ['Signature', 'preparedBySignature', 'text'],
              ['Date/Time Prepared', 'preparedDateTime', 'datetime-local'],
            ] as const
          ).map(([label, field, inputType]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isEditing(editingSections, 'prepared-by') ? (
                <input
                  type={inputType}
                  value={preparedBy[field]}
                  onChange={(event) =>
                    onPatchDraft('prepared-by', { ...preparedBy, [field]: event.target.value })
                  }
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={preparedBy[field]} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
