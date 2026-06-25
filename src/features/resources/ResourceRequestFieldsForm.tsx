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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreateResourceRequestInput, Ics213rrOrderPriority } from '@/lib/ics-213rr-resource-request'

export type ResourceRequestIncidentOption = {
  name: string
  location: [number, number]
}

type ResourceRequestFieldsFormProps = {
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

export function ResourceRequestFieldsForm({
  value,
  onChange,
  incidentOptions = [],
  idPrefix = 'asset-request',
}: ResourceRequestFieldsFormProps) {
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

      <FieldGroup title="Order">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Quantity" htmlFor={`${idPrefix}-quantity`}>
            <Input
              id={`${idPrefix}-quantity`}
              type="number"
              min={1}
              value={value.orderQuantity}
              onChange={(event) =>
                patch({ orderQuantity: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })
              }
              className="h-9 text-xs"
            />
          </FieldRow>
          <FieldRow label="Priority" htmlFor={`${idPrefix}-priority`}>
            <Select
              value={value.orderPriority}
              onValueChange={(next) => patch({ orderPriority: next as Ics213rrOrderPriority })}
            >
              <SelectTrigger id={`${idPrefix}-priority`} className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="R" className="text-xs">
                  Routine (R)
                </SelectItem>
                <SelectItem value="U" className="text-xs">
                  Urgent (U)
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Kind" htmlFor={`${idPrefix}-kind`}>
            <Input
              id={`${idPrefix}-kind`}
              value={value.orderKind}
              onChange={(event) => patch({ orderKind: event.target.value })}
              className="h-9 text-xs"
              placeholder="Teams, Equipment, etc."
            />
          </FieldRow>
          <FieldRow label="Type" htmlFor={`${idPrefix}-type`}>
            <Input
              id={`${idPrefix}-type`}
              value={value.orderType}
              onChange={(event) => patch({ orderType: event.target.value })}
              className="h-9 text-xs"
              placeholder="Resource type"
            />
          </FieldRow>
        </div>
        <FieldRow label="Detailed description" htmlFor={`${idPrefix}-description`}>
          <Textarea
            id={`${idPrefix}-description`}
            value={value.orderDetailedDescription}
            onChange={(event) => patch({ orderDetailedDescription: event.target.value })}
            className="min-h-20 text-xs"
          />
        </FieldRow>
        <FieldRow label="Requested reporting location" htmlFor={`${idPrefix}-reporting-location`}>
          <Input
            id={`${idPrefix}-reporting-location`}
            value={value.orderRequestedReportingLocation}
            onChange={(event) => patch({ orderRequestedReportingLocation: event.target.value })}
            className="h-9 text-xs"
          />
        </FieldRow>
        <FieldRow label="Location date/time" htmlFor={`${idPrefix}-location-datetime`}>
          <Input
            id={`${idPrefix}-location-datetime`}
            value={value.orderLocationDateTime}
            onChange={(event) => patch({ orderLocationDateTime: event.target.value })}
            className="h-9 text-xs"
          />
        </FieldRow>
      </FieldGroup>

      <FieldGroup title="Suggested sources">
        <FieldRow label="Sources and substitutes" htmlFor={`${idPrefix}-sources`}>
          <Textarea
            id={`${idPrefix}-sources`}
            value={value.suggestedSourcesAndSubstitutes}
            onChange={(event) => patch({ suggestedSourcesAndSubstitutes: event.target.value })}
            className="min-h-16 text-xs"
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

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-muted/10 px-3 py-2 text-left text-xs font-semibold">
          Approval and workflow (optional)
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <FieldGroup title="Section chief approval">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Name" htmlFor={`${idPrefix}-section-chief-name`}>
                <Input
                  id={`${idPrefix}-section-chief-name`}
                  value={value.sectionChiefApprovalName}
                  onChange={(event) => patch({ sectionChiefApprovalName: event.target.value })}
                  className="h-9 text-xs"
                />
              </FieldRow>
              <FieldRow label="Position" htmlFor={`${idPrefix}-section-chief-position`}>
                <Input
                  id={`${idPrefix}-section-chief-position`}
                  value={value.sectionChiefApprovalPosition}
                  onChange={(event) => patch({ sectionChiefApprovalPosition: event.target.value })}
                  className="h-9 text-xs"
                />
              </FieldRow>
            </div>
          </FieldGroup>

          <FieldGroup title="Logistics">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Order # (LSC)" htmlFor={`${idPrefix}-order-number-lsc`}>
                <Input
                  id={`${idPrefix}-order-number-lsc`}
                  value={value.orderNumberLsc}
                  onChange={(event) => patch({ orderNumberLsc: event.target.value })}
                  className="h-9 text-xs"
                />
              </FieldRow>
              <FieldRow label="ETA (LSC)" htmlFor={`${idPrefix}-eta-lsc`}>
                <Input
                  id={`${idPrefix}-eta-lsc`}
                  value={value.orderEtaLsc}
                  onChange={(event) => patch({ orderEtaLsc: event.target.value })}
                  className="h-9 text-xs"
                />
              </FieldRow>
            </div>
            <FieldRow label="Supplier contact" htmlFor={`${idPrefix}-supplier`}>
              <Input
                id={`${idPrefix}-supplier`}
                value={value.supplierNamePhoneFaxEmail}
                onChange={(event) => patch({ supplierNamePhoneFaxEmail: event.target.value })}
                className="h-9 text-xs"
              />
            </FieldRow>
          </FieldGroup>

          <FieldGroup title="Finance">
            <FieldRow label="Reply comments" htmlFor={`${idPrefix}-finance-comments`}>
              <Textarea
                id={`${idPrefix}-finance-comments`}
                value={value.financeReplyComments}
                onChange={(event) => patch({ financeReplyComments: event.target.value })}
                className="min-h-16 text-xs"
              />
            </FieldRow>
          </FieldGroup>
        </CollapsibleContent>
      </Collapsible>

      <p className={cn('text-[10px] text-muted-foreground')}>
        New requests start in Pending status. Request number is assigned on create.
      </p>
    </div>
  )
}
