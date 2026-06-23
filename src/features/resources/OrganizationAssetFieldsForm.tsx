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
  ASSET_STATUS_OPTIONS,
  type ResourceCostUnitType,
} from '@/features/resources/types'
import {
  defaultOrganizationAssetExtendedFields,
  type CreateOrganizationAssetInput,
  type OrganizationAssetExtendedFields,
} from '@/lib/organization-asset-catalog'

type OrganizationAssetFieldsFormProps = {
  value: CreateOrganizationAssetInput
  onChange: (next: CreateOrganizationAssetInput) => void
  idPrefix?: string
}

const DEPLOYMENT_STATUS_OPTIONS = ['Available', 'Staged', 'Assigned'] as const
const COST_UNIT_TYPE_OPTIONS: ResourceCostUnitType[] = ['per day', 'per hour', 'to purchase']
const AREA_OPTIONS = [
  { value: 'atlantic', label: 'Atlantic' },
  { value: 'pacific', label: 'Pacific' },
] as const

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function mergeDefaults(value: CreateOrganizationAssetInput): CreateOrganizationAssetInput {
  const defaults = defaultOrganizationAssetExtendedFields()
  return {
    ...defaults,
    ...value,
    mapLocation: value.mapLocation ?? [0, 0],
  }
}

export function createEmptyOrganizationAssetInput(): CreateOrganizationAssetInput {
  return {
    name: '',
    type: '',
    owner: '',
    assetStatus: 'FMC',
    location: '',
    notes: '',
    areaKey: 'atlantic',
    mapLocation: [0, 0],
    ...defaultOrganizationAssetExtendedFields(),
  }
}

export function OrganizationAssetFieldsForm({
  value,
  onChange,
  idPrefix = 'org-asset',
}: OrganizationAssetFieldsFormProps) {
  const fields = mergeDefaults(value)

  const patch = (patchValue: Partial<CreateOrganizationAssetInput>) => {
    onChange({ ...fields, ...patchValue })
  }

  const patchExtended = (patchValue: Partial<OrganizationAssetExtendedFields>) => {
    onChange({ ...fields, ...patchValue })
  }

  const [mapLng, mapLat] = fields.mapLocation ?? [0, 0]

  return (
    <div className="space-y-4">
      <FieldGroup title="Identity">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={`${idPrefix}-name`}>Name</Label>
            <Input
              id={`${idPrefix}-name`}
              value={fields.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="e.g. USCGC Forward"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-type`}>Type</Label>
            <Input
              id={`${idPrefix}-type`}
              value={fields.type}
              onChange={(event) => patch({ type: event.target.value })}
              placeholder="e.g. Medium Endurance Cutter"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-owner`}>Owner</Label>
            <Input
              id={`${idPrefix}-owner`}
              value={fields.owner ?? ''}
              onChange={(event) => patch({ owner: event.target.value })}
              placeholder="Owning unit"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Asset status</Label>
            <Select
              value={fields.assetStatus ?? 'FMC'}
              onValueChange={(nextValue) =>
                patch({ assetStatus: nextValue as (typeof ASSET_STATUS_OPTIONS)[number] })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Deployment status</Label>
            <Select
              value={fields.status ?? 'Available'}
              onValueChange={(nextValue) =>
                patchExtended({ status: nextValue as (typeof DEPLOYMENT_STATUS_OPTIONS)[number] })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPLOYMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Area</Label>
            <Select
              value={fields.areaKey ?? 'atlantic'}
              onValueChange={(nextValue) =>
                patch({ areaKey: nextValue as 'atlantic' | 'pacific' })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-team-lead`}>Team lead</Label>
            <Input
              id={`${idPrefix}-team-lead`}
              value={fields.teamLead ?? ''}
              onChange={(event) => patchExtended({ teamLead: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-eta`}>ETA</Label>
            <Input
              id={`${idPrefix}-eta`}
              value={fields.eta ?? ''}
              onChange={(event) => patchExtended({ eta: event.target.value })}
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Location">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={`${idPrefix}-location`}>Location</Label>
            <Input
              id={`${idPrefix}-location`}
              value={fields.location ?? ''}
              onChange={(event) => patch({ location: event.target.value })}
              placeholder="Current location"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor={`${idPrefix}-current-location`}>Current location (detail)</Label>
            <Input
              id={`${idPrefix}-current-location`}
              value={fields.currentLocation ?? ''}
              onChange={(event) => patchExtended({ currentLocation: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-latitude`}>Latitude</Label>
            <Input
              id={`${idPrefix}-latitude`}
              value={fields.latitude ?? ''}
              onChange={(event) => patchExtended({ latitude: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-longitude`}>Longitude</Label>
            <Input
              id={`${idPrefix}-longitude`}
              value={fields.longitude ?? ''}
              onChange={(event) => patchExtended({ longitude: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-map-lng`}>Map longitude</Label>
            <Input
              id={`${idPrefix}-map-lng`}
              type="number"
              value={mapLng}
              onChange={(event) =>
                patch({ mapLocation: [Number(event.target.value) || 0, mapLat] })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-map-lat`}>Map latitude</Label>
            <Input
              id={`${idPrefix}-map-lat`}
              type="number"
              value={mapLat}
              onChange={(event) =>
                patch({ mapLocation: [mapLng, Number(event.target.value) || 0] })
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Operations">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-datetime-ordered`}>Datetime ordered</Label>
            <Input
              id={`${idPrefix}-datetime-ordered`}
              value={fields.datetimeOrdered ?? ''}
              onChange={(event) => patchExtended({ datetimeOrdered: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-opcon`}>OPCON</Label>
            <Input
              id={`${idPrefix}-opcon`}
              value={fields.opcon ?? ''}
              onChange={(event) => patchExtended({ opcon: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-tacon`}>TACON</Label>
            <Input
              id={`${idPrefix}-tacon`}
              value={fields.tacon ?? ''}
              onChange={(event) => patchExtended({ tacon: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-poc`}>Point of contact</Label>
            <Input
              id={`${idPrefix}-poc`}
              value={fields.pointOfContact ?? ''}
              onChange={(event) => patchExtended({ pointOfContact: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-owning-org`}>Owning organization</Label>
            <Input
              id={`${idPrefix}-owning-org`}
              value={fields.owningOrganization ?? ''}
              onChange={(event) => patchExtended({ owningOrganization: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
            <Input
              id={`${idPrefix}-quantity`}
              type="number"
              value={fields.quantity ?? 1}
              onChange={(event) => patchExtended({ quantity: Number(event.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-unit-type`}>Unit type</Label>
            <Input
              id={`${idPrefix}-unit-type`}
              value={fields.unitType ?? ''}
              onChange={(event) => patchExtended({ unitType: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-unit-name`}>Unit name</Label>
            <Input
              id={`${idPrefix}-unit-name`}
              value={fields.unitName ?? ''}
              onChange={(event) => patchExtended({ unitName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cost unit type</Label>
            <Select
              value={fields.costUnitType ?? 'per day'}
              onValueChange={(nextValue) =>
                patchExtended({ costUnitType: nextValue as ResourceCostUnitType })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_UNIT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-cost-per-unit`}>Cost per unit</Label>
            <Input
              id={`${idPrefix}-cost-per-unit`}
              type="number"
              value={fields.costPerUnit ?? 0}
              onChange={(event) => patchExtended({ costPerUnit: Number(event.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-hull-tail`}>Hull/tail number</Label>
            <Input
              id={`${idPrefix}-hull-tail`}
              value={fields.hullTailNumber ?? ''}
              onChange={(event) => patchExtended({ hullTailNumber: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-symbology`}>Symbology</Label>
            <Input
              id={`${idPrefix}-symbology`}
              value={fields.symbology ?? ''}
              onChange={(event) => patchExtended({ symbology: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-current-op-period`}>Current op period</Label>
            <Input
              id={`${idPrefix}-current-op-period`}
              value={fields.currentOpPeriod ?? ''}
              onChange={(event) => patchExtended({ currentOpPeriod: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-next-op-period`}>Next op period</Label>
            <Input
              id={`${idPrefix}-next-op-period`}
              value={fields.nextOpPeriod ?? ''}
              onChange={(event) => patchExtended({ nextOpPeriod: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-current-op-assignment`}>Current op period assignment</Label>
            <Input
              id={`${idPrefix}-current-op-assignment`}
              value={fields.currentOpPeriodAssignment ?? ''}
              onChange={(event) =>
                patchExtended({ currentOpPeriodAssignment: event.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-next-op-assignment`}>Next op period assignment</Label>
            <Input
              id={`${idPrefix}-next-op-assignment`}
              value={fields.nextOpPeriodAssignment ?? ''}
              onChange={(event) => patchExtended({ nextOpPeriodAssignment: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-check-in-status`}>Check-in status</Label>
            <Input
              id={`${idPrefix}-check-in-status`}
              value={fields.checkInStatus ?? ''}
              onChange={(event) => patchExtended({ checkInStatus: event.target.value })}
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Notes & capabilities">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
            <Textarea
              id={`${idPrefix}-notes`}
              value={fields.notes ?? ''}
              onChange={(event) => patch({ notes: event.target.value })}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-capabilities`}>Capabilities</Label>
            <Textarea
              id={`${idPrefix}-capabilities`}
              value={fields.capabilities ?? ''}
              onChange={(event) => patchExtended({ capabilities: event.target.value })}
              rows={3}
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  )
}
