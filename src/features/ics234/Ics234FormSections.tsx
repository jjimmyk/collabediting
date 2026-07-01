import { useState, type ReactNode } from 'react'
import { LayoutList, Pencil, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ICS234_SECTION_LABELS } from '@/features/ics234/constants'
import { Ics234WorkAnalysisMatrix } from '@/features/ics234/Ics234WorkAnalysisMatrix'
import { Ics234WorkAnalysisMatrixTable } from '@/features/ics234/Ics234WorkAnalysisMatrixTable'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202SectionEditActions,
} from '@/features/ics202/Ics202SectionToolbar'
import type {
  Ics234FormSectionDrafts,
  Ics234FormState,
  Ics234MatrixItemDraft,
  Ics234MatrixItemEditState,
  Ics234MatrixItemRef,
  Ics234SectionId,
} from '@/features/ics234/types'
import { extractIcs234SectionDraft } from '@/features/ics234/utils'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import { cn } from '@/lib/utils'

type Ics234FormSectionsProps = {
  form: Ics234FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics234SectionId, boolean>>
  drafts: Ics234FormSectionDrafts
  editingMatrixItem: Ics234MatrixItemEditState | null
  onStartSectionEdit: (section: Ics234SectionId) => void
  onCancelSectionEdit: (section: Ics234SectionId) => void
  onSaveSection: (section: Ics234SectionId) => void
  onGenerateSection: (section: Ics234SectionId) => void
  onPatchDraft: <S extends Ics234SectionId>(
    section: S,
    value: Ics234FormSectionDrafts[S]
  ) => void
  onStartMatrixItemEdit: (ref: Ics234MatrixItemRef) => void
  onCancelMatrixItemEdit: () => void
  onPatchMatrixItemDraft: (draft: Ics234MatrixItemDraft) => void
  onSaveMatrixItem: () => void
  onGenerateMatrixItem: (ref: Ics234MatrixItemRef) => void
  onAddMatrixObjective: () => void
  onAddMatrixStrategy: (objectiveId: number) => void
  onAddMatrixTactic: (objectiveId: number, strategyId: number) => void
  onDeleteMatrixObjective: (objectiveId: number) => void
  onDeleteMatrixStrategy: (objectiveId: number, strategyId: number) => void
  onDeleteMatrixTactic: (objectiveId: number, strategyId: number, tacticId: number) => void
}

function isEditing(
  editingSections: Partial<Record<Ics234SectionId, boolean>>,
  section: Ics234SectionId
) {
  return !!editingSections[section]
}

export function Ics234FormSections({
  form,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  editingSections,
  drafts,
  editingMatrixItem,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchDraft,
  onStartMatrixItemEdit,
  onCancelMatrixItemEdit,
  onPatchMatrixItemDraft,
  onSaveMatrixItem,
  onGenerateMatrixItem,
  onAddMatrixObjective,
  onAddMatrixStrategy,
  onAddMatrixTactic,
  onDeleteMatrixObjective,
  onDeleteMatrixStrategy,
  onDeleteMatrixTactic,
}: Ics234FormSectionsProps) {
  const [matrixViewMode, setMatrixViewMode] = useState<'list' | 'table'>('list')

  const getDraft = <S extends Ics234SectionId>(
    section: S
  ): NonNullable<Ics234FormSectionDrafts[S]> => {
    if (isEditing(editingSections, section) && drafts[section] !== undefined) {
      return drafts[section] as NonNullable<Ics234FormSectionDrafts[S]>
    }
    return extractIcs234SectionDraft(form, section) as NonNullable<Ics234FormSectionDrafts[S]>
  }

  const incidentInfo = getDraft('incident-info')
  const preparedBy = getDraft('prepared-by')

  const matrixProps = {
    objectives: form.objectives,
    canEdit,
    formIsLocked,
    isSaving,
    glassItemBorderClasses,
    editingItem: editingMatrixItem,
    onStartItemEdit: onStartMatrixItemEdit,
    onCancelItemEdit: onCancelMatrixItemEdit,
    onPatchItemDraft: onPatchMatrixItemDraft,
    onSaveItem: onSaveMatrixItem,
    onGenerateItem: onGenerateMatrixItem,
    onAddObjective: onAddMatrixObjective,
    onAddStrategy: onAddMatrixStrategy,
    onAddTactic: onAddMatrixTactic,
    onDeleteObjective: onDeleteMatrixObjective,
    onDeleteStrategy: onDeleteMatrixStrategy,
    onDeleteTactic: onDeleteMatrixTactic,
  }

  const matrixToolbar = (
    <ToggleGroup
      type="single"
      value={matrixViewMode}
      onValueChange={(next) => {
        if (next === 'list' || next === 'table') {
          setMatrixViewMode(next)
        }
      }}
      variant="outline"
      size="sm"
      aria-label="Matrix view"
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
  )

  const renderSectionShell = (
    section: Ics234SectionId,
    content: ReactNode,
    options?: { hideSectionEdit?: boolean; extraActions?: ReactNode }
  ) => {
    const editing = isEditing(editingSections, section)
    const hideSectionEdit = options?.hideSectionEdit ?? false
    return (
      <Item
        variant="outline"
        className={cn(
          'min-w-0 max-w-full flex-nowrap flex-col items-stretch overflow-hidden p-0',
          glassItemBorderClasses
        )}
      >
        <div className="min-w-0 w-full max-w-full space-y-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">{ICS234_SECTION_LABELS[section]}</p>
            <div className="flex min-w-0 shrink flex-wrap items-center justify-end gap-2">
              {options?.extraActions}
              {canEdit && !formIsLocked && !editing && !hideSectionEdit ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => onStartSectionEdit(section)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing && !hideSectionEdit}
            ariaLabel={`Edit ${ICS234_SECTION_LABELS[section].toLowerCase()}`}
            onStartEdit={() => onStartSectionEdit(section)}
          >
            {content}
          </IcsEditableSectionContent>
          {!hideSectionEdit ? (
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
    <div className="min-w-0 w-full max-w-full space-y-3">
      {renderSectionShell(
        'incident-info',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['Incident Name', 'incidentName', 'text'],
              ['Incident Location', 'incidentLocation', 'text'],
              ['Operational Period From', 'operationalPeriodFrom', 'datetime-local'],
              ['Operational Period To', 'operationalPeriodTo', 'datetime-local'],
            ] as const
          ).map(([label, field, inputType]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isEditing(editingSections, 'incident-info') ? (
                <input
                  type={inputType}
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
        'work-analysis-matrix',
        matrixViewMode === 'table' ? (
          <Ics234WorkAnalysisMatrixTable {...matrixProps} />
        ) : (
          <Ics234WorkAnalysisMatrix {...matrixProps} />
        ),
        { hideSectionEdit: true, extraActions: matrixToolbar }
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
