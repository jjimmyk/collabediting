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
import { ICS205_SECTION_LABELS } from '@/features/ics205/constants'
import type {
  Ics205FormSectionDrafts,
  Ics205FormState,
  Ics205IncidentInfoDraft,
  Ics205RadioChannelRow,
  Ics205RadioMode,
  Ics205SectionId,
} from '@/features/ics205/types'
import {
  extractIcs205IncidentInfoDraft,
  extractIcs205PreparedByDraft,
} from '@/features/ics205/utils'
import { cn } from '@/lib/utils'

type Ics205FormSectionsProps = {
  form: Ics205FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics205SectionId, boolean>>
  drafts: Ics205FormSectionDrafts
  onStartSectionEdit: (section: Ics205SectionId) => void
  onCancelSectionEdit: (section: Ics205SectionId) => void
  onSaveSection: (section: Ics205SectionId) => void
  onGenerateSection: (section: Ics205SectionId) => void
  onPatchDraft: <S extends Ics205SectionId>(
    section: S,
    value: Ics205FormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics205SectionId, boolean>>,
  section: Ics205SectionId
) {
  return !!editingSections[section]
}

export function Ics205FormSections({
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
}: Ics205FormSectionsProps) {
  const [expandedChannelKey, setExpandedChannelKey] = useState<string | null>(null)

  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs205IncidentInfoDraft(form)
  const radioChannels =
    isSectionEditing(editingSections, 'basic-radio-channels') && drafts['basic-radio-channels']
      ? drafts['basic-radio-channels']
      : form.radioChannels
  const specialInstructions =
    isSectionEditing(editingSections, 'special-instructions') &&
    drafts['special-instructions'] !== undefined
      ? drafts['special-instructions']
      : form.specialInstructions
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs205PreparedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics205IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchPreparedBy = (patch: Partial<typeof preparedBy>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchRadioChannel = (
    rowId: number,
    field: keyof Ics205RadioChannelRow,
    value: string
  ) => {
    onPatchDraft(
      'basic-radio-channels',
      radioChannels.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    )
  }

  const addRadioChannel = () => {
    onPatchDraft('basic-radio-channels', [
      ...radioChannels,
      {
        id:
          radioChannels.length === 0
            ? 1
            : Math.max(...radioChannels.map((row) => row.id)) + 1,
        zone: '',
        group: '',
        channelNumber: '',
        function: '',
        channelNameTalkgroup: '',
        assignment: '',
        rxFreq: '',
        rxNw: '',
        rxToneNac: '',
        txFreq: '',
        txNw: '',
        txToneNac: '',
        mode: '',
        remarks: '',
      },
    ])
  }

  const deleteRadioChannel = (rowId: number) => {
    onPatchDraft(
      'basic-radio-channels',
      radioChannels.filter((row) => row.id !== rowId)
    )
  }

  const renderSectionShell = (
    section: Ics205SectionId,
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
              title={ICS205_SECTION_LABELS[section]}
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

  const channelSummary = (row: Ics205RadioChannelRow) =>
    [row.function, row.channelNameTalkgroup, row.assignment].filter(Boolean).join(' · ') ||
    'No channel details'

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
              ['Date Prepared', 'preparedDate', 'date'],
              ['Time Prepared', 'preparedTime', 'time'],
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
        'basic-radio-channels',
        <div className="space-y-2">
          {radioChannels.length === 0 ? (
            <p className="text-xs text-muted-foreground">No radio channels.</p>
          ) : (
            radioChannels.map((row, index) => {
              const channelKey = `${form.id}-${row.id}`
              const isOpen = expandedChannelKey === channelKey
              const editingChannels = isSectionEditing(editingSections, 'basic-radio-channels')
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
                    onOpenChange={(open) => setExpandedChannelKey(open ? channelKey : null)}
                  >
                    <div className="relative px-3 py-2.5 pr-12">
                      <ItemContent className="min-w-0">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Channel {index + 1}
                          {row.channelNumber.trim() ? ` · Ch ${row.channelNumber}` : ''}
                        </p>
                        {editingChannels ? (
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            <input
                              value={row.zone}
                              onChange={(event) =>
                                patchRadioChannel(row.id, 'zone', event.target.value)
                              }
                              placeholder="Zone"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={row.group}
                              onChange={(event) =>
                                patchRadioChannel(row.id, 'group', event.target.value)
                              }
                              placeholder="Grp."
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={row.channelNumber}
                              onChange={(event) =>
                                patchRadioChannel(row.id, 'channelNumber', event.target.value)
                              }
                              placeholder="Ch #"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={row.function}
                              onChange={(event) =>
                                patchRadioChannel(row.id, 'function', event.target.value)
                              }
                              placeholder="Function"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          </div>
                        ) : (
                          <Ics202ReadOnlyField value={channelSummary(row)} />
                        )}
                      </ItemContent>
                      <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
                        {editingChannels ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete radio channel"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteRadioChannel(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Toggle radio channel details"
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
                        {(
                          [
                            ['Channel Name/Talkgroup', 'channelNameTalkgroup'],
                            ['Assignment', 'assignment'],
                          ] as const
                        ).map(([label, field]) => (
                          <div key={field} className="space-y-1">
                            <Ics202FieldLabel>{label}</Ics202FieldLabel>
                            {editingChannels ? (
                              <input
                                value={row[field]}
                                onChange={(event) =>
                                  patchRadioChannel(row.id, field, event.target.value)
                                }
                                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                            ) : (
                              <Ics202ReadOnlyField value={row[field]} />
                            )}
                          </div>
                        ))}
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
                          <p className="text-xs font-semibold md:col-span-3">Receive (RX)</p>
                          {(
                            [
                              ['RX Freq', 'rxFreq'],
                              ['N or W', 'rxNw'],
                              ['RX Tone/NAC', 'rxToneNac'],
                            ] as const
                          ).map(([label, field]) => (
                            <div key={field} className="space-y-1">
                              <Ics202FieldLabel>{label}</Ics202FieldLabel>
                              {editingChannels ? (
                                <input
                                  value={row[field]}
                                  onChange={(event) =>
                                    patchRadioChannel(row.id, field, event.target.value)
                                  }
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                              ) : (
                                <Ics202ReadOnlyField value={row[field]} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
                          <p className="text-xs font-semibold md:col-span-3">Transmit (TX)</p>
                          {(
                            [
                              ['TX Freq', 'txFreq'],
                              ['N or W', 'txNw'],
                              ['TX Tone/NAC', 'txToneNac'],
                            ] as const
                          ).map(([label, field]) => (
                            <div key={field} className="space-y-1">
                              <Ics202FieldLabel>{label}</Ics202FieldLabel>
                              {editingChannels ? (
                                <input
                                  value={row[field]}
                                  onChange={(event) =>
                                    patchRadioChannel(row.id, field, event.target.value)
                                  }
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                              ) : (
                                <Ics202ReadOnlyField value={row[field]} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Ics202FieldLabel>Mode (A, D, or M)</Ics202FieldLabel>
                            {editingChannels ? (
                              <select
                                value={row.mode}
                                onChange={(event) =>
                                  patchRadioChannel(
                                    row.id,
                                    'mode',
                                    event.target.value as Ics205RadioMode
                                  )
                                }
                                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                              >
                                <option value="">—</option>
                                <option value="A">A — Analog</option>
                                <option value="D">D — Digital</option>
                                <option value="M">M — Mixed</option>
                              </select>
                            ) : (
                              <Ics202ReadOnlyField value={row.mode} />
                            )}
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Ics202FieldLabel>Remarks</Ics202FieldLabel>
                            {editingChannels ? (
                              <Textarea
                                value={row.remarks}
                                onChange={(event) =>
                                  patchRadioChannel(row.id, 'remarks', event.target.value)
                                }
                                className="min-h-12 text-xs"
                              />
                            ) : (
                              <Ics202ReadOnlyTextBlock value={row.remarks} />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Item>
              )
            })
          )}
        </div>,
        isSectionEditing(editingSections, 'basic-radio-channels') ? (
          <Button type="button" size="sm" variant="outline" onClick={addRadioChannel}>
            + Add Channel
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'special-instructions',
        isSectionEditing(editingSections, 'special-instructions') ? (
          <Textarea
            value={specialInstructions}
            onChange={(event) => onPatchDraft('special-instructions', event.target.value)}
            className="min-h-24 text-xs"
            placeholder="Cross-band repeaters, secure voice, encoders, PL tones, incident-within-incident handling, etc."
          />
        ) : (
          <Ics202ReadOnlyTextBlock value={specialInstructions} />
        )
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
          <div className="space-y-1 xl:col-span-2">
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
