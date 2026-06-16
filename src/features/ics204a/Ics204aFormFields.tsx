import type { ReactNode } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Ics204ReadOnlyField, Ics204ReadOnlyTextBlock } from '@/features/ics204/Ics204SectionToolbar'
import { ICS204A_FIELD_LABELS } from '@/features/ics204a/constants'
import type { Ics204aFormState } from '@/features/ics204a/types'

type Ics204aFormFieldsProps = {
  form: Ics204aFormState
  readOnly: boolean
  onChange: (next: Ics204aFormState) => void
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function TextInput({
  value,
  readOnly,
  onChange,
  type = 'text',
}: {
  value: string
  readOnly: boolean
  onChange: (value: string) => void
  type?: 'text' | 'datetime-local'
}) {
  if (readOnly) {
    return <Ics204ReadOnlyField value={value} />
  }
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
    />
  )
}

export function Ics204aFormFields({ form, readOnly, onChange }: Ics204aFormFieldsProps) {
  const patch = (patchValue: Partial<Ics204aFormState>) => {
    onChange({ ...form, ...patchValue })
  }

  const patchOtherAttachments = (patchValue: Partial<Ics204aFormState['otherAttachments']>) => {
    onChange({
      ...form,
      otherAttachments: {
        ...form.otherAttachments,
        ...patchValue,
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={ICS204A_FIELD_LABELS.incidentName}>
          <TextInput
            value={form.incidentName}
            readOnly={readOnly}
            onChange={(value) => patch({ incidentName: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.incidentLocation}>
          <TextInput
            value={form.incidentLocation}
            readOnly={readOnly}
            onChange={(value) => patch({ incidentLocation: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.operationalPeriodFrom}>
          <TextInput
            value={form.operationalPeriodFrom}
            readOnly={readOnly}
            onChange={(value) => patch({ operationalPeriodFrom: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.operationalPeriodTo}>
          <TextInput
            value={form.operationalPeriodTo}
            readOnly={readOnly}
            onChange={(value) => patch({ operationalPeriodTo: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.branch}>
          <TextInput
            value={form.branch}
            readOnly={readOnly}
            onChange={(value) => patch({ branch: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.divisionGroup}>
          <TextInput
            value={form.divisionGroup}
            readOnly={readOnly}
            onChange={(value) => patch({ divisionGroup: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.resourceIdentifier}>
          <TextInput
            value={form.resourceIdentifier}
            readOnly={readOnly}
            onChange={(value) => patch({ resourceIdentifier: value })}
          />
        </FieldShell>
        <FieldShell label={ICS204A_FIELD_LABELS.leader}>
          <TextInput
            value={form.leader}
            readOnly={readOnly}
            onChange={(value) => patch({ leader: value })}
          />
        </FieldShell>
      </div>

      <FieldShell label={ICS204A_FIELD_LABELS.assignmentLocation}>
        <TextInput
          value={form.assignmentLocation}
          readOnly={readOnly}
          onChange={(value) => patch({ assignmentLocation: value })}
        />
      </FieldShell>

      <FieldShell label={ICS204A_FIELD_LABELS.workAssignmentSpecialInstructions}>
        {readOnly ? (
          <Ics204ReadOnlyTextBlock value={form.workAssignmentSpecialInstructions} />
        ) : (
          <Textarea
            value={form.workAssignmentSpecialInstructions}
            onChange={(event) => patch({ workAssignmentSpecialInstructions: event.target.value })}
            className="min-h-24 text-xs"
          />
        )}
      </FieldShell>

      <FieldShell label={ICS204A_FIELD_LABELS.siteSafetyPlanLocation}>
        <TextInput
          value={form.siteSafetyPlanLocation}
          readOnly={readOnly}
          onChange={(value) => patch({ siteSafetyPlanLocation: value })}
        />
      </FieldShell>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-xs font-semibold">{ICS204A_FIELD_LABELS.otherAttachments}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FieldShell label={ICS204A_FIELD_LABELS.mapChart}>
            <TextInput
              value={form.otherAttachments.mapChart}
              readOnly={readOnly}
              onChange={(value) => patchOtherAttachments({ mapChart: value })}
            />
          </FieldShell>
          <FieldShell label={ICS204A_FIELD_LABELS.weatherForecast}>
            <TextInput
              value={form.otherAttachments.weatherForecast}
              readOnly={readOnly}
              onChange={(value) => patchOtherAttachments({ weatherForecast: value })}
            />
          </FieldShell>
          <FieldShell label={ICS204A_FIELD_LABELS.tidesCurrents}>
            <TextInput
              value={form.otherAttachments.tidesCurrents}
              readOnly={readOnly}
              onChange={(value) => patchOtherAttachments({ tidesCurrents: value })}
            />
          </FieldShell>
        </div>
        <FieldShell label={ICS204A_FIELD_LABELS.otherAttachmentNotes}>
          {readOnly ? (
            <Ics204ReadOnlyTextBlock compact value={form.otherAttachments.notes} />
          ) : (
            <Textarea
              value={form.otherAttachments.notes}
              onChange={(event) => patchOtherAttachments({ notes: event.target.value })}
              className="min-h-16 text-xs"
            />
          )}
        </FieldShell>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldShell label={`${ICS204A_FIELD_LABELS.preparedBy} — ${ICS204A_FIELD_LABELS.name}`}>
          <TextInput
            value={form.preparedByName}
            readOnly={readOnly}
            onChange={(value) => patch({ preparedByName: value })}
          />
        </FieldShell>
        <FieldShell label={`${ICS204A_FIELD_LABELS.preparedBy} — ${ICS204A_FIELD_LABELS.dateTime}`}>
          <TextInput
            value={form.preparedByDateTime}
            readOnly={readOnly}
            onChange={(value) => patch({ preparedByDateTime: value })}
          />
        </FieldShell>
        <FieldShell label={`${ICS204A_FIELD_LABELS.reviewedByPsc} — ${ICS204A_FIELD_LABELS.name}`}>
          <TextInput
            value={form.reviewedByPscName}
            readOnly={readOnly}
            onChange={(value) => patch({ reviewedByPscName: value })}
          />
        </FieldShell>
        <FieldShell label={`${ICS204A_FIELD_LABELS.reviewedByPsc} — ${ICS204A_FIELD_LABELS.dateTime}`}>
          <TextInput
            value={form.reviewedByPscDateTime}
            readOnly={readOnly}
            onChange={(value) => patch({ reviewedByPscDateTime: value })}
          />
        </FieldShell>
        <FieldShell label={`${ICS204A_FIELD_LABELS.reviewedByOscIsc} — ${ICS204A_FIELD_LABELS.name}`}>
          <TextInput
            value={form.reviewedByOscIscName}
            readOnly={readOnly}
            onChange={(value) => patch({ reviewedByOscIscName: value })}
          />
        </FieldShell>
        <FieldShell label={`${ICS204A_FIELD_LABELS.reviewedByOscIsc} — ${ICS204A_FIELD_LABELS.dateTime}`}>
          <TextInput
            value={form.reviewedByOscIscDateTime}
            readOnly={readOnly}
            onChange={(value) => patch({ reviewedByOscIscDateTime: value })}
          />
        </FieldShell>
      </div>
    </div>
  )
}
