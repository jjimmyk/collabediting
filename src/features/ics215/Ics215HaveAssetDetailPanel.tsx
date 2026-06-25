import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  formatResourceCostPerUnit,
  formatResourceCostUnitType,
  getResourceWorkspaceAssignmentLabel,
} from '@/features/resources/utils'

function DetailField({ label, value }: { label: string; value: string | number }) {
  const display = typeof value === 'number' ? String(value) : value.trim()
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <p className="text-xs">{display.length > 0 ? display : '—'}</p>
    </div>
  )
}

type Ics215HaveAssetDetailPanelProps = {
  asset: ResourceListItemData | null
  matchReason?: string
}

export function Ics215HaveAssetDetailPanel({
  asset,
  matchReason,
}: Ics215HaveAssetDetailPanelProps) {
  if (!asset) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Select an asset to view details.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border">
      <div className="shrink-0 space-y-1 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
          <span className="text-sm font-medium">{asset.name}</span>
        </div>
        <p className="text-xs text-muted-foreground">{asset.type}</p>
        {matchReason ? (
          <p className="text-[11px] text-muted-foreground">{matchReason}</p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-1">
          <DetailField label="Owner" value={asset.owner} />
          <DetailField label="Status" value={asset.status} />
          <DetailField label="Team Lead" value={asset.teamLead} />
          <DetailField label="Location" value={asset.location} />
          <DetailField label="Current Location" value={asset.currentLocation} />
          <DetailField label="ETA" value={asset.eta} />
          <DetailField label="OPCON" value={asset.opcon} />
          <DetailField label="TACON" value={asset.tacon} />
          <DetailField label="Point of Contact" value={asset.pointOfContact} />
          <DetailField label="Owning Organization" value={asset.owningOrganization} />
          <DetailField label="Quantity" value={asset.quantity} />
          <DetailField label="Unit Type" value={asset.unitType} />
          <DetailField label="Unit Name" value={asset.unitName} />
          <DetailField label="Hull/Tail Number" value={asset.hullTailNumber} />
          <DetailField label="Symbology" value={asset.symbology} />
          <DetailField label="Latitude" value={asset.latitude} />
          <DetailField label="Longitude" value={asset.longitude} />
          <DetailField
            label="Cost Unit Type"
            value={formatResourceCostUnitType(asset.costUnitType)}
          />
          <DetailField label="Cost per Unit" value={formatResourceCostPerUnit(asset.costPerUnit)} />
          <DetailField
            label="Workspace"
            value={getResourceWorkspaceAssignmentLabel(asset) || 'Unassigned'}
          />
          <DetailField label="Current Op Period" value={asset.currentOpPeriod} />
          <DetailField label="Next Op Period" value={asset.nextOpPeriod} />
          <DetailField
            label="Current Op Period Assignment"
            value={asset.currentOpPeriodAssignment}
          />
          <DetailField label="Next Op Period Assignment" value={asset.nextOpPeriodAssignment} />
          <DetailField label="Check-In Status" value={asset.checkInStatus} />
          <div className="col-span-2 space-y-0.5 sm:col-span-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Capabilities
            </span>
            <p className="text-xs">
              {asset.capabilities.trim().length > 0 ? asset.capabilities : '—'}
            </p>
          </div>
          <div className="col-span-2 space-y-0.5 sm:col-span-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </span>
            <p className="text-xs">{asset.notes.trim().length > 0 ? asset.notes : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
