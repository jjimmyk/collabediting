import type { ReactNode } from 'react'
import { Check, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Item } from '@/components/ui/item'
import {
  IapFieldLabel,
  IapReadOnlyField,
  IapSectionEditActions,
  IapSectionHeader,
} from '@/features/iap/IapSectionToolbar'
import type {
  IapChecklistFormId,
  IapCoverSheetDraft,
  IapFormChecklistItem,
  IapFormSectionDrafts,
  IapFormState,
  IapIncidentCommanderRow,
  IapSectionId,
} from '@/features/iap/types'
import {
  cloneIapFormsChecklist,
  cloneIapIncidentCommanderRows,
  extractIapCoverSheetDraft,
  nextIapRowId,
} from '@/features/iap/utils'
import { isIapChecklistFormLinkable } from '@/lib/iap-operational-period-links'
import { cn } from '@/lib/utils'

type IapFormSectionsProps = {
  form: IapFormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<IapSectionId, boolean>>
  drafts: IapFormSectionDrafts
  onStartSectionEdit: (section: IapSectionId) => void
  onCancelSectionEdit: (section: IapSectionId) => void
  onSaveSection: (section: IapSectionId) => void
  onPatchDraft: <S extends IapSectionId>(
    section: S,
    value: IapFormSectionDrafts[S]
  ) => void
  onSignIncidentCommander: (rowId: number) => void
  checklistLinksEnabled?: boolean
  onOpenChecklistForm?: (formId: IapChecklistFormId) => void
}

function isSectionEditing(
  editingSections: Partial<Record<IapSectionId, boolean>>,
  section: IapSectionId
) {
  return !!editingSections[section]
}

export function IapFormSections({
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
  onPatchDraft,
  onSignIncidentCommander,
  checklistLinksEnabled = false,
  onOpenChecklistForm,
}: IapFormSectionsProps) {
  const coverSheet =
    isSectionEditing(editingSections, 'cover-sheet') && drafts['cover-sheet']
      ? drafts['cover-sheet']
      : extractIapCoverSheetDraft(form)
  const incidentCommanders =
    isSectionEditing(editingSections, 'incident-commanders') && drafts['incident-commanders']
      ? drafts['incident-commanders']
      : form.incidentCommanders
  const formsChecklist =
    isSectionEditing(editingSections, 'forms-checklist') && drafts['forms-checklist']
      ? drafts['forms-checklist']
      : form.formsChecklist

  const patchCoverSheet = (patch: Partial<IapCoverSheetDraft>) => {
    onPatchDraft('cover-sheet', { ...coverSheet, ...patch })
  }

  const patchCommanderRow = (
    rowId: number,
    field: keyof IapIncidentCommanderRow,
    value: string
  ) => {
    onPatchDraft(
      'incident-commanders',
      incidentCommanders.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addCommanderRow = () => {
    onPatchDraft('incident-commanders', [
      ...incidentCommanders,
      {
        id: nextIapRowId(incidentCommanders),
        organization: '',
        name: '',
        signedAt: null,
      },
    ])
  }

  const deleteCommanderRow = (rowId: number) => {
    onPatchDraft(
      'incident-commanders',
      incidentCommanders.filter((row) => row.id !== rowId)
    )
  }

  const patchChecklistItem = (id: IapFormChecklistItem['id'], patch: Partial<IapFormChecklistItem>) => {
    onPatchDraft(
      'forms-checklist',
      formsChecklist.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const renderSectionShell = (section: IapSectionId, content: ReactNode) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <IapSectionHeader
            sectionId={section}
            isEditing={editing}
            canEdit={canEdit}
            disabled={formIsLocked}
            onStartEdit={() => onStartSectionEdit(section)}
          />
          {content}
          <IapSectionEditActions
            isEditing={editing}
            isSaving={isSaving}
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
        'cover-sheet',
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
              <IapFieldLabel>{label}</IapFieldLabel>
              {isSectionEditing(editingSections, 'cover-sheet') ? (
                <input
                  type={field.includes('Period') ? 'datetime-local' : 'text'}
                  value={coverSheet[field]}
                  onChange={(event) => patchCoverSheet({ [field]: event.target.value })}
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <IapReadOnlyField value={coverSheet[field]} />
              )}
            </div>
          ))}
        </div>
      )}

      {renderSectionShell(
        'incident-commanders',
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>Organization</span>
            <span>Name</span>
            <span>Signature</span>
            <span />
          </div>
          {incidentCommanders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No incident commanders recorded.</p>
          ) : (
            incidentCommanders.map((row) => {
              const isSigned = row.signedAt !== null
              const editingCommanders = isSectionEditing(editingSections, 'incident-commanders')
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem_auto] items-start gap-2"
                >
                  {editingCommanders ? (
                    <>
                      <input
                        value={row.organization}
                        onChange={(event) =>
                          patchCommanderRow(row.id, 'organization', event.target.value)
                        }
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                        placeholder="Organization"
                      />
                      <input
                        value={row.name}
                        onChange={(event) => patchCommanderRow(row.id, 'name', event.target.value)}
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                        placeholder="Name"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-[10px]"
                        disabled={!canEdit || formIsLocked || isSigned || row.name.trim().length === 0}
                        onClick={() => onSignIncidentCommander(row.id)}
                      >
                        <Check className="h-3 w-3" />
                        Sign
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => deleteCommanderRow(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <IapReadOnlyField value={row.organization} />
                      <IapReadOnlyField value={row.name} />
                      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs">
                        {isSigned ? (
                          <span className="font-serif italic">{row.name || 'Signed'}</span>
                        ) : (
                          <span className="text-muted-foreground">Not signed</span>
                        )}
                      </div>
                      {!formIsLocked && canEdit && !isSigned && row.name.trim().length > 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-[10px]"
                          onClick={() => onSignIncidentCommander(row.id)}
                        >
                          <Check className="h-3 w-3" />
                          Sign
                        </Button>
                      ) : (
                        <span />
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
          {isSectionEditing(editingSections, 'incident-commanders') && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={addCommanderRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Add commander
            </Button>
          )}
        </div>
      )}

      {renderSectionShell(
        'forms-checklist',
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            The items checked below are included in this Incident Action Plan export.
            {checklistLinksEnabled
              ? ' Open linked forms to view the operational period snapshot used for this IAP.'
              : null}
          </p>
          {formsChecklist.map((item) => {
            const isOther = item.id.startsWith('other-')
            const editingChecklist = isSectionEditing(editingSections, 'forms-checklist')
            const canOpenForm =
              checklistLinksEnabled &&
              !editingChecklist &&
              isIapChecklistFormLinkable(item.id) &&
              !!onOpenChecklistForm
            return (
              <div key={item.id} className="flex items-start gap-2 rounded-md border px-2 py-2">
                {editingChecklist ? (
                  <>
                    <Checkbox
                      checked={item.included}
                      onCheckedChange={(checked) =>
                        patchChecklistItem(item.id, { included: checked === true })
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-medium">{item.label}</p>
                      {isOther ? (
                        <input
                          value={item.customLabel ?? ''}
                          onChange={(event) =>
                            patchChecklistItem(item.id, { customLabel: event.target.value })
                          }
                          placeholder="Describe attachment"
                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                        />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="mt-0.5 text-xs">{item.included ? '☑' : '☐'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">
                        {isOther && item.customLabel?.trim()
                          ? item.customLabel.trim()
                          : item.label}
                      </p>
                    </div>
                    {canOpenForm ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 gap-1 text-[10px]"
                        onClick={() => onOpenChecklistForm(item.id)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open form
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            )
          })}
          {!isSectionEditing(editingSections, 'forms-checklist') && (
            <p className="text-[11px] text-muted-foreground">
              Selected forms are appended after the cover sheet when you export the IAP.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
