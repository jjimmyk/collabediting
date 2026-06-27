import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

export type ResourceRequestIncidentOption = {
  name: string
  location: [number, number]
}

type AssetRequestHeaderFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  incidentOptions?: ResourceRequestIncidentOption[]
  idPrefix?: string
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function AssetRequestHeaderForm({
  value,
  onChange,
  incidentOptions = [],
  idPrefix = 'asset-request',
}: AssetRequestHeaderFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  const applyIncidentSelection = (incidentName: string) => {
    const incident = incidentOptions.find((option) => option.name === incidentName)
    patch({
      incidentName,
      mapLocation: incident?.location ?? value.mapLocation,
    })
  }

  return (
    <div className="space-y-3">
      <FieldGroup title="Incident">
        <FieldRow label="Incident name" htmlFor={`${idPrefix}-incident-name`}>
          {incidentOptions.length > 0 ? (
            <Select
              value={value.incidentName || undefined}
              onValueChange={(next) => applyIncidentSelection(next)}
            >
              <SelectTrigger id={`${idPrefix}-incident-name`} className="h-9 text-xs">
                <SelectValue placeholder="Select incident" />
              </SelectTrigger>
              <SelectContent>
                {incidentOptions.map((incident) => (
                  <SelectItem key={incident.name} value={incident.name} className="text-xs">
                    {incident.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`${idPrefix}-incident-name`}
              value={value.incidentName}
              onChange={(event) => patch({ incidentName: event.target.value })}
              className="h-9 text-xs"
              placeholder="Incident name"
            />
          )}
        </FieldRow>
        <FieldRow label="Date/time initiated" htmlFor={`${idPrefix}-date-initiated`}>
          <Input
            id={`${idPrefix}-date-initiated`}
            value={value.dateTimeInitiated}
            onChange={(event) => patch({ dateTimeInitiated: event.target.value })}
            className="h-9 text-xs"
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Requested by">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Name" htmlFor={`${idPrefix}-requested-by-name`}>
            <Input
              id={`${idPrefix}-requested-by-name`}
              value={value.requestedByName}
              onChange={(event) => patch({ requestedByName: event.target.value })}
              className="h-9 text-xs"
            />
          </FieldRow>
          <FieldRow label="Position" htmlFor={`${idPrefix}-requested-by-position`}>
            <Input
              id={`${idPrefix}-requested-by-position`}
              value={value.requestedByPosition}
              onChange={(event) => patch({ requestedByPosition: event.target.value })}
              className="h-9 text-xs"
            />
          </FieldRow>
        </div>
        <FieldRow label="Date/time" htmlFor={`${idPrefix}-requested-by-datetime`}>
          <Input
            id={`${idPrefix}-requested-by-datetime`}
            value={value.requestedByDateTime}
            onChange={(event) => patch({ requestedByDateTime: event.target.value })}
            className="h-9 text-xs"
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Notes">
        <FieldRow label="Notes" htmlFor={`${idPrefix}-notes`}>
          <Textarea
            id={`${idPrefix}-notes`}
            value={value.notes}
            onChange={(event) => patch({ notes: event.target.value })}
            className="min-h-16 text-xs"
          />
        </FieldRow>
      </FieldGroup>
    </div>
  )
}
