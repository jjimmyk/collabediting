import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ics213rrFieldRow, Ics213rrNumberedBox } from '@/features/resources/ics-213rr-form-layout'
import type {
  AssetRequestWorkspaceContext,
  CreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'

export type ResourceRequestIncidentOption = {
  name: string
  location: [number, number]
}

type AssetRequestIncidentDetailsFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  incidentOptions?: ResourceRequestIncidentOption[]
  previewRequestNumber: string
  workspaceContext?: AssetRequestWorkspaceContext | null
  idPrefix?: string
}

export function AssetRequestIncidentDetailsForm({
  value,
  onChange,
  incidentOptions = [],
  previewRequestNumber,
  workspaceContext = null,
  idPrefix = 'asset-request-incident',
}: AssetRequestIncidentDetailsFormProps) {
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

  const isWorkspaceLocked = workspaceContext != null

  return (
    <Ics213rrNumberedBox title="Incident details">
      {isWorkspaceLocked ? (
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {workspaceContext.workspaceKind === 'exercise'
              ? 'Exercise workspace'
              : 'Incident workspace'}
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            Linked to this workspace; incident name cannot be changed.
          </p>
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Ics213rrFieldRow label="1. Incident name" htmlFor={`${idPrefix}-incident-name`}>
          {isWorkspaceLocked ? (
            <Input
              id={`${idPrefix}-incident-name`}
              value={workspaceContext.workspaceName}
              readOnly
              className="h-9 bg-muted/40 text-xs"
            />
          ) : incidentOptions.length > 0 ? (
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
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="2. Date/time initiated" htmlFor={`${idPrefix}-date-initiated`}>
          <Input
            id={`${idPrefix}-date-initiated`}
            value={value.dateTimeInitiated}
            onChange={(event) => patch({ dateTimeInitiated: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="3. Resource request number" htmlFor={`${idPrefix}-request-number`}>
          <Input
            id={`${idPrefix}-request-number`}
            value={previewRequestNumber}
            readOnly
            className="h-9 bg-muted/40 text-xs"
            aria-describedby={`${idPrefix}-request-number-help`}
          />
          <p id={`${idPrefix}-request-number-help`} className="text-[10px] text-muted-foreground">
            Assigned on save
          </p>
        </Ics213rrFieldRow>
      </div>
    </Ics213rrNumberedBox>
  )
}
