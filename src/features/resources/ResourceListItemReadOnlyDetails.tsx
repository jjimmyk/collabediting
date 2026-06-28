import type { ReactNode } from 'react'
import { AlmisDataSourceIcon } from '@/features/resources/AlmisDataSourceIcon'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { UNASSIGNED_WORKSPACE_FIELD } from '@/features/resources/asset-workspace-assignment-display'
import {
  formatResourceCostPerUnit,
  formatResourceCostUnitType,
  getResourceWorkspaceAssignmentLabel,
} from '@/features/resources/utils'
import { cn } from '@/lib/utils'

function ResourceFieldLabel({ children }: { children: ReactNode }) {
  return <span className="font-medium">{children}</span>
}

function AlmisLockedValue({ children }: { children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
      {children}
      <AlmisDataSourceIcon />
    </p>
  )
}

function ReadOnlyField({
  label,
  value,
  organizationManaged = false,
}: {
  label: string
  value: string | number
  organizationManaged?: boolean
}) {
  const display = String(value ?? '').trim() || '—'
  return (
    <div className="space-y-1">
      <ResourceFieldLabel>{label}</ResourceFieldLabel>
      {organizationManaged ? (
        <AlmisLockedValue>
          <span>{display}</span>
        </AlmisLockedValue>
      ) : (
        <p>{display}</p>
      )}
    </div>
  )
}

export type ResourceListItemReadOnlyDetailsProps = {
  resource: ResourceListItemData
  organizationManaged?: boolean
  workspaceOptions?: AssetWorkspaceOption[]
  showWorkspaceAssignment?: boolean
  className?: string
  compact?: boolean
}

export function ResourceListItemReadOnlyDetails({
  resource,
  organizationManaged = false,
  showWorkspaceAssignment = true,
  className,
  compact = false,
}: ResourceListItemReadOnlyDetailsProps) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-2', compact ? 'text-xs' : 'text-sm', className)}
    >
      <ReadOnlyField
        label="Current Location:"
        value={resource.currentLocation}
        organizationManaged={organizationManaged}
      />
      <ReadOnlyField label="Datetime Ordered:" value={resource.datetimeOrdered} />
      <ReadOnlyField
        label="OPCON:"
        value={resource.opcon}
        organizationManaged={organizationManaged}
      />
      <ReadOnlyField label="TACON:" value={resource.tacon} />
      <ReadOnlyField label="Point of Contact:" value={resource.pointOfContact} />
      <ReadOnlyField label="Owning Organization:" value={resource.owningOrganization} />
      <ReadOnlyField label="Quantity:" value={resource.quantity} />
      <ReadOnlyField
        label="Unit Type:"
        value={resource.unitType}
        organizationManaged={organizationManaged}
      />
      <ReadOnlyField
        label="Unit Name:"
        value={resource.unitName}
        organizationManaged={organizationManaged}
      />
      <ReadOnlyField
        label="Cost Unit Type:"
        value={formatResourceCostUnitType(resource.costUnitType)}
      />
      <ReadOnlyField
        label="Cost per Unit:"
        value={formatResourceCostPerUnit(resource.costPerUnit)}
      />
      <ReadOnlyField label="Hull/Tail Number:" value={resource.hullTailNumber} />
      <ReadOnlyField label="Symbology:" value={resource.symbology} />
      <ReadOnlyField label="Lat:" value={resource.latitude} />
      <ReadOnlyField label="Long:" value={resource.longitude} />
      <div className="col-span-2 space-y-1">
        <ResourceFieldLabel>Capabilities:</ResourceFieldLabel>
        <p>{resource.capabilities.trim() || '—'}</p>
      </div>
      <div className="col-span-2 rounded-md border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Workspace Assignment
        </p>
        <div className="grid grid-cols-2 gap-2">
          {showWorkspaceAssignment ? (
            <div className="col-span-2 space-y-1">
              <ResourceFieldLabel>Incident / Exercise workspace:</ResourceFieldLabel>
              <p>{getResourceWorkspaceAssignmentLabel(resource) || 'Unassigned'}</p>
            </div>
          ) : null}
          <ReadOnlyField label="Current Op Period:" value={resource.currentOpPeriod} />
          <ReadOnlyField label="Next Op Period:" value={resource.nextOpPeriod} />
          <ReadOnlyField
            label="Current Op Period Assignment:"
            value={resource.currentOpPeriodAssignment}
          />
          <ReadOnlyField
            label="Next Op Period Assignment:"
            value={resource.nextOpPeriodAssignment}
          />
          <div className="space-y-1">
            <ResourceFieldLabel>Check-in Status:</ResourceFieldLabel>
            <p>
              {resource.checkInStatus && resource.checkInStatus !== UNASSIGNED_WORKSPACE_FIELD
                ? resource.checkInStatus
                : UNASSIGNED_WORKSPACE_FIELD}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
