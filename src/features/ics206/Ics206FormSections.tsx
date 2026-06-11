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
import { ICS206_SECTION_LABELS } from '@/features/ics206/constants'
import type {
  Ics206ApprovedByDraft,
  Ics206FormSectionDrafts,
  Ics206FormState,
  Ics206HospitalRow,
  Ics206IncidentInfoDraft,
  Ics206LevelOfService,
  Ics206MedicalAidStationRow,
  Ics206PreparedByDraft,
  Ics206SectionId,
  Ics206SpecialProceduresDraft,
  Ics206TransportationRow,
  Ics206YesNo,
} from '@/features/ics206/types'
import {
  extractIcs206ApprovedByDraft,
  extractIcs206IncidentInfoDraft,
  extractIcs206PreparedByDraft,
  extractIcs206SpecialProceduresDraft,
  formatIcs206YesNo,
} from '@/features/ics206/utils'
import { cn } from '@/lib/utils'

type Ics206FormSectionsProps = {
  form: Ics206FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics206SectionId, boolean>>
  drafts: Ics206FormSectionDrafts
  onStartSectionEdit: (section: Ics206SectionId) => void
  onCancelSectionEdit: (section: Ics206SectionId) => void
  onSaveSection: (section: Ics206SectionId) => void
  onGenerateSection: (section: Ics206SectionId) => void
  onPatchDraft: <S extends Ics206SectionId>(
    section: S,
    value: Ics206FormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics206SectionId, boolean>>,
  section: Ics206SectionId
) {
  return !!editingSections[section]
}

function YesNoSelect({
  value,
  onChange,
  className,
}: {
  value: Ics206YesNo
  onChange: (value: Ics206YesNo) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Ics206YesNo)}
      className={cn('h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none', className)}
    >
      <option value="">—</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  )
}

export function Ics206FormSections({
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
}: Ics206FormSectionsProps) {
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null)

  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs206IncidentInfoDraft(form)
  const medicalAidStations =
    isSectionEditing(editingSections, 'medical-aid-stations') && drafts['medical-aid-stations']
      ? drafts['medical-aid-stations']
      : form.medicalAidStations
  const transportation =
    isSectionEditing(editingSections, 'transportation') && drafts.transportation
      ? drafts.transportation
      : form.transportation
  const hospitals =
    isSectionEditing(editingSections, 'hospitals') && drafts.hospitals
      ? drafts.hospitals
      : form.hospitals
  const specialProcedures =
    isSectionEditing(editingSections, 'special-medical-emergency-procedures') &&
    drafts['special-medical-emergency-procedures']
      ? drafts['special-medical-emergency-procedures']
      : extractIcs206SpecialProceduresDraft(form)
  const preparedBy =
    isSectionEditing(editingSections, 'prepared-by') && drafts['prepared-by']
      ? drafts['prepared-by']
      : extractIcs206PreparedByDraft(form)
  const approvedBy =
    isSectionEditing(editingSections, 'approved-by') && drafts['approved-by']
      ? drafts['approved-by']
      : extractIcs206ApprovedByDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics206IncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const patchSpecialProcedures = (patch: Partial<Ics206SpecialProceduresDraft>) => {
    onPatchDraft('special-medical-emergency-procedures', { ...specialProcedures, ...patch })
  }

  const patchPreparedBy = (patch: Partial<Ics206PreparedByDraft>) => {
    onPatchDraft('prepared-by', { ...preparedBy, ...patch })
  }

  const patchApprovedBy = (patch: Partial<Ics206ApprovedByDraft>) => {
    onPatchDraft('approved-by', { ...approvedBy, ...patch })
  }

  const renderSectionShell = (
    section: Ics206SectionId,
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
              title={ICS206_SECTION_LABELS[section]}
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

  const renderCollapsibleRow = (
    section: Ics206SectionId,
    rowKey: string,
    index: number,
    label: string,
    summary: ReactNode,
    editing: boolean,
    onDelete: () => void,
    details: ReactNode
  ) => {
    const isOpen = expandedRowKey === rowKey
    return (
      <Item
        key={rowKey}
        variant="outline"
        className={cn(
          'relative min-w-0 w-full max-w-full flex-col items-stretch overflow-hidden p-0 [contain:layout]',
          glassItemBorderClasses
        )}
      >
        <Collapsible open={isOpen} onOpenChange={(open) => setExpandedRowKey(open ? rowKey : null)}>
          <div className="relative px-3 py-2.5 pr-12">
            <ItemContent className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label} {index + 1}
              </p>
              {editing ? summary : typeof summary === 'string' ? (
                <Ics202ReadOnlyField value={summary} />
              ) : (
                summary
              )}
            </ItemContent>
            <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${label.toLowerCase()}`}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Toggle details">
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
            </ItemActions>
          </div>
          <CollapsibleContent>
            <div className="min-w-0 max-w-full space-y-2 border-t px-3 py-2.5 pr-6">{details}</div>
          </CollapsibleContent>
        </Collapsible>
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
        'medical-aid-stations',
        <div className="space-y-2">
          {medicalAidStations.map((row, index) => {
            const editing = isSectionEditing(editingSections, 'medical-aid-stations')
            const patchRow = (patch: Partial<Ics206MedicalAidStationRow>) => {
              onPatchDraft(
                'medical-aid-stations',
                medicalAidStations.map((entry) =>
                  entry.id === row.id ? { ...entry, ...patch } : entry
                )
              )
            }
            const summary =
              [row.name, row.location, formatIcs206YesNo(row.paramedicsOnSite)]
                .filter(Boolean)
                .join(' · ') || 'No station details'
            return renderCollapsibleRow(
              'medical-aid-stations',
              `${form.id}-station-${row.id}`,
              index,
              'Station',
              editing ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    value={row.name}
                    onChange={(event) => patchRow({ name: event.target.value })}
                    placeholder="Name"
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <input
                    value={row.location}
                    onChange={(event) => patchRow({ location: event.target.value })}
                    placeholder="Location"
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                </div>
              ) : (
                summary
              ),
              editing,
              () =>
                onPatchDraft(
                  'medical-aid-stations',
                  medicalAidStations.filter((entry) => entry.id !== row.id)
                ),
              <>
                <div className="space-y-1">
                  <Ics202FieldLabel>Name</Ics202FieldLabel>
                  {editing ? (
                    <input
                      value={row.name}
                      onChange={(event) => patchRow({ name: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.name} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Location</Ics202FieldLabel>
                  {editing ? (
                    <input
                      value={row.location}
                      onChange={(event) => patchRow({ location: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.location} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Contact Number(s)/Frequency</Ics202FieldLabel>
                  {editing ? (
                    <Textarea
                      value={row.contactNumbersFrequency}
                      onChange={(event) =>
                        patchRow({ contactNumbersFrequency: event.target.value })
                      }
                      className="min-h-12 text-xs"
                    />
                  ) : (
                    <Ics202ReadOnlyTextBlock value={row.contactNumbersFrequency} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Paramedics on Site?</Ics202FieldLabel>
                  {editing ? (
                    <YesNoSelect
                      value={row.paramedicsOnSite}
                      onChange={(value) => patchRow({ paramedicsOnSite: value })}
                    />
                  ) : (
                    <Ics202ReadOnlyField value={formatIcs206YesNo(row.paramedicsOnSite)} />
                  )}
                </div>
              </>
            )
          })}
        </div>,
        isSectionEditing(editingSections, 'medical-aid-stations') ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onPatchDraft('medical-aid-stations', [
                ...medicalAidStations,
                {
                  id:
                    medicalAidStations.length === 0
                      ? 1
                      : Math.max(...medicalAidStations.map((row) => row.id)) + 1,
                  name: '',
                  location: '',
                  contactNumbersFrequency: '',
                  paramedicsOnSite: '',
                },
              ])
            }
          >
            + Add Station
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'transportation',
        <div className="space-y-2">
          {transportation.map((row, index) => {
            const editing = isSectionEditing(editingSections, 'transportation')
            const patchRow = (patch: Partial<Ics206TransportationRow>) => {
              onPatchDraft(
                'transportation',
                transportation.map((entry) =>
                  entry.id === row.id ? { ...entry, ...patch } : entry
                )
              )
            }
            const summary =
              [row.ambulanceService, row.location, row.levelOfService]
                .filter(Boolean)
                .join(' · ') || 'No transportation details'
            return renderCollapsibleRow(
              'transportation',
              `${form.id}-transport-${row.id}`,
              index,
              'Ambulance',
              editing ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    value={row.ambulanceService}
                    onChange={(event) => patchRow({ ambulanceService: event.target.value })}
                    placeholder="Ambulance Service"
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <input
                    value={row.location}
                    onChange={(event) => patchRow({ location: event.target.value })}
                    placeholder="Location"
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <select
                    value={row.levelOfService}
                    onChange={(event) =>
                      patchRow({ levelOfService: event.target.value as Ics206LevelOfService })
                    }
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  >
                    <option value="">Level —</option>
                    <option value="ALS">ALS</option>
                    <option value="BLS">BLS</option>
                  </select>
                </div>
              ) : (
                summary
              ),
              editing,
              () =>
                onPatchDraft(
                  'transportation',
                  transportation.filter((entry) => entry.id !== row.id)
                ),
              <>
                <div className="space-y-1">
                  <Ics202FieldLabel>Ambulance Service</Ics202FieldLabel>
                  {editing ? (
                    <input
                      value={row.ambulanceService}
                      onChange={(event) => patchRow({ ambulanceService: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.ambulanceService} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Location</Ics202FieldLabel>
                  {editing ? (
                    <input
                      value={row.location}
                      onChange={(event) => patchRow({ location: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.location} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Contact Number(s)/Frequency</Ics202FieldLabel>
                  {editing ? (
                    <Textarea
                      value={row.contactNumbersFrequency}
                      onChange={(event) =>
                        patchRow({ contactNumbersFrequency: event.target.value })
                      }
                      className="min-h-12 text-xs"
                    />
                  ) : (
                    <Ics202ReadOnlyTextBlock value={row.contactNumbersFrequency} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Level of Service</Ics202FieldLabel>
                  {editing ? (
                    <select
                      value={row.levelOfService}
                      onChange={(event) =>
                        patchRow({ levelOfService: event.target.value as Ics206LevelOfService })
                      }
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="">—</option>
                      <option value="ALS">ALS — Advanced Life Support</option>
                      <option value="BLS">BLS — Basic Life Support</option>
                    </select>
                  ) : (
                    <Ics202ReadOnlyField value={row.levelOfService} />
                  )}
                </div>
              </>
            )
          })}
        </div>,
        isSectionEditing(editingSections, 'transportation') ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onPatchDraft('transportation', [
                ...transportation,
                {
                  id:
                    transportation.length === 0
                      ? 1
                      : Math.max(...transportation.map((row) => row.id)) + 1,
                  ambulanceService: '',
                  location: '',
                  contactNumbersFrequency: '',
                  levelOfService: '',
                },
              ])
            }
          >
            + Add Ambulance
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'hospitals',
        <div className="space-y-2">
          {hospitals.map((row, index) => {
            const editing = isSectionEditing(editingSections, 'hospitals')
            const patchRow = (patch: Partial<Ics206HospitalRow>) => {
              onPatchDraft(
                'hospitals',
                hospitals.map((entry) => (entry.id === row.id ? { ...entry, ...patch } : entry))
              )
            }
            const summary =
              [row.hospitalName, row.travelTimeGround, formatIcs206YesNo(row.traumaCenterYes)]
                .filter(Boolean)
                .join(' · ') || 'No hospital details'
            return renderCollapsibleRow(
              'hospitals',
              `${form.id}-hospital-${row.id}`,
              index,
              'Hospital',
              editing ? (
                <input
                  value={row.hospitalName}
                  onChange={(event) => patchRow({ hospitalName: event.target.value })}
                  placeholder="Hospital Name"
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                summary
              ),
              editing,
              () => onPatchDraft('hospitals', hospitals.filter((entry) => entry.id !== row.id)),
              <>
                <div className="space-y-1">
                  <Ics202FieldLabel>Hospital Name</Ics202FieldLabel>
                  {editing ? (
                    <input
                      value={row.hospitalName}
                      onChange={(event) => patchRow({ hospitalName: event.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.hospitalName} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Address, Latitude & Longitude if Helipad</Ics202FieldLabel>
                  {editing ? (
                    <Textarea
                      value={row.addressLatLong}
                      onChange={(event) => patchRow({ addressLatLong: event.target.value })}
                      className="min-h-12 text-xs"
                    />
                  ) : (
                    <Ics202ReadOnlyTextBlock value={row.addressLatLong} />
                  )}
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Contact Number(s)/Frequency</Ics202FieldLabel>
                  {editing ? (
                    <Textarea
                      value={row.contactNumbersFrequency}
                      onChange={(event) =>
                        patchRow({ contactNumbersFrequency: event.target.value })
                      }
                      className="min-h-12 text-xs"
                    />
                  ) : (
                    <Ics202ReadOnlyTextBlock value={row.contactNumbersFrequency} />
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <Ics202FieldLabel>Travel Time (Air)</Ics202FieldLabel>
                    {editing ? (
                      <input
                        value={row.travelTimeAir}
                        onChange={(event) => patchRow({ travelTimeAir: event.target.value })}
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      />
                    ) : (
                      <Ics202ReadOnlyField value={row.travelTimeAir} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Ics202FieldLabel>Travel Time (Ground)</Ics202FieldLabel>
                    {editing ? (
                      <input
                        value={row.travelTimeGround}
                        onChange={(event) => patchRow({ travelTimeGround: event.target.value })}
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      />
                    ) : (
                      <Ics202ReadOnlyField value={row.travelTimeGround} />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="space-y-1">
                    <Ics202FieldLabel>Trauma Center</Ics202FieldLabel>
                    {editing ? (
                      <YesNoSelect
                        value={row.traumaCenterYes}
                        onChange={(value) => patchRow({ traumaCenterYes: value })}
                      />
                    ) : (
                      <Ics202ReadOnlyField value={formatIcs206YesNo(row.traumaCenterYes)} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Ics202FieldLabel>Trauma Center Level</Ics202FieldLabel>
                    {editing ? (
                      <input
                        value={row.traumaCenterLevel}
                        onChange={(event) => patchRow({ traumaCenterLevel: event.target.value })}
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      />
                    ) : (
                      <Ics202ReadOnlyField value={row.traumaCenterLevel} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Ics202FieldLabel>Burn Center</Ics202FieldLabel>
                    {editing ? (
                      <YesNoSelect
                        value={row.burnCenterYes}
                        onChange={(value) => patchRow({ burnCenterYes: value })}
                      />
                    ) : (
                      <Ics202ReadOnlyField value={formatIcs206YesNo(row.burnCenterYes)} />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Ics202FieldLabel>Helipad</Ics202FieldLabel>
                  {editing ? (
                    <YesNoSelect
                      value={row.helipadYes}
                      onChange={(value) => patchRow({ helipadYes: value })}
                    />
                  ) : (
                    <Ics202ReadOnlyField value={formatIcs206YesNo(row.helipadYes)} />
                  )}
                </div>
              </>
            )
          })}
        </div>,
        isSectionEditing(editingSections, 'hospitals') ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onPatchDraft('hospitals', [
                ...hospitals,
                {
                  id:
                    hospitals.length === 0
                      ? 1
                      : Math.max(...hospitals.map((row) => row.id)) + 1,
                  hospitalName: '',
                  addressLatLong: '',
                  contactNumbersFrequency: '',
                  travelTimeAir: '',
                  travelTimeGround: '',
                  traumaCenterYes: '',
                  traumaCenterLevel: '',
                  burnCenterYes: '',
                  helipadYes: '',
                },
              ])
            }
          >
            + Add Hospital
          </Button>
        ) : null
      )}

      {renderSectionShell(
        'special-medical-emergency-procedures',
        <div className="space-y-2">
          {isSectionEditing(editingSections, 'special-medical-emergency-procedures') ? (
            <>
              <Textarea
                value={specialProcedures.specialMedicalEmergencyProcedures}
                onChange={(event) =>
                  patchSpecialProcedures({ specialMedicalEmergencyProcedures: event.target.value })
                }
                className="min-h-24 text-xs"
                placeholder="Special emergency instructions, reporting procedures, incident-within-incident handling..."
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={specialProcedures.aviationAssetsUtilized}
                  onChange={(event) =>
                    patchSpecialProcedures({ aviationAssetsUtilized: event.target.checked })
                  }
                  className="h-4 w-4 rounded border"
                />
                Aviation assets are utilized for rescue (coordinate with Air Operations)
              </label>
            </>
          ) : (
            <>
              <Ics202ReadOnlyTextBlock value={specialProcedures.specialMedicalEmergencyProcedures} />
              <Ics202ReadOnlyField
                value={
                  specialProcedures.aviationAssetsUtilized
                    ? 'Aviation assets utilized for rescue — coordinate with Air Operations'
                    : 'Aviation assets not utilized for rescue'
                }
              />
            </>
          )}
        </div>
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
                onChange={(event) => patchPreparedBy({ preparedBySignature: event.target.value })}
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
                onChange={(event) => patchPreparedBy({ preparedByDateTime: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={preparedBy.preparedByDateTime} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'approved-by',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Name</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'approved-by') ? (
              <input
                value={approvedBy.approvedByName}
                onChange={(event) => patchApprovedBy({ approvedByName: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={approvedBy.approvedByName} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Signature</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'approved-by') ? (
              <input
                value={approvedBy.approvedBySignature}
                onChange={(event) => patchApprovedBy({ approvedBySignature: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={approvedBy.approvedBySignature} />
            )}
          </div>
          <div className="space-y-1 xl:col-span-2">
            <Ics202FieldLabel>Date/Time</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'approved-by') ? (
              <input
                type="datetime-local"
                value={approvedBy.approvedByDateTime}
                onChange={(event) => patchApprovedBy({ approvedByDateTime: event.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={approvedBy.approvedByDateTime} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
