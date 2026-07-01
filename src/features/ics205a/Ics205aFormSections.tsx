import { useState, type ReactNode } from 'react'
import { LayoutList, Sparkles, Table2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import { Ics205aContactRowsList } from '@/features/ics205a/Ics205aContactRowsList'
import { Ics205aContactRowsTable } from '@/features/ics205a/Ics205aContactRowsTable'
import { buildIcs205aContactsFromNextOpRoster } from '@/features/ics205a/build-ics205a-contacts-from-roster'
import type { Ics205aContactRowOptionsInput } from '@/features/ics205a/ics205a-contact-row-options'
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
  contactRowOptionsInput: Ics205aContactRowOptionsInput
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
  contactRowOptionsInput,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
}: Ics205aFormSectionsProps) {
  const [contactsViewMode, setContactsViewMode] = useState<'list' | 'table'>('list')

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

  const patchContactRow = (rowId: number, patch: Partial<Ics205aContactRow>) => {
    onPatchDraft(
      'local-communications-info',
      contactRows.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
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
        cellPhone: '',
        radioFrequency: '',
        other: '',
      },
    ])
  }

  const deleteContactRow = (rowId: number) => {
    onPatchDraft(
      'local-communications-info',
      contactRows.filter((row) => row.id !== rowId)
    )
  }

  const fillContactsFromRoster = () => {
    if (!contactRowOptionsInput.catalog) {
      toast.warning('Roster data is not available for this workspace.')
      return
    }

    const assets = Object.values(contactRowOptionsInput.assetsByKey ?? {})
    const rows = buildIcs205aContactsFromNextOpRoster({
      catalog: contactRowOptionsInput.catalog,
      positionEntries: contactRowOptionsInput.positionEntries,
      roster: contactRowOptionsInput.roster,
      assets,
    })

    onPatchDraft('local-communications-info', rows)

    if (rows.length === 0) {
      toast.warning('No next operational period roster entries to fill.')
      return
    }

    toast.success(`Filled ${rows.length} contact${rows.length === 1 ? '' : 's'} from next OP roster.`)
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
        <div className="min-w-0 max-w-full space-y-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
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
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing}
            ariaLabel={`Edit ${ICS205A_SECTION_LABELS[section].toLowerCase()}`}
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

  const editingContacts = isSectionEditing(editingSections, 'local-communications-info')

  const contactsToolbar = (
    <div className="flex min-w-0 shrink flex-wrap items-center justify-end gap-2">
      {editingContacts ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={fillContactsFromRoster}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Fill From Roster
        </Button>
      ) : null}
      <ToggleGroup
        type="single"
        value={contactsViewMode}
        onValueChange={(next) => {
          if (next === 'list' || next === 'table') {
            setContactsViewMode(next)
          }
        }}
        variant="outline"
        size="sm"
        aria-label="Contacts view"
      >
        <ToggleGroupItem value="list" className="gap-1 px-2.5 text-xs">
          <LayoutList className="h-3.5 w-3.5" />
          List view
        </ToggleGroupItem>
        <ToggleGroupItem value="table" className="gap-1 px-2.5 text-xs">
          <Table2 className="h-3.5 w-3.5" />
          Table view
        </ToggleGroupItem>
      </ToggleGroup>
      {editingContacts ? (
        <Button type="button" size="sm" variant="outline" onClick={addContactRow}>
          + Add Contact
        </Button>
      ) : null}
    </div>
  )

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
        <div className="min-w-0 max-w-full overflow-hidden">
          {contactsViewMode === 'table' ? (
            <Ics205aContactRowsTable
              formId={form.id}
              contactRows={contactRows}
              editingContacts={editingContacts}
              optionsInput={contactRowOptionsInput}
              onPatchRow={patchContactRow}
              onDeleteRow={deleteContactRow}
            />
          ) : (
            <Ics205aContactRowsList
              formId={form.id}
              contactRows={contactRows}
              editingContacts={editingContacts}
              glassItemBorderClasses={glassItemBorderClasses}
              optionsInput={contactRowOptionsInput}
              onPatchRow={patchContactRow}
              onDeleteRow={deleteContactRow}
            />
          )}
        </div>,
        contactsToolbar
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
