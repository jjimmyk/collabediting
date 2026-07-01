import type { ReactNode } from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { ICS208HM_SECTION_LABELS } from '@/features/ics208hm/constants'
import type {
  Ics208hmDecontaminationProceduresDraft,
  Ics208hmEntryTeamRow,
  Ics208hmFormSectionDrafts,
  Ics208hmFormState,
  Ics208hmHazardMonitoringDraft,
  Ics208hmIncidentInfoDraft,
  Ics208hmMaterialRow,
  Ics208hmMedicalAssistanceDraft,
  Ics208hmOrganizationAssignments,
  Ics208hmOrganizationDraft,
  Ics208hmSafetyBriefingDraft,
  Ics208hmSectionId,
  Ics208hmSiteCommunicationsDraft,
  Ics208hmSiteInformationDraft,
  Ics208hmSiteMapDraft,
  Ics208hmSopSafeWorkPracticesDraft,
  Ics208hmYesNo,
} from '@/features/ics208hm/types'
import {
  extractIcs208hmDecontaminationProceduresDraft,
  extractIcs208hmHazardMonitoringDraft,
  extractIcs208hmIncidentInfoDraft,
  extractIcs208hmMedicalAssistanceDraft,
  extractIcs208hmOrganizationDraft,
  extractIcs208hmSafetyBriefingDraft,
  extractIcs208hmSiteCommunicationsDraft,
  extractIcs208hmSiteInformationDraft,
  extractIcs208hmSiteMapDraft,
  extractIcs208hmSopSafeWorkPracticesDraft,
  formatIcs208hmSiteMapIncludes,
  formatIcs208hmYesNo,
} from '@/features/ics208hm/utils'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import { cn } from '@/lib/utils'
import { Item } from '@/components/ui/item'

type Ics208hmFormSectionsProps = {
  form: Ics208hmFormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics208hmSectionId, boolean>>
  drafts: Ics208hmFormSectionDrafts
  onStartSectionEdit: (section: Ics208hmSectionId) => void
  onCancelSectionEdit: (section: Ics208hmSectionId) => void
  onSaveSection: (section: Ics208hmSectionId) => void
  onGenerateSection: (section: Ics208hmSectionId) => void
  onPatchDraft: <S extends Ics208hmSectionId>(
    section: S,
    value: Ics208hmFormSectionDrafts[S]
  ) => void
}

function isSectionEditing(
  editingSections: Partial<Record<Ics208hmSectionId, boolean>>,
  section: Ics208hmSectionId
) {
  return !!editingSections[section]
}

function YesNoSelect({
  value,
  onChange,
  className,
}: {
  value: Ics208hmYesNo
  onChange: (value: Ics208hmYesNo) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Ics208hmYesNo)}
      className={cn('h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none', className)}
    >
      <option value="">—</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  )
}

const ORG_FIELD_LABELS: { key: keyof Ics208hmOrganizationAssignments; label: string }[] = [
  { key: 'incidentCommander', label: 'Incident Commander' },
  { key: 'hmGroupSupervisor', label: 'HM Group Supervisor' },
  { key: 'techSpecialistHmReference', label: 'Tech. Specialist - HM Reference' },
  { key: 'safetyOfficer', label: 'Safety Officer' },
  { key: 'entryLeader', label: 'Entry Leader' },
  { key: 'siteAccessControlLeader', label: 'Site Access Control Leader' },
  { key: 'asstSafetyOfficerHm', label: 'Asst. Safety Officer - HM' },
  { key: 'decontaminationLeader', label: 'Decontamination Leader' },
  { key: 'safeRefugeAreaMgr', label: 'Safe Refuge Area Mgr' },
  { key: 'environmentalHealth', label: 'Environmental Health' },
  { key: 'orgFunction15', label: 'Other Function (15)' },
  { key: 'orgFunction16', label: 'Other Function (16)' },
]

export function Ics208hmFormSections({
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
}: Ics208hmFormSectionsProps) {
  const incidentInfo =
    isSectionEditing(editingSections, 'incident-info') && drafts['incident-info']
      ? drafts['incident-info']
      : extractIcs208hmIncidentInfoDraft(form)
  const siteInfo =
    isSectionEditing(editingSections, 'site-information') && drafts['site-information']
      ? drafts['site-information']
      : extractIcs208hmSiteInformationDraft(form)
  const organization =
    isSectionEditing(editingSections, 'organization') && drafts.organization
      ? drafts.organization
      : extractIcs208hmOrganizationDraft(form)
  const materials =
    isSectionEditing(editingSections, 'hazard-risk-analysis') && drafts['hazard-risk-analysis']
      ? drafts['hazard-risk-analysis']
      : form.materials
  const hazardMonitoring =
    isSectionEditing(editingSections, 'hazard-monitoring') && drafts['hazard-monitoring']
      ? drafts['hazard-monitoring']
      : extractIcs208hmHazardMonitoringDraft(form)
  const deconProcedures =
    isSectionEditing(editingSections, 'decontamination-procedures') &&
    drafts['decontamination-procedures']
      ? drafts['decontamination-procedures']
      : extractIcs208hmDecontaminationProceduresDraft(form)
  const siteCommunications =
    isSectionEditing(editingSections, 'site-communications') && drafts['site-communications']
      ? drafts['site-communications']
      : extractIcs208hmSiteCommunicationsDraft(form)
  const medicalAssistance =
    isSectionEditing(editingSections, 'medical-assistance') && drafts['medical-assistance']
      ? drafts['medical-assistance']
      : extractIcs208hmMedicalAssistanceDraft(form)
  const siteMap =
    isSectionEditing(editingSections, 'site-map') && drafts['site-map']
      ? drafts['site-map']
      : extractIcs208hmSiteMapDraft(form)
  const entryObjectives =
    isSectionEditing(editingSections, 'entry-objectives') && drafts['entry-objectives']
      ? drafts['entry-objectives'].entryObjectives
      : form.entryObjectives
  const sopPractices =
    isSectionEditing(editingSections, 'sop-safe-work-practices') && drafts['sop-safe-work-practices']
      ? drafts['sop-safe-work-practices']
      : extractIcs208hmSopSafeWorkPracticesDraft(form)
  const emergencyProcedures =
    isSectionEditing(editingSections, 'emergency-procedures') && drafts['emergency-procedures']
      ? drafts['emergency-procedures'].emergencyProcedures
      : form.emergencyProcedures
  const safetyBriefing =
    isSectionEditing(editingSections, 'safety-briefing') && drafts['safety-briefing']
      ? drafts['safety-briefing']
      : extractIcs208hmSafetyBriefingDraft(form)

  const patchIncidentInfo = (patch: Partial<Ics208hmIncidentInfoDraft>) => {
    onPatchDraft('incident-info', { ...incidentInfo, ...patch })
  }

  const renderSectionShell = (section: Ics208hmSectionId, content: ReactNode) => {
    const editing = isSectionEditing(editingSections, section)
    return (
      <Item
        variant="outline"
        className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}
      >
        <div className="min-w-0 space-y-2 px-3 py-2.5">
          <Ics202SectionHeader
            sectionId="incident-info"
            title={ICS208HM_SECTION_LABELS[section]}
            isEditing={editing}
            canEdit={canEdit}
            disabled={formIsLocked}
            onStartEdit={() => onStartSectionEdit(section)}
          />
          <IcsEditableSectionContent
            enabled={canEdit && !formIsLocked && !editing}
            ariaLabel={`Edit ${ICS208HM_SECTION_LABELS[section].toLowerCase()}`}
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

  const patchOrganization = (patch: Partial<Ics208hmOrganizationDraft>) => {
    onPatchDraft('organization', { ...organization, ...patch })
  }

  const patchEntryTeamRow = (index: number, patch: Partial<Ics208hmEntryTeamRow>) => {
    const next = organization.entryTeam.map((row, i) =>
      i === index ? { ...row, ...patch } : row
    )
    patchOrganization({ entryTeam: next })
  }

  const patchMaterialRow = (index: number, patch: Partial<Ics208hmMaterialRow>) => {
    const next = materials.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onPatchDraft('hazard-risk-analysis', next)
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
                onChange={(e) => patchIncidentInfo({ incidentName: e.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.incidentName} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Date Prepared</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'incident-info') ? (
              <input
                type="date"
                value={incidentInfo.datePrepared}
                onChange={(e) => patchIncidentInfo({ datePrepared: e.target.value })}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              />
            ) : (
              <Ics202ReadOnlyField value={incidentInfo.datePrepared} />
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
                  onChange={(e) => patchIncidentInfo({ [field]: e.target.value })}
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
        'site-information',
        <div className="space-y-1">
          <Ics202FieldLabel>Incident Location</Ics202FieldLabel>
          {isSectionEditing(editingSections, 'site-information') ? (
            <Textarea
              value={siteInfo.incidentLocation}
              onChange={(e) =>
                onPatchDraft('site-information', { incidentLocation: e.target.value })
              }
              className="min-h-16 text-xs"
              placeholder="Address and/or map coordinates..."
            />
          ) : (
            <Ics202ReadOnlyTextBlock value={siteInfo.incidentLocation} />
          )}
        </div>
      )}

      {renderSectionShell(
        'organization',
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {ORG_FIELD_LABELS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Ics202FieldLabel>{label}</Ics202FieldLabel>
                {isSectionEditing(editingSections, 'organization') ? (
                  <input
                    value={organization.organization[key]}
                    onChange={(e) =>
                      patchOrganization({
                        organization: { ...organization.organization, [key]: e.target.value },
                      })
                    }
                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                ) : (
                  <Ics202ReadOnlyField value={organization.organization[key]} />
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Ics202FieldLabel>Entry Team / Decontamination Element (Buddy System)</Ics202FieldLabel>
            {organization.entryTeam.map((row, index) => (
              <div key={row.id} className="grid grid-cols-2 gap-2 rounded-md border p-2 xl:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground">Entry {row.id} Name</span>
                  {isSectionEditing(editingSections, 'organization') ? (
                    <input
                      value={row.entryName}
                      onChange={(e) => patchEntryTeamRow(index, { entryName: e.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.entryName} />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground">Entry PPE Level</span>
                  {isSectionEditing(editingSections, 'organization') ? (
                    <input
                      value={row.entryPpeLevel}
                      onChange={(e) => patchEntryTeamRow(index, { entryPpeLevel: e.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.entryPpeLevel} />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground">Decon {row.id} Name</span>
                  {isSectionEditing(editingSections, 'organization') ? (
                    <input
                      value={row.deconName}
                      onChange={(e) => patchEntryTeamRow(index, { deconName: e.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.deconName} />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground">Decon PPE Level</span>
                  {isSectionEditing(editingSections, 'organization') ? (
                    <input
                      value={row.deconPpeLevel}
                      onChange={(e) => patchEntryTeamRow(index, { deconPpeLevel: e.target.value })}
                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <Ics202ReadOnlyField value={row.deconPpeLevel} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {renderSectionShell(
        'hazard-risk-analysis',
        <div className="space-y-2">
          {materials.map((row, index) => (
            <div key={row.id} className="space-y-2 rounded-md border p-2">
              <Ics202FieldLabel>Material {row.id}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'hazard-risk-analysis') ? (
                <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                  {(
                    [
                      ['Material', 'material'],
                      ['Container Type', 'containerType'],
                      ['Qty', 'qty'],
                      ['Phys. State', 'physState'],
                      ['pH', 'ph'],
                      ['IDLH', 'idlh'],
                      ['F.P.', 'fp'],
                      ['I.T.', 'it'],
                      ['V.P.', 'vp'],
                      ['V.D.', 'vd'],
                      ['S.G.', 'sg'],
                      ['LEL', 'lel'],
                      ['UEL', 'uel'],
                    ] as const
                  ).map(([label, field]) => (
                    <div key={field} className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
                      <input
                        value={row[field]}
                        onChange={(e) => patchMaterialRow(index, { [field]: e.target.value })}
                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                      />
                    </div>
                  ))}
                  <div className="col-span-full space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground">Comment</span>
                    <Textarea
                      value={row.comment}
                      onChange={(e) => patchMaterialRow(index, { comment: e.target.value })}
                      className="min-h-12 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <Ics202ReadOnlyTextBlock
                  value={
                    row.material.trim()
                      ? `${row.material} | ${row.containerType} | Qty: ${row.qty} | ${row.physState}`
                      : ''
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      {renderSectionShell(
        'hazard-monitoring',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['LEL Instrument(s)', 'lelInstruments'],
              ['O₂ Instrument(s)', 'o2Instruments'],
              ['Toxicity/PPM Instrument(s)', 'toxicityPpmInstruments'],
              ['Radiological Instrument(s)', 'radiologicalInstruments'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'hazard-monitoring') ? (
                <input
                  value={hazardMonitoring[field]}
                  onChange={(e) =>
                    onPatchDraft('hazard-monitoring', {
                      ...hazardMonitoring,
                      [field]: e.target.value,
                    } as Ics208hmHazardMonitoringDraft)
                  }
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={hazardMonitoring[field]} />
              )}
            </div>
          ))}
          <div className="space-y-1 xl:col-span-2">
            <Ics202FieldLabel>Comment</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'hazard-monitoring') ? (
              <Textarea
                value={hazardMonitoring.hazardMonitoringComment}
                onChange={(e) =>
                  onPatchDraft('hazard-monitoring', {
                    ...hazardMonitoring,
                    hazardMonitoringComment: e.target.value,
                  })
                }
                className="min-h-16 text-xs"
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={hazardMonitoring.hazardMonitoringComment} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'decontamination-procedures',
        <div className="space-y-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Standard Decontamination Procedures</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'decontamination-procedures') ? (
              <YesNoSelect
                value={deconProcedures.standardDeconProceduresYesNo}
                onChange={(value) =>
                  onPatchDraft('decontamination-procedures', {
                    ...deconProcedures,
                    standardDeconProceduresYesNo: value,
                  } as Ics208hmDecontaminationProceduresDraft)
                }
              />
            ) : (
              <Ics202ReadOnlyField
                value={formatIcs208hmYesNo(deconProcedures.standardDeconProceduresYesNo)}
              />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Comment</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'decontamination-procedures') ? (
              <Textarea
                value={deconProcedures.decontaminationProceduresComment}
                onChange={(e) =>
                  onPatchDraft('decontamination-procedures', {
                    ...deconProcedures,
                    decontaminationProceduresComment: e.target.value,
                  })
                }
                className="min-h-16 text-xs"
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={deconProcedures.decontaminationProceduresComment} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'site-communications',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          {(
            [
              ['Command Frequency', 'commandFrequency'],
              ['Tactical Frequency', 'tacticalFrequency'],
              ['Entry Frequency', 'entryFrequency'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'site-communications') ? (
                <input
                  value={siteCommunications[field]}
                  onChange={(e) =>
                    onPatchDraft('site-communications', {
                      ...siteCommunications,
                      [field]: e.target.value,
                    } as Ics208hmSiteCommunicationsDraft)
                  }
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={siteCommunications[field]} />
              )}
            </div>
          ))}
        </div>
      )}

      {renderSectionShell(
        'medical-assistance',
        <div className="space-y-2">
          {(
            [
              ['Medical Monitoring', 'medicalMonitoringYesNo'],
              ['Medical Treatment and Transport In-place', 'medicalTreatmentTransportInPlaceYesNo'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'medical-assistance') ? (
                <YesNoSelect
                  value={medicalAssistance[field]}
                  onChange={(value) =>
                    onPatchDraft('medical-assistance', {
                      ...medicalAssistance,
                      [field]: value,
                    } as Ics208hmMedicalAssistanceDraft)
                  }
                />
              ) : (
                <Ics202ReadOnlyField value={formatIcs208hmYesNo(medicalAssistance[field])} />
              )}
            </div>
          ))}
          <div className="space-y-1">
            <Ics202FieldLabel>Comment</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'medical-assistance') ? (
              <Textarea
                value={medicalAssistance.medicalAssistanceComment}
                onChange={(e) =>
                  onPatchDraft('medical-assistance', {
                    ...medicalAssistance,
                    medicalAssistanceComment: e.target.value,
                  })
                }
                className="min-h-16 text-xs"
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={medicalAssistance.medicalAssistanceComment} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'site-map',
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['Weather', 'weather'],
                ['Command Post', 'commandPost'],
                ['Zones', 'zones'],
                ['Assembly Areas', 'assemblyAreas'],
                ['Escape Routes', 'escapeRoutes'],
                ['Other', 'other'],
              ] as const
            ).map(([label, key]) => (
              <label key={key} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={siteMap.siteMapIncludes[key]}
                  disabled={!isSectionEditing(editingSections, 'site-map')}
                  onChange={(e) =>
                    onPatchDraft('site-map', {
                      ...siteMap,
                      siteMapIncludes: { ...siteMap.siteMapIncludes, [key]: e.target.checked },
                    } as Ics208hmSiteMapDraft)
                  }
                />
                {label}
              </label>
            ))}
          </div>
          {!isSectionEditing(editingSections, 'site-map') && (
            <Ics202ReadOnlyField value={formatIcs208hmSiteMapIncludes(siteMap.siteMapIncludes)} />
          )}
          <div className="space-y-1">
            <Ics202FieldLabel>Site Map</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'site-map') ? (
              <Textarea
                value={siteMap.siteMap}
                onChange={(e) => onPatchDraft('site-map', { ...siteMap, siteMap: e.target.value })}
                className="min-h-32 text-xs"
                placeholder="Sketch or describe site map with operational zones..."
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={siteMap.siteMap} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'entry-objectives',
        isSectionEditing(editingSections, 'entry-objectives') ? (
          <Textarea
            value={entryObjectives}
            onChange={(e) => onPatchDraft('entry-objectives', { entryObjectives: e.target.value })}
            className="min-h-24 text-xs"
            placeholder="Entry objectives for Exclusion Zone operations..."
          />
        ) : (
          <Ics202ReadOnlyTextBlock value={entryObjectives} />
        )
      )}

      {renderSectionShell(
        'sop-safe-work-practices',
        <div className="space-y-2">
          <div className="space-y-1">
            <Ics202FieldLabel>Modifications to Documented SOPs or Work Practices</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'sop-safe-work-practices') ? (
              <YesNoSelect
                value={sopPractices.sopModificationsYesNo}
                onChange={(value) =>
                  onPatchDraft('sop-safe-work-practices', {
                    ...sopPractices,
                    sopModificationsYesNo: value,
                  } as Ics208hmSopSafeWorkPracticesDraft)
                }
              />
            ) : (
              <Ics202ReadOnlyField value={formatIcs208hmYesNo(sopPractices.sopModificationsYesNo)} />
            )}
          </div>
          <div className="space-y-1">
            <Ics202FieldLabel>Comment</Ics202FieldLabel>
            {isSectionEditing(editingSections, 'sop-safe-work-practices') ? (
              <Textarea
                value={sopPractices.sopModificationsComment}
                onChange={(e) =>
                  onPatchDraft('sop-safe-work-practices', {
                    ...sopPractices,
                    sopModificationsComment: e.target.value,
                  })
                }
                className="min-h-16 text-xs"
              />
            ) : (
              <Ics202ReadOnlyTextBlock value={sopPractices.sopModificationsComment} />
            )}
          </div>
        </div>
      )}

      {renderSectionShell(
        'emergency-procedures',
        isSectionEditing(editingSections, 'emergency-procedures') ? (
          <Textarea
            value={emergencyProcedures}
            onChange={(e) =>
              onPatchDraft('emergency-procedures', { emergencyProcedures: e.target.value })
            }
            className="min-h-24 text-xs"
            placeholder="Emergency procedures for personnel within the Exclusion Zone..."
          />
        ) : (
          <Ics202ReadOnlyTextBlock value={emergencyProcedures} />
        )
      )}

      {renderSectionShell(
        'safety-briefing',
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {(
            [
              ['Asst. Safety Officer - HM Signature', 'asstSafetyOfficerHmSignature'],
              ['Safety Briefing Completed (Time)', 'safetyBriefingCompletedTime'],
              ['HM Group Supervisor Signature', 'hmGroupSupervisorSignature'],
              ['Incident Commander Signature', 'incidentCommanderSignature'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="space-y-1">
              <Ics202FieldLabel>{label}</Ics202FieldLabel>
              {isSectionEditing(editingSections, 'safety-briefing') ? (
                <input
                  value={safetyBriefing[field]}
                  onChange={(e) =>
                    onPatchDraft('safety-briefing', {
                      ...safetyBriefing,
                      [field]: e.target.value,
                    } as Ics208hmSafetyBriefingDraft)
                  }
                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                />
              ) : (
                <Ics202ReadOnlyField value={safetyBriefing[field]} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
