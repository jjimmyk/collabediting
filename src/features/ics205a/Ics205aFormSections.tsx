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
import { ICS205A_SECTION_LABELS } from '@/features/ics205a/constants'
import type {
  Ics205aContactRow,
  Ics205aFormSectionDrafts,
  Ics205aFormState,
  Ics205aIncidentInfoDraft,
  Ics205aSectionId,
} from '@/features/ics205a/types'
import {
  extractIcs205aIncidentInfoDraft,
  extractIcs205aPreparedByDraft,
} from '@/features/ics205a/utils'
import { cn } from '@/lib/utils'

type Ics205aFormSectionsProps = {
  form: Ics205aFormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics205aSectionId, boolean>>
  drafts: Ics205aFormSectionDrafts
  onStartSectionEdit: (section: Ics205aSectionId) => void
  onCancelSectionEdit: (section: Ics205aSectionId) => void
  onSaveSection: (section: Ics205aSectionId) => void
  onGenerateSection: (section: Ics205aSectionId) => void
  onPatchDraft: <S extends Ics205aSectionId>(
    section: S,
    value: Ics205aFormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics205aSectionId, boolean>>,
  section: Ics205aSectionId
) {
  return !!editingSections[section]
}

export function Ics205aFormSections({
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
}: Ics205aFormSectionsProps) {
  const [expandedContactKey, setExpandedContactKey] = useState<string | null>(null)

  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs205aIncidentInfoDraft(form)
  const contactRows =
    isSectionEditing(editingSections, 'local-communications-info') && drafts['local-communications-info']
      ? drafts['local-communications-info']
      : form.contactRows
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs205aPreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics205aIncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchContactRow = (
    rowId: number,
    field: keyof Ics205aContactRow,
    value: string
  ) => {
    onPatchDraft(
      'local-communications-info',
      contactRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addContactRow = () => {
    onPatchDraft('local-communications-info', [
      ...contactRows,
      {
        id:
          contactRows.length === 0
            ? 1
            : Math.max(...contactRows.map((row) => row.id)) + 1,
        assignedPosition: '',
        name: '',
        contactMethods: '',
      },
    ])
  }

  const deleteContactRow = (rowId: number) => {
    onPatchDraft(
      'local-communications-info',
      contactRows.filter((row) => row.id !== rowId)
    )
  }

  const renderSectionShell = (
    section: Ics205aSectionId,
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
              title={ICS205A_SECTION_LABELS[section]}
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

  const contactSummary = (row: Ics205aContactRow) =>
    [row.assignedPosition, row.name, row.contactMethods].filter(Boolean).join(' · ') ||
    'No contact details'

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
        'local-communications-info',
        <div className="space-y-2">
          {contactRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No contacts recorded.</p>
          ) : (
            contactRows.map((row, index) => {
              const contactKey = `${form.id}-${row.id}`
              const isOpen = expandedContactKey === contactKey
              const editingContacts = isSectionEditing(editingSections, 'local-communications-info')
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
                    open={isOpen}
                    onOpenChange={(open) => setExpandedContactKey(open ? contactKey : null)}
                  >
                    <div className="relative px-3 py-2.5 pr-12">
                      <ItemContent className="min-w-0">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Contact {index + 1}
                          {row.assignedPosition.trim() ? ` · ${row.assignedPosition}` : ''}
                        </p>
                        {editingContacts ? (
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <input
                              value={row.assignedPosition}
                              onChange={(event) =>
                                patchContactRow(row.id, 'assignedPosition', event.target.value)
                              }
                              placeholder="Incident Assigned Position"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={row.name}
                              onChange={(event) =>
                                patchContactRow(row.id, 'name', event.target.value)
                              }
                              placeholder="Name"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={row.contactMethods}
                              onChange={(event) =>
                                patchContactRow(row.id, 'contactMethods', event.target.value)
                              }
                              placeholder="Methods of Contact"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          </div>
                        ) : (
                          <Ics202ReadOnlyField value={contactSummary(row)} />
                        )}
                      </ItemContent>
                      <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
                        {editingContacts ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete contact"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteContactRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Toggle contact details"
                            >
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  isOpen && 'rotate-180'
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
                          <Ics202FieldLabel>Incident Assigned Position</Ics202FieldLabel>
                          {editingContacts ? (
                            <input
                              value={row.assignedPosition}
                              onChange={(event) =>
                                patchContactRow(row.id, 'assignedPosition', event.target.value)
                              }
                              className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          ) : (
                            <Ics202ReadOnlyField value={row.assignedPosition} />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Ics202FieldLabel>Name</Ics202FieldLabel>
                          {editingContacts ? (
                            <input
                              value={row.name}
                              onChange={(event) =>
                                patchContactRow(row.id, 'name', event.target.value)
                              }
                              className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          ) : (
                            <Ics202ReadOnlyField value={row.name} />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Ics202FieldLabel>
                            Methods of Contact (phone, pager, cell, radio, etc.)
                          </Ics202FieldLabel>
                          {editingContacts ? (
                            <Textarea
                              value={row.contactMethods}
                              onChange={(event) =>
                                patchContactRow(row.id, 'contactMethods', event.target.value)
                              }
                              className="min-h-12 text-xs"
                              placeholder="Phone, pager, cell, radio, etc."
                            />
                          ) : (
                            <Ics202ReadOnlyTextBlock value={row.contactMethods} />
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Item>
              )
            })
          )}
        </div>,
        isSectionEditing(editingSections, 'local-communications-info') ? (
          <Button type="button" size="sm" variant="outline" onClick={addContactRow}>
            + Add Contact
          </Button>
        ) : null
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
