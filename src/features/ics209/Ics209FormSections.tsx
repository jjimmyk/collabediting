import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
  Ics202ReadOnlyTextBlock,
  Ics202SectionEditActions,
  Ics202SectionHeader,
} from '@/features/ics202/Ics202SectionToolbar'
import { IcsEditableSectionContent } from '@/lib/ics-editable-section'
import {
  ICS209_LIFE_SAFETY_THREAT_LABELS,
  ICS209_SECTION_LABELS,
  ICS209_TIME_HORIZON_LABELS,
} from '@/features/ics209/constants'
import type {
  Ics209AgencyResourceRow,
  Ics209ApprovalRoutingDraft,
  Ics209DamageRow,
  Ics209FormSectionDrafts,
  Ics209FormState,
  Ics209IncidentInfoDraft,
  Ics209IncidentSummaryDraft,
  Ics209LifeSafetyThreatDraft,
  Ics209LifeSafetyThreatKey,
  Ics209LocationInfoDraft,
  Ics209PlannedActionsProjectionsDraft,
  Ics209PublicResponderStatusDraft,
  Ics209ReportVersion,
  Ics209ResourceCommitmentDraft,
  Ics209SectionId,
  Ics209StatusCountRow,
  Ics209TimeHorizonFields,
  Ics209WeatherProjectionsDraft,
} from '@/features/ics209/types'
import {
  extractIcs209SectionDraft,
  formatIcs209PercentMetric,
  formatIcs209ReportVersion,
  formatIcs209TimeHorizon,
} from '@/features/ics209/utils'
import { cn } from '@/lib/utils'
import { Item } from '@/components/ui/item'

type Ics209FormSectionsProps = {
  form: Ics209FormState
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics209SectionId, boolean>>
  drafts: Ics209FormSectionDrafts
  onStartSectionEdit: (section: Ics209SectionId) => void
  onCancelSectionEdit: (section: Ics209SectionId) => void
  onSaveSection: (section: Ics209SectionId) => void
  onGenerateSection: (section: Ics209SectionId) => void
  onPatchDraft: <S extends Ics209SectionId>(
    section: S,
    value: Ics209FormSectionDrafts[S]
  ) => void
}

function isEditing(
  editingSections: Partial<Record<Ics209SectionId, boolean>>,
  section: Ics209SectionId
) {
  return !!editingSections[section]
}

function SectionShell({
  section,
  canEdit,
  formIsLocked,
  isSaving,
  glassItemBorderClasses,
  editingSections,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  children,
}: {
  section: Ics209SectionId
  canEdit: boolean
  formIsLocked: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  editingSections: Partial<Record<Ics209SectionId, boolean>>
  onStartSectionEdit: (section: Ics209SectionId) => void
  onCancelSectionEdit: (section: Ics209SectionId) => void
  onSaveSection: (section: Ics209SectionId) => void
  onGenerateSection: (section: Ics209SectionId) => void
  children: ReactNode
}) {
  const editing = isEditing(editingSections, section)
  return (
    <Item variant="outline" className={cn('min-w-0 flex-col items-stretch p-0', glassItemBorderClasses)}>
      <div className="min-w-0 space-y-2 px-3 py-2.5">
        <Ics202SectionHeader
          sectionId="incident-info"
          title={ICS209_SECTION_LABELS[section]}
          isEditing={editing}
          canEdit={canEdit}
          disabled={formIsLocked}
          onStartEdit={() => onStartSectionEdit(section)}
        />
        <IcsEditableSectionContent
          enabled={canEdit && !formIsLocked && !editing}
          ariaLabel={`Edit ${ICS209_SECTION_LABELS[section].toLowerCase()}`}
          onStartEdit={() => onStartSectionEdit(section)}
        >
          {children}
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

function TimeHorizonEditor({
  value,
  onChange,
}: {
  value: Ics209TimeHorizonFields
  onChange: (value: Ics209TimeHorizonFields) => void
}) {
  return (
    <div className="space-y-2">
      {ICS209_TIME_HORIZON_LABELS.map((horizon) => (
        <div key={horizon.key} className="space-y-1">
          <Ics202FieldLabel>{horizon.label}</Ics202FieldLabel>
          <Textarea
            value={value[horizon.key]}
            onChange={(event) => onChange({ ...value, [horizon.key]: event.target.value })}
            rows={2}
            className="text-xs"
          />
        </div>
      ))}
    </div>
  )
}

function TimeHorizonReadOnly({ value }: { value: Ics209TimeHorizonFields }) {
  const formatted = formatIcs209TimeHorizon(value)
  return <Ics202ReadOnlyTextBlock value={formatted || '—'} />
}

function StatusTableReadOnly({
  title,
  rows,
  totalThisPeriod,
  totalToDate,
}: {
  title: string
  rows: Ics209StatusCountRow[]
  totalThisPeriod: string
  totalToDate: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">{title}</p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-2 py-1.5 font-medium">Category</th>
              <th className="px-2 py-1.5 font-medium">This Period</th>
              <th className="px-2 py-1.5 font-medium">To Date</th>
              <th className="px-2 py-1.5 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t">
                <td className="px-2 py-1.5">{row.label}</td>
                <td className="px-2 py-1.5">{row.thisPeriod || '—'}</td>
                <td className="px-2 py-1.5">{row.toDate || '—'}</td>
                <td className="px-2 py-1.5">{row.count || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1"><Ics202FieldLabel>Total Affected (This Period)</Ics202FieldLabel><Ics202ReadOnlyField value={totalThisPeriod} /></div>
        <div className="space-y-1"><Ics202FieldLabel>Total Affected (To Date)</Ics202FieldLabel><Ics202ReadOnlyField value={totalToDate} /></div>
      </div>
    </div>
  )
}

function StatusTableEditor({
  title,
  rows,
  totalThisPeriod,
  totalToDate,
  onChange,
}: {
  title: string
  rows: Ics209StatusCountRow[]
  totalThisPeriod: string
  totalToDate: string
  onChange: (rows: Ics209StatusCountRow[], totalThisPeriod: string, totalToDate: string) => void
}) {
  const updateRow = (index: number, patch: Partial<Ics209StatusCountRow>) => {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    onChange(next, totalThisPeriod, totalToDate)
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">{title}</p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-2 py-1.5 font-medium">Category</th>
              <th className="px-2 py-1.5 font-medium">This Period</th>
              <th className="px-2 py-1.5 font-medium">To Date</th>
              <th className="px-2 py-1.5 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="border-t">
                <td className="px-2 py-1.5">{row.label}</td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.thisPeriod}
                    onChange={(event) => updateRow(index, { thisPeriod: event.target.value })}
                    className="h-7 text-[11px]"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.toDate}
                    onChange={(event) => updateRow(index, { toDate: event.target.value })}
                    className="h-7 text-[11px]"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.count}
                    onChange={(event) => updateRow(index, { count: event.target.value })}
                    className="h-7 text-[11px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Ics202FieldLabel>Total Affected (This Period)</Ics202FieldLabel>
          <Input
            value={totalThisPeriod}
            onChange={(event) => onChange(rows, event.target.value, totalToDate)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Ics202FieldLabel>Total Affected (To Date)</Ics202FieldLabel>
          <Input
            value={totalToDate}
            onChange={(event) => onChange(rows, totalThisPeriod, event.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

function DamageTableReadOnly({ rows }: { rows: Ics209DamageRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[720px] text-left text-[11px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-2 py-1.5 font-medium">Category</th>
            <th className="px-2 py-1.5 font-medium">Structural Summary</th>
            <th className="px-2 py-1.5 font-medium"># Threatened (72 hrs)</th>
            <th className="px-2 py-1.5 font-medium"># Damaged</th>
            <th className="px-2 py-1.5 font-medium"># Destroyed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-2 py-1.5">{row.category}</td>
              <td className="px-2 py-1.5">{row.structuralSummary || '—'}</td>
              <td className="px-2 py-1.5">{row.threatened72hr || '—'}</td>
              <td className="px-2 py-1.5">{row.damaged || '—'}</td>
              <td className="px-2 py-1.5">{row.destroyed || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DamageTableEditor({
  rows,
  onChange,
}: {
  rows: Ics209DamageRow[]
  onChange: (rows: Ics209DamageRow[]) => void
}) {
  const updateRow = (index: number, patch: Partial<Ics209DamageRow>) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[720px] text-left text-[11px]">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-2 py-1.5 font-medium">Category</th>
            <th className="px-2 py-1.5 font-medium">Structural Summary</th>
            <th className="px-2 py-1.5 font-medium"># Threatened (72 hrs)</th>
            <th className="px-2 py-1.5 font-medium"># Damaged</th>
            <th className="px-2 py-1.5 font-medium"># Destroyed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-t">
              <td className="px-2 py-1.5">{row.category}</td>
              <td className="px-2 py-1.5">
                <Input
                  value={row.structuralSummary}
                  onChange={(event) => updateRow(index, { structuralSummary: event.target.value })}
                  className="h-7 text-[11px]"
                />
              </td>
              <td className="px-2 py-1.5">
                <Input
                  value={row.threatened72hr}
                  onChange={(event) => updateRow(index, { threatened72hr: event.target.value })}
                  className="h-7 text-[11px]"
                />
              </td>
              <td className="px-2 py-1.5">
                <Input
                  value={row.damaged}
                  onChange={(event) => updateRow(index, { damaged: event.target.value })}
                  className="h-7 text-[11px]"
                />
              </td>
              <td className="px-2 py-1.5">
                <Input
                  value={row.destroyed}
                  onChange={(event) => updateRow(index, { destroyed: event.target.value })}
                  className="h-7 text-[11px]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Ics209FormSections({
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
}: Ics209FormSectionsProps) {
  const incidentInfoDraft =
    drafts['incident-info'] ?? extractIcs209SectionDraft(form, 'incident-info')
  const approvalDraft =
    drafts['approval-routing'] ?? extractIcs209SectionDraft(form, 'approval-routing')
  const locationDraft =
    drafts['location-info'] ?? extractIcs209SectionDraft(form, 'location-info')
  const summaryDraft =
    drafts['incident-summary'] ?? extractIcs209SectionDraft(form, 'incident-summary')
  const statusDraft =
    drafts['public-responder-status'] ?? extractIcs209SectionDraft(form, 'public-responder-status')
  const lifeSafetyDraft =
    drafts['life-safety-threat'] ?? extractIcs209SectionDraft(form, 'life-safety-threat')
  const weatherDraft =
    drafts['weather-projections'] ?? extractIcs209SectionDraft(form, 'weather-projections')
  const strategicObjectivesDraft =
    drafts['strategic-objectives'] ?? extractIcs209SectionDraft(form, 'strategic-objectives')
  const threatSummaryDraft =
    drafts['threat-summary'] ?? extractIcs209SectionDraft(form, 'threat-summary')
  const criticalResourcesDraft =
    drafts['critical-resources'] ?? extractIcs209SectionDraft(form, 'critical-resources')
  const strategicDiscussionDraft =
    drafts['strategic-discussion'] ?? extractIcs209SectionDraft(form, 'strategic-discussion')
  const plannedDraft =
    drafts['planned-actions-projections'] ??
    extractIcs209SectionDraft(form, 'planned-actions-projections')
  const remarksDraft = drafts.remarks ?? extractIcs209SectionDraft(form, 'remarks')
  const resourceDraft =
    drafts['resource-commitment'] ?? extractIcs209SectionDraft(form, 'resource-commitment')

  const patchIncidentInfo = (patch: Partial<Ics209IncidentInfoDraft>) =>
    onPatchDraft('incident-info', { ...(incidentInfoDraft as Ics209IncidentInfoDraft), ...patch })

  return (
    <div className="space-y-3">
      <SectionShell
        section="incident-info"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'incident-info') ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Ics202FieldLabel>1. Incident Name</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentName}
                onChange={(event) => patchIncidentInfo({ incidentName: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>2. Incident Number</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentNumber}
                onChange={(event) => patchIncidentInfo({ incidentNumber: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>3. Report Version</Ics202FieldLabel>
              <select
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).reportVersion}
                onChange={(event) =>
                  patchIncidentInfo({ reportVersion: event.target.value as Ics209ReportVersion })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              >
                <option value="">—</option>
                <option value="initial">Initial</option>
                <option value="update">Update</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>Report # (if used)</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).reportNumber}
                onChange={(event) => patchIncidentInfo({ reportNumber: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Ics202FieldLabel>4. Incident Commander(s) & Agency</Ics202FieldLabel>
              <Textarea
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentCommanders}
                onChange={(event) => patchIncidentInfo({ incidentCommanders: event.target.value })}
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Ics202FieldLabel>5. Incident Management Organization</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentManagementOrganization}
                onChange={(event) =>
                  patchIncidentInfo({ incidentManagementOrganization: event.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>6. Incident Start Date</Ics202FieldLabel>
              <Input
                type="date"
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentStartDate}
                onChange={(event) => patchIncidentInfo({ incidentStartDate: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>Incident Start Time</Ics202FieldLabel>
              <Input
                type="time"
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentStartTime}
                onChange={(event) => patchIncidentInfo({ incidentStartTime: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>Time Zone</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentStartTimeZone}
                onChange={(event) => patchIncidentInfo({ incidentStartTimeZone: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>7. Current Incident Size/Area</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).currentIncidentSize}
                onChange={(event) => patchIncidentInfo({ currentIncidentSize: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>8. Percent Metric</Ics202FieldLabel>
              <select
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).percentMetric}
                onChange={(event) =>
                  patchIncidentInfo({
                    percentMetric: event.target.value as Ics209IncidentInfoDraft['percentMetric'],
                  })
                }
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
              >
                <option value="">—</option>
                <option value="contained">Contained</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>Percent Value</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).percentValue}
                onChange={(event) => patchIncidentInfo({ percentValue: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Ics202FieldLabel>9. Incident Definition</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentDefinition}
                onChange={(event) => patchIncidentInfo({ incidentDefinition: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>10. Incident Complexity Level</Ics202FieldLabel>
              <Input
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).incidentComplexityLevel}
                onChange={(event) =>
                  patchIncidentInfo({ incidentComplexityLevel: event.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>11. Time Period From</Ics202FieldLabel>
              <Input
                type="datetime-local"
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).timePeriodFrom}
                onChange={(event) => patchIncidentInfo({ timePeriodFrom: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>11. Time Period To</Ics202FieldLabel>
              <Input
                type="datetime-local"
                value={(incidentInfoDraft as Ics209IncidentInfoDraft).timePeriodTo}
                onChange={(event) => patchIncidentInfo({ timePeriodTo: event.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1"><Ics202FieldLabel>Incident Name</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentName} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Incident Number</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentNumber} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Report Version</Ics202FieldLabel>
              <Ics202ReadOnlyField value={formatIcs209ReportVersion(form.reportVersion)} />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Report #</Ics202FieldLabel><Ics202ReadOnlyField value={form.reportNumber} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Incident Commander(s)</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentCommanders} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Incident Management Organization</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.incidentManagementOrganization} />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Incident Start Date</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentStartDate} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Incident Start Time</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentStartTime} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Time Zone</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentStartTimeZone} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Current Size/Area</Ics202FieldLabel><Ics202ReadOnlyField value={form.currentIncidentSize} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Percent</Ics202FieldLabel>
              <Ics202ReadOnlyField
                value={formatIcs209PercentMetric(form.percentMetric, form.percentValue)}
              />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Incident Definition</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentDefinition} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Complexity Level</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.incidentComplexityLevel} />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Time Period From</Ics202FieldLabel><Ics202ReadOnlyField value={form.timePeriodFrom} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Time Period To</Ics202FieldLabel><Ics202ReadOnlyField value={form.timePeriodTo} /></div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="approval-routing"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'approval-routing') ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['preparedByName', '12. Prepared By — Print Name'],
                ['preparedByPosition', 'ICS Position'],
                ['preparedByDateTime', 'Date/Time Prepared'],
                ['submittedDateTime', '13. Date/Time Submitted'],
                ['submittedTimeZone', 'Submitted Time Zone'],
                ['approvedByName', '14. Approved By — Print Name'],
                ['approvedByPosition', 'Approved ICS Position'],
                ['approvedBySignature', 'Signature'],
                ['primarySentTo', '15. Primary Location/Agency Sent To'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Ics202FieldLabel>{label}</Ics202FieldLabel>
                <Input
                  value={(approvalDraft as Ics209ApprovalRoutingDraft)[key]}
                  onChange={(event) =>
                    onPatchDraft('approval-routing', {
                      ...(approvalDraft as Ics209ApprovalRoutingDraft),
                      [key]: event.target.value,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1"><Ics202FieldLabel>Prepared By</Ics202FieldLabel><Ics202ReadOnlyField value={form.preparedByName} /></div>
            <div className="space-y-1"><Ics202FieldLabel>ICS Position</Ics202FieldLabel><Ics202ReadOnlyField value={form.preparedByPosition} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Date/Time Prepared</Ics202FieldLabel><Ics202ReadOnlyField value={form.preparedByDateTime} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Date/Time Submitted</Ics202FieldLabel><Ics202ReadOnlyField value={form.submittedDateTime} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Submitted Time Zone</Ics202FieldLabel><Ics202ReadOnlyField value={form.submittedTimeZone} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Approved By</Ics202FieldLabel><Ics202ReadOnlyField value={form.approvedByName} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Approved Position</Ics202FieldLabel><Ics202ReadOnlyField value={form.approvedByPosition} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Signature</Ics202FieldLabel><Ics202ReadOnlyField value={form.approvedBySignature} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Primary Sent To</Ics202FieldLabel><Ics202ReadOnlyField value={form.primarySentTo} /></div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="location-info"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'location-info') ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['locationState', '16. State'],
                ['locationCounty', '17. County/Parish/Borough'],
                ['locationCity', '18. City'],
                ['locationUnitOrOther', '19. Unit or Other'],
                ['incidentJurisdiction', '20. Incident Jurisdiction'],
                ['locationOwnership', '21. Location Ownership'],
                ['longitude', '22. Longitude'],
                ['latitude', '22. Latitude'],
                ['usNationalGrid', '23. US National Grid Reference'],
                ['legalDescription', '24. Legal Description'],
                ['shortLocationDescription', '25. Short Location Description'],
                ['utmCoordinates', '26. UTM Coordinates'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className={key === 'shortLocationDescription' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
                <Ics202FieldLabel>{label}</Ics202FieldLabel>
                {key === 'shortLocationDescription' ? (
                  <Textarea
                    value={(locationDraft as Ics209LocationInfoDraft)[key]}
                    onChange={(event) =>
                      onPatchDraft('location-info', {
                        ...(locationDraft as Ics209LocationInfoDraft),
                        [key]: event.target.value,
                      })
                    }
                    rows={2}
                    className="text-xs"
                  />
                ) : (
                  <Input
                    value={(locationDraft as Ics209LocationInfoDraft)[key]}
                    onChange={(event) =>
                      onPatchDraft('location-info', {
                        ...(locationDraft as Ics209LocationInfoDraft),
                        [key]: event.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                )}
              </div>
            ))}
            <div className="space-y-1 sm:col-span-2">
              <Ics202FieldLabel>27. Geospatial Data Notes</Ics202FieldLabel>
              <Textarea
                value={(locationDraft as Ics209LocationInfoDraft).geospatialDataNotes}
                onChange={(event) =>
                  onPatchDraft('location-info', {
                    ...(locationDraft as Ics209LocationInfoDraft),
                    geospatialDataNotes: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1"><Ics202FieldLabel>State</Ics202FieldLabel><Ics202ReadOnlyField value={form.locationState} /></div>
            <div className="space-y-1"><Ics202FieldLabel>County</Ics202FieldLabel><Ics202ReadOnlyField value={form.locationCounty} /></div>
            <div className="space-y-1"><Ics202FieldLabel>City</Ics202FieldLabel><Ics202ReadOnlyField value={form.locationCity} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Unit or Other</Ics202FieldLabel><Ics202ReadOnlyField value={form.locationUnitOrOther} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Jurisdiction</Ics202FieldLabel><Ics202ReadOnlyField value={form.incidentJurisdiction} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Ownership</Ics202FieldLabel><Ics202ReadOnlyField value={form.locationOwnership} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Longitude</Ics202FieldLabel><Ics202ReadOnlyField value={form.longitude} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Latitude</Ics202FieldLabel><Ics202ReadOnlyField value={form.latitude} /></div>
            <div className="space-y-1"><Ics202FieldLabel>US National Grid</Ics202FieldLabel><Ics202ReadOnlyField value={form.usNationalGrid} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Legal Description</Ics202FieldLabel><Ics202ReadOnlyField value={form.legalDescription} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Short Location Description</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.shortLocationDescription} /></div>
            <div className="space-y-1"><Ics202FieldLabel>UTM Coordinates</Ics202FieldLabel><Ics202ReadOnlyField value={form.utmCoordinates} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Geospatial Data Notes</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.geospatialDataNotes} /></div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="incident-summary"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'incident-summary') ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Ics202FieldLabel>28. Significant Events</Ics202FieldLabel>
              <Textarea
                value={(summaryDraft as Ics209IncidentSummaryDraft).significantEvents}
                onChange={(event) =>
                  onPatchDraft('incident-summary', {
                    ...(summaryDraft as Ics209IncidentSummaryDraft),
                    significantEvents: event.target.value,
                  })
                }
                rows={4}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>29. Primary Materials or Hazards</Ics202FieldLabel>
              <Textarea
                value={(summaryDraft as Ics209IncidentSummaryDraft).primaryMaterialsHazards}
                onChange={(event) =>
                  onPatchDraft('incident-summary', {
                    ...(summaryDraft as Ics209IncidentSummaryDraft),
                    primaryMaterialsHazards: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>30. Damage Assessment Summary</Ics202FieldLabel>
              <Textarea
                value={(summaryDraft as Ics209IncidentSummaryDraft).damageAssessmentSummary}
                onChange={(event) =>
                  onPatchDraft('incident-summary', {
                    ...(summaryDraft as Ics209IncidentSummaryDraft),
                    damageAssessmentSummary: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
            <DamageTableEditor
              rows={(summaryDraft as Ics209IncidentSummaryDraft).damageRows}
              onChange={(damageRows) =>
                onPatchDraft('incident-summary', {
                  ...(summaryDraft as Ics209IncidentSummaryDraft),
                  damageRows,
                })
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1"><Ics202FieldLabel>Significant Events</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.significantEvents} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Primary Materials/Hazards</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.primaryMaterialsHazards} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Damage Assessment Summary</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.damageAssessmentSummary} /></div>
            <DamageTableReadOnly rows={form.damageRows} />
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="public-responder-status"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'public-responder-status') ? (
          <div className="space-y-4">
            <StatusTableEditor
              title="31. Public Status Summary"
              rows={(statusDraft as Ics209PublicResponderStatusDraft).publicStatusRows}
              totalThisPeriod={
                (statusDraft as Ics209PublicResponderStatusDraft).publicTotalAffectedThisPeriod
              }
              totalToDate={
                (statusDraft as Ics209PublicResponderStatusDraft).publicTotalAffectedToDate
              }
              onChange={(publicStatusRows, publicTotalAffectedThisPeriod, publicTotalAffectedToDate) =>
                onPatchDraft('public-responder-status', {
                  ...(statusDraft as Ics209PublicResponderStatusDraft),
                  publicStatusRows,
                  publicTotalAffectedThisPeriod,
                  publicTotalAffectedToDate,
                })
              }
            />
            <StatusTableEditor
              title="32. Responder Status Summary"
              rows={(statusDraft as Ics209PublicResponderStatusDraft).responderStatusRows}
              totalThisPeriod={
                (statusDraft as Ics209PublicResponderStatusDraft).responderTotalAffectedThisPeriod
              }
              totalToDate={
                (statusDraft as Ics209PublicResponderStatusDraft).responderTotalAffectedToDate
              }
              onChange={(
                responderStatusRows,
                responderTotalAffectedThisPeriod,
                responderTotalAffectedToDate
              ) =>
                onPatchDraft('public-responder-status', {
                  ...(statusDraft as Ics209PublicResponderStatusDraft),
                  responderStatusRows,
                  responderTotalAffectedThisPeriod,
                  responderTotalAffectedToDate,
                })
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <StatusTableReadOnly
              title="31. Public Status Summary"
              rows={form.publicStatusRows}
              totalThisPeriod={form.publicTotalAffectedThisPeriod}
              totalToDate={form.publicTotalAffectedToDate}
            />
            <StatusTableReadOnly
              title="32. Responder Status Summary"
              rows={form.responderStatusRows}
              totalThisPeriod={form.responderTotalAffectedThisPeriod}
              totalToDate={form.responderTotalAffectedToDate}
            />
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="life-safety-threat"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'life-safety-threat') ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Ics202FieldLabel>33. Life, Safety, and Health Status/Threat Remarks</Ics202FieldLabel>
              <Textarea
                value={(lifeSafetyDraft as Ics209LifeSafetyThreatDraft).lifeSafetyThreatRemarks}
                onChange={(event) =>
                  onPatchDraft('life-safety-threat', {
                    ...(lifeSafetyDraft as Ics209LifeSafetyThreatDraft),
                    lifeSafetyThreatRemarks: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={(lifeSafetyDraft as Ics209LifeSafetyThreatDraft).lifeSafetyThreatActive}
                onChange={(event) =>
                  onPatchDraft('life-safety-threat', {
                    ...(lifeSafetyDraft as Ics209LifeSafetyThreatDraft),
                    lifeSafetyThreatActive: event.target.checked,
                  })
                }
              />
              34A. Check if Active
            </label>
            <div className="space-y-1">
              <Ics202FieldLabel>34B. Notes</Ics202FieldLabel>
              <Textarea
                value={(lifeSafetyDraft as Ics209LifeSafetyThreatDraft).lifeSafetyThreatNotes}
                onChange={(event) =>
                  onPatchDraft('life-safety-threat', {
                    ...(lifeSafetyDraft as Ics209LifeSafetyThreatDraft),
                    lifeSafetyThreatNotes: event.target.value,
                  })
                }
                rows={2}
                className="text-xs"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(ICS209_LIFE_SAFETY_THREAT_LABELS) as Ics209LifeSafetyThreatKey[]).map(
                (key) => (
                  <label key={key} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={
                        (lifeSafetyDraft as Ics209LifeSafetyThreatDraft).lifeSafetyThreats[key]
                      }
                      onChange={(event) =>
                        onPatchDraft('life-safety-threat', {
                          ...(lifeSafetyDraft as Ics209LifeSafetyThreatDraft),
                          lifeSafetyThreats: {
                            ...(lifeSafetyDraft as Ics209LifeSafetyThreatDraft).lifeSafetyThreats,
                            [key]: event.target.checked,
                          },
                        })
                      }
                    />
                    {ICS209_LIFE_SAFETY_THREAT_LABELS[key]}
                  </label>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1"><Ics202FieldLabel>Life, Safety, and Health Remarks</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.lifeSafetyThreatRemarks} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Threat Active</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.lifeSafetyThreatActive ? 'Yes' : 'No'} />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Threat Notes</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.lifeSafetyThreatNotes} /></div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ICS209_LIFE_SAFETY_THREAT_LABELS) as Ics209LifeSafetyThreatKey[])
                .filter((key) => form.lifeSafetyThreats[key])
                .map((key) => (
                  <span
                    key={key}
                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  >
                    {ICS209_LIFE_SAFETY_THREAT_LABELS[key]}
                  </span>
                ))}
            </div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="weather-projections"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'weather-projections') ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Ics202FieldLabel>35. Weather Concerns</Ics202FieldLabel>
              <Textarea
                value={(weatherDraft as Ics209WeatherProjectionsDraft).weatherConcerns}
                onChange={(event) =>
                  onPatchDraft('weather-projections', {
                    ...(weatherDraft as Ics209WeatherProjectionsDraft),
                    weatherConcerns: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>36. Projected Incident Activity</Ics202FieldLabel>
              <TimeHorizonEditor
                value={(weatherDraft as Ics209WeatherProjectionsDraft).projectedActivity}
                onChange={(projectedActivity) =>
                  onPatchDraft('weather-projections', {
                    ...(weatherDraft as Ics209WeatherProjectionsDraft),
                    projectedActivity,
                  })
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1"><Ics202FieldLabel>Weather Concerns</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.weatherConcerns} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Projected Incident Activity</Ics202FieldLabel>
              <TimeHorizonReadOnly value={form.projectedActivity} />
            </div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="strategic-objectives"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'strategic-objectives') ? (
          <Textarea
            value={strategicObjectivesDraft as string}
            onChange={(event) => onPatchDraft('strategic-objectives', event.target.value)}
            rows={4}
            className="text-xs"
          />
        ) : (
          <div className="space-y-1"><Ics202FieldLabel>37. Strategic Objectives</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.strategicObjectives} /></div>
        )}
      </SectionShell>

      <SectionShell
        section="threat-summary"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'threat-summary') ? (
          <TimeHorizonEditor
            value={(threatSummaryDraft as { threatSummary: Ics209TimeHorizonFields }).threatSummary}
            onChange={(threatSummary) => onPatchDraft('threat-summary', { threatSummary })}
          />
        ) : (
          <TimeHorizonReadOnly value={form.threatSummary} />
        )}
      </SectionShell>

      <SectionShell
        section="critical-resources"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'critical-resources') ? (
          <TimeHorizonEditor
            value={
              (criticalResourcesDraft as { criticalResourceNeeds: Ics209TimeHorizonFields })
                .criticalResourceNeeds
            }
            onChange={(criticalResourceNeeds) =>
              onPatchDraft('critical-resources', { criticalResourceNeeds })
            }
          />
        ) : (
          <TimeHorizonReadOnly value={form.criticalResourceNeeds} />
        )}
      </SectionShell>

      <SectionShell
        section="strategic-discussion"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'strategic-discussion') ? (
          <Textarea
            value={strategicDiscussionDraft as string}
            onChange={(event) => onPatchDraft('strategic-discussion', event.target.value)}
            rows={5}
            className="text-xs"
          />
        ) : (
          <div className="space-y-1"><Ics202FieldLabel>40. Strategic Discussion</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.strategicDiscussion} /></div>
        )}
      </SectionShell>

      <SectionShell
        section="planned-actions-projections"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'planned-actions-projections') ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Ics202FieldLabel>41. Planned Actions for Next Operational Period</Ics202FieldLabel>
              <Textarea
                value={(plannedDraft as Ics209PlannedActionsProjectionsDraft).plannedActionsNextPeriod}
                onChange={(event) =>
                  onPatchDraft('planned-actions-projections', {
                    ...(plannedDraft as Ics209PlannedActionsProjectionsDraft),
                    plannedActionsNextPeriod: event.target.value,
                  })
                }
                rows={4}
                className="text-xs"
              />
            </div>
            {(
              [
                ['projectedFinalSize', '42. Projected Final Incident Size/Area'],
                ['anticipatedCompletionDate', '43. Anticipated Completion Date'],
                ['projectedDemobilizationStartDate', '44. Projected Demobilization Start Date'],
                ['estimatedCostsToDate', '45. Estimated Incident Costs to Date'],
                ['projectedFinalCostEstimate', '46. Projected Final Cost Estimate'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Ics202FieldLabel>{label}</Ics202FieldLabel>
                <Input
                  value={(plannedDraft as Ics209PlannedActionsProjectionsDraft)[key]}
                  onChange={(event) =>
                    onPatchDraft('planned-actions-projections', {
                      ...(plannedDraft as Ics209PlannedActionsProjectionsDraft),
                      [key]: event.target.value,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-1"><Ics202FieldLabel>Planned Actions Next Period</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.plannedActionsNextPeriod} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Projected Final Size</Ics202FieldLabel><Ics202ReadOnlyField value={form.projectedFinalSize} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Anticipated Completion Date</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.anticipatedCompletionDate} />
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>Projected Demobilization Start</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.projectedDemobilizationStartDate} />
            </div>
            <div className="space-y-1"><Ics202FieldLabel>Estimated Costs to Date</Ics202FieldLabel><Ics202ReadOnlyField value={form.estimatedCostsToDate} /></div>
            <div className="space-y-1">
              <Ics202FieldLabel>Projected Final Cost Estimate</Ics202FieldLabel>
              <Ics202ReadOnlyField value={form.projectedFinalCostEstimate} />
            </div>
          </div>
        )}
      </SectionShell>

      <SectionShell
        section="remarks"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'remarks') ? (
          <Textarea
            value={remarksDraft as string}
            onChange={(event) => onPatchDraft('remarks', event.target.value)}
            rows={5}
            className="text-xs"
          />
        ) : (
          <div className="space-y-1"><Ics202FieldLabel>47. Remarks</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.remarks} /></div>
        )}
      </SectionShell>

      <SectionShell
        section="resource-commitment"
        canEdit={canEdit}
        formIsLocked={formIsLocked}
        isSaving={isSaving}
        glassItemBorderClasses={glassItemBorderClasses}
        editingSections={editingSections}
        onStartSectionEdit={onStartSectionEdit}
        onCancelSectionEdit={onCancelSectionEdit}
        onSaveSection={onSaveSection}
        onGenerateSection={onGenerateSection}
      >
        {isEditing(editingSections, 'resource-commitment') ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Ics202FieldLabel>49. Resource Columns</Ics202FieldLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    const draft = resourceDraft as Ics209ResourceCommitmentDraft
                    const nextId = `resource-${draft.resourceColumns.length + 1}`
                    onPatchDraft('resource-commitment', {
                      ...draft,
                      resourceColumns: [...draft.resourceColumns, { id: nextId, label: '' }],
                    })
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Column
                </Button>
              </div>
              {(resourceDraft as Ics209ResourceCommitmentDraft).resourceColumns.map(
                (column, index) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <Input
                      value={column.label}
                      onChange={(event) => {
                        const draft = resourceDraft as Ics209ResourceCommitmentDraft
                        onPatchDraft('resource-commitment', {
                          ...draft,
                          resourceColumns: draft.resourceColumns.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, label: event.target.value } : entry
                          ),
                        })
                      }}
                      placeholder={`Resource column ${index + 1}`}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const draft = resourceDraft as Ics209ResourceCommitmentDraft
                        onPatchDraft('resource-commitment', {
                          ...draft,
                          resourceColumns: draft.resourceColumns.filter(
                            (_, entryIndex) => entryIndex !== index
                          ),
                        })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Ics202FieldLabel>48–51. Agency Resource Rows</Ics202FieldLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    const draft = resourceDraft as Ics209ResourceCommitmentDraft
                    const blankCounts = Object.fromEntries(
                      draft.resourceColumns.map((column) => [
                        column.id,
                        { resources: '', personnel: '' },
                      ])
                    )
                    const nextRow: Ics209AgencyResourceRow = {
                      id: Date.now(),
                      agency: '',
                      resourceCounts: blankCounts,
                      additionalPersonnel: '',
                      totalPersonnel: '',
                    }
                    onPatchDraft('resource-commitment', {
                      ...draft,
                      agencyResourceRows: [...draft.agencyResourceRows, nextRow],
                    })
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Agency
                </Button>
              </div>
              {(resourceDraft as Ics209ResourceCommitmentDraft).agencyResourceRows.map(
                (row, rowIndex) => (
                  <div key={row.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.agency}
                        onChange={(event) => {
                          const draft = resourceDraft as Ics209ResourceCommitmentDraft
                          onPatchDraft('resource-commitment', {
                            ...draft,
                            agencyResourceRows: draft.agencyResourceRows.map((entry, index) =>
                              index === rowIndex ? { ...entry, agency: event.target.value } : entry
                            ),
                          })
                        }}
                        placeholder="Agency or Organization"
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          const draft = resourceDraft as Ics209ResourceCommitmentDraft
                          onPatchDraft('resource-commitment', {
                            ...draft,
                            agencyResourceRows: draft.agencyResourceRows.filter(
                              (_, index) => index !== rowIndex
                            ),
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(resourceDraft as Ics209ResourceCommitmentDraft).resourceColumns.map(
                        (column) => (
                          <div key={column.id} className="space-y-1">
                            <Ics202FieldLabel>{column.label || 'Resource'}</Ics202FieldLabel>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={row.resourceCounts[column.id]?.resources ?? ''}
                                onChange={(event) => {
                                  const draft = resourceDraft as Ics209ResourceCommitmentDraft
                                  onPatchDraft('resource-commitment', {
                                    ...draft,
                                    agencyResourceRows: draft.agencyResourceRows.map(
                                      (entry, index) =>
                                        index === rowIndex
                                          ? {
                                              ...entry,
                                              resourceCounts: {
                                                ...entry.resourceCounts,
                                                [column.id]: {
                                                  resources: event.target.value,
                                                  personnel:
                                                    entry.resourceCounts[column.id]?.personnel ?? '',
                                                },
                                              },
                                            }
                                          : entry
                                    ),
                                  })
                                }}
                                placeholder="Resources"
                                className="h-8 text-xs"
                              />
                              <Input
                                value={row.resourceCounts[column.id]?.personnel ?? ''}
                                onChange={(event) => {
                                  const draft = resourceDraft as Ics209ResourceCommitmentDraft
                                  onPatchDraft('resource-commitment', {
                                    ...draft,
                                    agencyResourceRows: draft.agencyResourceRows.map(
                                      (entry, index) =>
                                        index === rowIndex
                                          ? {
                                              ...entry,
                                              resourceCounts: {
                                                ...entry.resourceCounts,
                                                [column.id]: {
                                                  resources:
                                                    entry.resourceCounts[column.id]?.resources ?? '',
                                                  personnel: event.target.value,
                                                },
                                              },
                                            }
                                          : entry
                                    ),
                                  })
                                }}
                                placeholder="Personnel"
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Ics202FieldLabel>50. Additional Personnel</Ics202FieldLabel>
                        <Input
                          value={row.additionalPersonnel}
                          onChange={(event) => {
                            const draft = resourceDraft as Ics209ResourceCommitmentDraft
                            onPatchDraft('resource-commitment', {
                              ...draft,
                              agencyResourceRows: draft.agencyResourceRows.map((entry, index) =>
                                index === rowIndex
                                  ? { ...entry, additionalPersonnel: event.target.value }
                                  : entry
                              ),
                            })
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Ics202FieldLabel>51. Total Personnel</Ics202FieldLabel>
                        <Input
                          value={row.totalPersonnel}
                          onChange={(event) => {
                            const draft = resourceDraft as Ics209ResourceCommitmentDraft
                            onPatchDraft('resource-commitment', {
                              ...draft,
                              agencyResourceRows: draft.agencyResourceRows.map((entry, index) =>
                                index === rowIndex
                                  ? { ...entry, totalPersonnel: event.target.value }
                                  : entry
                              ),
                            })
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Ics202FieldLabel>52. Total Resources</Ics202FieldLabel>
                <Input
                  value={(resourceDraft as Ics209ResourceCommitmentDraft).totalResources}
                  onChange={(event) =>
                    onPatchDraft('resource-commitment', {
                      ...(resourceDraft as Ics209ResourceCommitmentDraft),
                      totalResources: event.target.value,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Ics202FieldLabel>53. Cooperating and Assisting Organizations</Ics202FieldLabel>
              <Textarea
                value={(resourceDraft as Ics209ResourceCommitmentDraft).cooperatingOrganizations}
                onChange={(event) =>
                  onPatchDraft('resource-commitment', {
                    ...(resourceDraft as Ics209ResourceCommitmentDraft),
                    cooperatingOrganizations: event.target.value,
                  })
                }
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {form.agencyResourceRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">No agency resource rows recorded.</p>
            ) : (
              form.agencyResourceRows.map((row) => (
                <div key={row.id} className="rounded-md border p-3 text-xs">
                  <p className="font-semibold">{row.agency || 'Agency'}</p>
                  <p className="text-muted-foreground">
                    Additional Personnel: {row.additionalPersonnel || '—'} · Total Personnel:{' '}
                    {row.totalPersonnel || '—'}
                  </p>
                  {form.resourceColumns.map((column) => (
                    <p key={column.id}>
                      {column.label}: {row.resourceCounts[column.id]?.resources || '0'}/
                      {row.resourceCounts[column.id]?.personnel || '0'}
                    </p>
                  ))}
                </div>
              ))
            )}
            <div className="space-y-1"><Ics202FieldLabel>Total Resources</Ics202FieldLabel><Ics202ReadOnlyField value={form.totalResources} /></div>
            <div className="space-y-1"><Ics202FieldLabel>Cooperating Organizations</Ics202FieldLabel><Ics202ReadOnlyTextBlock value={form.cooperatingOrganizations} /></div>
          </div>
        )}
      </SectionShell>
    </div>
  )
}
