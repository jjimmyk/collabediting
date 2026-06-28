import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AssetRequestDetailPanel } from '@/features/resources/AssetRequestDetailPanel'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { AssetTransferResolveAsset, ResourceRequestItem } from '@/lib/ics-213rr-resource-request'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type AssetRequestDetailSheetProps = {
  request: ResourceRequestItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  roster?: WorkspaceRosterMember[]
  resolveAsset?: AssetTransferResolveAsset
  onApplyTransfers?: (request: ResourceRequestItem) => void
  onReplaceTransferAsset?: (
    request: ResourceRequestItem,
    oldAssetKey: string,
    newAsset: ResourceListItemData
  ) => void
  isApplyingTransfers?: boolean
  isReplacingTransferAsset?: boolean
}

export function AssetRequestDetailSheet({
  request,
  open,
  onOpenChange,
  organizationAssets = [],
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  roster = [],
  resolveAsset,
  onApplyTransfers,
  onReplaceTransferAsset,
  isApplyingTransfers = false,
  isReplacingTransferAsset = false,
}: AssetRequestDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="flex-row items-center justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0 text-left">
            <SheetTitle className="truncate text-base">
              {request ? request.requestNumber : 'Asset request'}
            </SheetTitle>
            <SheetDescription className="truncate">
              {request ? request.incidentName : 'Asset request details'}
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Close asset request details"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {request ? (
            <AssetRequestDetailPanel
              request={request}
              organizationAssets={organizationAssets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              workspaceOptions={workspaceOptions}
              positionCatalog={positionCatalog}
              roster={roster}
              resolveAsset={resolveAsset}
              onApplyTransfers={onApplyTransfers}
              onReplaceTransferAsset={onReplaceTransferAsset}
              isApplyingTransfers={isApplyingTransfers}
              isReplacingTransferAsset={isReplacingTransferAsset}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
