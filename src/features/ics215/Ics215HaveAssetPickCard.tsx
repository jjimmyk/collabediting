import { useState } from 'react'
import { ChevronDown, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { Ics215HaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { formatHaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import {
  formatResourceCostPerUnit,
  formatResourceCostUnitType,
  getResourceWorkspaceAssignmentLabel,
} from '@/features/resources/utils'
import { cn } from '@/lib/utils'

type Ics215HaveAssetPickCardProps = {
  entry: ScoredWorkspaceAsset
  checked: boolean
  disabled?: boolean
  linkedToThisCell?: boolean
  linkedElsewhere?: Ics215HaveAssetLinkLocation
  onToggle: () => void
  onUnlinkFromElsewhere?: () => void
}

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

export function Ics215HaveAssetPickCard({
  entry,
  checked,
  disabled = false,
  linkedToThisCell = false,
  linkedElsewhere,
  onToggle,
  onUnlinkFromElsewhere,
}: Ics215HaveAssetPickCardProps) {
  const [open, setOpen] = useState(false)
  const asset = entry.asset
  const blockedByOtherCell = Boolean(linkedElsewhere) && !linkedToThisCell

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-md border',
          checked && 'border-primary/40 bg-primary/5',
          blockedByOtherCell && 'opacity-80',
          disabled && !blockedByOtherCell && 'opacity-70'
        )}
      >
        <div className="flex items-start gap-2 px-3 py-2">
          <Checkbox
            checked={checked}
            disabled={disabled || blockedByOtherCell}
            onCheckedChange={onToggle}
            className="mt-1"
            aria-label={`Select ${asset.name}`}
            onClick={(event) => event.stopPropagation()}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
              <span className="text-sm font-medium">{asset.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {asset.type}
              </Badge>
              {linkedToThisCell ? (
                <Badge variant="secondary" className="text-[10px]">
                  Linked here
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {asset.unitName || asset.unitType || asset.owner || 'Assigned asset'}
            </p>
            {entry.matchReason ? (
              <p className="text-[11px] text-muted-foreground">{entry.matchReason}</p>
            ) : null}
            {linkedElsewhere ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Assigned to {formatHaveAssetLinkLocation(linkedElsewhere)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {linkedToThisCell && checked ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggle()
                }}
              >
                <Unlink className="h-3 w-3" />
                Unlink
              </Button>
            ) : null}
            {blockedByOtherCell && onUnlinkFromElsewhere ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  onUnlinkFromElsewhere()
                }}
              >
                <Unlink className="h-3 w-3" />
                Unlink there
              </Button>
            ) : null}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Toggle details for ${asset.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t px-3 py-3 sm:grid-cols-3">
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
            <DetailField
              label="Cost per Unit"
              value={formatResourceCostPerUnit(asset.costPerUnit)}
            />
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
            <div className="col-span-2 space-y-0.5 sm:col-span-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Capabilities
              </span>
              <p className="text-xs">{asset.capabilities.trim().length > 0 ? asset.capabilities : '—'}</p>
            </div>
            <div className="col-span-2 space-y-0.5 sm:col-span-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </span>
              <p className="text-xs">{asset.notes.trim().length > 0 ? asset.notes : '—'}</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
