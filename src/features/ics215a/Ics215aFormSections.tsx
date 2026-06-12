import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { ICS215A_RISK_GAIN_LEVELS, ICS215A_SECTION_LABELS } from '@/features/ics215a/constants'
import type {
  Ics215aFormSectionDrafts,
  Ics215aFormState,
  Ics215aIncidentInfoDraft,
  Ics215aOperationalPeriodDraft,
  Ics215aRiskGainLevel,
  Ics215aSafetyAnalysisRow,
  Ics215aSectionId,
} from '@/features/ics215a/types'
import {
  extractIcs215aIncidentInfoDraft,
  extractIcs215aOperationalPeriodDraft,
  extractIcs215aPreparedByDraft,
  formatIcs215aRiskGain,
} from '@/features/ics215a/utils'
import { cn } from '@/lib/utils'

type Ics215aFormSectionsProps = {
  form: Ics215aFormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics215aSectionId, boolean>>
  drafts: Ics215aFormSectionDrafts
  onStartSectionEdit: (section: Ics215aSectionId) => void
  onCancelSectionEdit: (section: Ics215aSectionId) => void
  onSaveSection: (section: Ics215aSectionId) => void
  onGenerateSection: (section: Ics215aSectionId) => void
  onPatchDraft: <S extends Ics215aSectionId>(
    section: S,
    value: Ics215aFormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics215aSectionId, boolean>>,
  section: Ics215aSectionId
) {
  return !!editingSections[section]
}

export function Ics215aFormSections({
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
}: Ics215aFormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs215aIncidentInfoDraft(form)
  const operationalPeriod =
    isSectionEditing(editingSections, 'operational-period') && drafts['operational-period']
      ? drafts['operational-period']
      : extractIcs215aOperationalPeriodDraft(form)
  const safetyAnalysisRows =
    isSectionEditing(editingSections, 'safety-analysis') && drafts['safety-analysis']
      ? drafts['safety-analysis']
      : form.safetyAnalysisRows
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs215aPreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics215aIncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchOperationalPeriod = (patch: Partial<Ics215aOperationalPeriodDraft>) => {
    onPatchDraft('operational-period', { ...operationalPeriod, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchSafetyRow = (
    rowId: number,
    field: keyof Ics215aSafetyAnalysisRow,
    value: string
  ) => {
    onPatchDraft(
      'safety-analysis',
      safetyAnalysisRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]:
                field === 'riskLevel' || field === 'gainLevel'
                  ? (value as Ics215aRiskGainLevel)
                  : value,
            }
          : row
      )
    )
  }

  const addSafetyRow = () => {
    onPatchDraft('safety-analysis', [
      ...safetyAnalysisRows,
      {
        id:
          safetyAnalysisRows.length === 0
            ? 1
            : Math.max(...safetyAnalysisRows.map((row) => row.id)) + 1,
        incidentArea: '',
        hazardsRisks: '',
        mitigations: '',
        riskLevel: '',
        gainLevel: '',
      },
    ])
  }

  const deleteSafetyRow = (rowId: number) => {
    onPatchDraft(
      'safety-analysis',
      safetyAnalysisRows.filter((row) => row.id !== rowId)
    )
  }

  const renderSectionShell = (
    section: Ics215aSectionId,
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
              title={ICS215A_SECTION_LABELS[section]}
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

  const editingSafety = isSectionEditing(editingSections, 'safety-analysis')

  return (
    <div className="space-y-3">
      {renderSectionShell(
        'incident-info',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1 xl:col-span-2">
            <Ics202FieldLabel>1. Incident Name</Ics202FieldLabel>
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
          <div className="space-y-1 xl:col-span-2">
            <Ics202FieldLabel>2. Incident Location</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'incident-info') ? (
              <input
                value={incidentInfo.incidentLocation}
                onChange={(event) => patchIncidentInfo({ incidentLocation: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.incidentLocation} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>3. Date Prepared</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'incident-info') ? (
              <input
                type="date"
                value={incidentInfo.preparedDate}
                onChange={(event) => patchIncidentInfo({ preparedDate: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.preparedDate} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>3. Time Prepared (24-hour)</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'incident-info') ? (
              <input
                type="time"
                value={incidentInfo.preparedTime}
                onChange={(event) => patchIncidentInfo({ preparedTime: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.preparedTime} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'operational-period',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['Date From', 'operationalPeriodDateFrom', 'date'],
              ['Date To', 'operationalPeriodDateTo', 'date'],
              ['Time From', 'operationalPeriodTimeFrom', 'time'],
              ['Time To', 'operationalPeriodTimeTo', 'time'],
            ] as const
          ).map(([label, field, inputType]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>4. {label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'operational-period') ? (
                <input
                  type={inputType}
                  value={operationalPeriod[field]}
                  onChange={(event) => patchOperationalPeriod({ [field]: event.target.value })}
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={operationalPeriod[field]} />
              )}
            </div>
          ))}
        </div>
      )}

      {renderSectionShell(
        'safety-analysis',
        <div className="space-y-2">
          {safetyAnalysisRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No safety analysis rows.</p>
          ) : (
            <>
              <div className="hidden text-[11px] font-semibold text-muted-foreground xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_5rem_5rem_auto] xl:gap-2">
                <span>5. Incident Area</span>
                <span>6. Hazards/Risks</span>
                <span>7. Mitigations</span>
                <span>Risk</span>
                <span>Gain</span>
                <span />
              </div>
              {safetyAnalysisRows.map((row, index) => (
                <div
                  key={row.id}
                  className="space-y-2 rounded-md border p-2 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_5rem_5rem_auto] xl:items-start xl:gap-2 xl:space-y-0"
                >
                  <p className="text-[11px] font-semibold text-muted-foreground xl:hidden">
                    Row {index + 1}
                  </p>
                  {(
                    [
                      ['5. Incident Area', 'incidentArea', false],
                      ['6. Hazards/Risks', 'hazardsRisks', true],
                      ['7. Mitigations', 'mitigations', true],
                    ] as const
                  ).map(([label, field, multiline]) => (
                    <div key={field} className="space-y-1">
                      <Ics202FieldLabel>{label}</Ics202FieldLabel>
                      {editingSafety ? (
                        multiline ? (
                          <Textarea
                            value={row[field]}
                            onChange={(event) => patchSafetyRow(row.id, field, event.target.value)}
                            className="min-h-12 text-xs"
                          />
                        ) : (
                          <input
                            value={row[field]}
                            onChange={(event) => patchSafetyRow(row.id, field, event.target.value)}
                            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                          />
                        )
                      ) : multiline ? (
                        <Ics202ReadOnlyTextBlock value={row[field]} />
                      ) : (
                        <Ics202ReadOnlyField value={row[field]} />
                      )}
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Ics202FieldLabel>8. Risk</Ics202FieldLabel>
                    {editingSafety ? (
                      <select
                        value={row.riskLevel}
                        onChange={(event) =>
                          patchSafetyRow(row.id, 'riskLevel', event.target.value)
                        }
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      >
                        <option value="">—</option>
                        {ICS215A_RISK_GAIN_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Ics202ReadOnlyField value={row.riskLevel} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Ics202FieldLabel>8. Gain</Ics202FieldLabel>
                    {editingSafety ? (
                      <select
                        value={row.gainLevel}
                        onChange={(event) =>
                          patchSafetyRow(row.id, 'gainLevel', event.target.value)
                        }
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      >
                        <option value="">—</option>
                        {ICS215A_RISK_GAIN_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Ics202ReadOnlyField value={row.gainLevel} />
                    )}
                  </div>
                  <div className="flex items-end justify-end xl:pb-1">
                    {editingSafety ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Delete safety analysis row"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteSafetyRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Ics202ReadOnlyField value={formatIcs215aRiskGain(row)} />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>,
        editingSafety ? (
          <Button type="button" size="sm" variant="outline" onClick={addSafetyRow}>
            + Add Row
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'prepared-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>9. Prepared By (Name)</Ics202FieldLabel>
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
