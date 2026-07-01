import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import {
  Ics214FieldLabel,
  Ics214ReadOnlyField,
  Ics214SectionEditActions,
  Ics214SectionHeader,
} from '@/features/ics214/Ics214SectionToolbar'
import { Ics214ActivityLogTable } from '@/features/ics214/Ics214ActivityLogTable'
import type {
  Ics214ActivityLogRow,
  Ics214FormSectionDrafts,
  Ics214FormState,
  Ics214IncidentInfoDraft,
  Ics214SectionId,
} from '@/features/ics214/types'
import {
  extractIcs214IncidentInfoDraft,
  extractIcs214PreparedByDraft,
} from '@/features/ics214/utils'
import { ICS214_SECTION_LABELS } from '@/features/ics214/constants'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import { cn } from '@/lib/utils'

type Ics214FormSectionsProps = {
  form: Ics214FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics214SectionId, boolean>>
  drafts: Ics214FormSectionDrafts
  onStartSectionEdit: (section: Ics214SectionId) => void
  onCancelSectionEdit: (section: Ics214SectionId) => void
  onSaveSection: (section: Ics214SectionId) => void
  onGenerateSection: (section: Ics214SectionId) => void
  onPatchDraft: <S extends Ics214SectionId>(
    section: S,
    value: Ics214FormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics214SectionId, boolean>>,
  section: Ics214SectionId
) {
  return !!editingSections[section]
}

export function Ics214FormSections({
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
}: Ics214FormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs214IncidentInfoDraft(form)
  const entries =
    isSectionEditing(editingSections, 'activity-log') && drafts['activity-log']
      ? drafts['activity-log']
      : form.entries
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs214PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics214IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchActivityRow = (rowId: number, field: keyof Ics214ActivityLogRow, value: string) => {
    onPatchDraft(
      'activity-log',
      entries.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addActivityRow = () => {
    onPatchDraft('activity-log', [
      ...entries,
      {
        id: entries.length === 0 ? 1 : Math.max(...entries.map((row) => row.id)) + 1,
        completedBy: '',
        completedAt: '',
        notableActivities: '',
      },
    ])
  }

  const deleteActivityRow = (rowId: number) => {
    onPatchDraft(
      'activity-log',
      entries.filter((row) => row.id !== rowId)
    )
  }

  const renderSectionShell = (
    section: Ics214SectionId,
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
            <Ics214SectionHeader
              sectionId={section}
              isEditing={editing}
              canEdit={canEdit}
              disabled={formIsLocked}
              onStartEdit={() => onStartSectionEdit(section)}
            />
            {extraActions}
          </div>
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing}
            ariaLabel={`Edit ${ICS214_SECTION_LABELS[section].toLowerCase()}`}
            onStartEdit={() => onStartSectionEdit(section)}
          >
            {content}
          </IcsEditableSectionContent>
          <Ics214SectionEditActions
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
              ['Incident Name', 'incidentName', 'text'],
              ['Unit Name', 'unitName', 'text'],
              ['Operational Period From', 'operationalPeriodFrom', 'datetime-local'],
              ['Operational Period To', 'operationalPeriodTo', 'datetime-local'],
              ['Date of Activity', 'dateOfActivity', 'date'],
            ] as const
          ).map(([label, field, inputType]) => (
            <div key={field} className="space-y-1">
              <Ics214FieldLabel>{label}</Ics214FieldLabel>
              {isSectionEditing(editingSections, 'incident-info') ? (
                <input
                  type={inputType}
                  value={incidentInfo[field]}
                  onChange={(event) => patchIncidentInfo({ [field]: event.target.value })}
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics214ReadOnlyField value={incidentInfo[field]} />
              )}
            </div>
          ))}
        </div>
      )}

      {renderSectionShell(
        'activity-log',
        <Ics214ActivityLogTable
          entries={entries}
          isEditing={isSectionEditing(editingSections, 'activity-log')}
          showFilters={!isSectionEditing(editingSections, 'activity-log')}
          onPatchRow={patchActivityRow}
          onDeleteRow={deleteActivityRow}
        />,
        isSectionEditing(editingSections, 'activity-log') ? (
          <Button type="button" size="sm" variant="outline" onClick={addActivityRow}>
            + Add Entry
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics214FieldLabel>Prepared By</Ics214FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                value={preparedBy.preparedByName}
                onChange={(event) => patchPreparedBy({ preparedByName: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics214ReadOnlyField value={preparedBy.preparedByName} />
            )}
          </div>
          <div className="space-y-1">
            <Ics214FieldLabel>Date/Time Prepared</Ics214FieldLabel>
            {isSectionEditing(editingSections, 'prepared-by') ? (
              <input
                type="datetime-local"
                value={preparedBy.preparedDateTime}
                onChange={(event) => patchPreparedBy({ preparedDateTime: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics214ReadOnlyField value={preparedBy.preparedDateTime} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
