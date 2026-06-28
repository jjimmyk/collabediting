import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ics204ReadOnlyTextBlock } from '@/features/ics204/Ics204SectionToolbar'
import { Ics204AssetRequestStatusBadges } from '@/features/ics204/Ics204AssetRequestStatusBadges'
import type { Ics204ResourceAssignedRow } from '@/features/ics204/types'
import { resolveIcs204ResourceSnapshot } from '@/features/ics204/utils'
import { is215SyncedResourceRow } from '@/features/ics204/sync-ics215-have-resources'
import { ResourceListItemReadOnlyDetails } from '@/features/resources/ResourceListItemReadOnlyDetails'
import type { AssetWorkspaceOption } from '@/features/resources/types'
import { isOrganizationManagedAssetKey } from '@/lib/organization-asset-catalog'
import type { AssetTransferResolveAsset, ResourceRequestItem } from '@/lib/ics-213rr-resource-request'

type Ics204ResourceAssignedRowDetailsProps = {
  row: Ics204ResourceAssignedRow
  linkedRequest?: ResourceRequestItem
  pendingWorkspaceAssignment?: boolean
  workspaceOptions?: AssetWorkspaceOption[]
  assetRequestsByStorageId?: Record<string, ResourceRequestItem>
  resolveAsset?: AssetTransferResolveAsset
  onOpenIcs204a?: (rowId: number) => void
}

export function Ics204ResourceAssignedRowDetails({
  row,
  linkedRequest,
  pendingWorkspaceAssignment = false,
  workspaceOptions = [],
  assetRequestsByStorageId,
  resolveAsset,
  onOpenIcs204a,
}: Ics204ResourceAssignedRowDetailsProps) {
  const resource = resolveIcs204ResourceSnapshot(row)
  const organizationManaged = row.assetKey
    ? isOrganizationManagedAssetKey(row.assetKey)
    : false

  return (
    <div className="space-y-3 border-t px-3 py-3 text-xs">
      <ResourceListItemReadOnlyDetails
        resource={resource}
        organizationManaged={organizationManaged}
        compact
      />

      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground">Reporting Info/Notes</p>
        <Ics204ReadOnlyTextBlock value={row.reportingInfoNotes} />
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground">ICS-204A</p>
        {row.has204A && onOpenIcs204a ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenIcs204a(row.id)}
          >
            Open 204A
          </Button>
        ) : (
          <p className="text-muted-foreground">—</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {assetRequestsByStorageId && workspaceOptions.length > 0 && resolveAsset ? (
          <Ics204AssetRequestStatusBadges
            row={row}
            assetRequestsByStorageId={assetRequestsByStorageId}
            workspaceOptions={workspaceOptions}
            resolveAsset={resolveAsset}
            pendingWorkspaceAssignment={pendingWorkspaceAssignment}
          />
        ) : null}
        {is215SyncedResourceRow(row) ? (
          <Badge variant="secondary" className="text-[10px]">
            From ICS-215 Have
          </Badge>
        ) : null}
        {row.manualRosterRef ? (
          <Badge variant="outline" className="text-[10px]">
            Manual roster
          </Badge>
        ) : null}
        {linkedRequest ? (
          <Badge variant="outline" className="text-[10px]">
            Asset request {linkedRequest.requestNumber}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

export function getIcs204ResourceAssignedRowKey(formId: string, rowId: number): string {
  return `${formId}-resource-${rowId}`
}
