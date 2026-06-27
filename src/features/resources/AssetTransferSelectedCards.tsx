import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Item, ItemContent, ItemTitle } from '@/components/ui/item'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import type { ResourceListItemData } from '@/features/resources/types'
import { isOrganizationManagedAssetKey } from '@/lib/organization-asset-catalog'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type AssetTransferSelectedCardsProps = {
  selected: AssetRequestTransferRef[]
  organizationAssets: ResourceListItemData[]
  glassItemBorderClasses: string
  onRemove: (assetKey: string) => void
}

export function AssetTransferSelectedCards({
  selected,
  organizationAssets,
  glassItemBorderClasses,
  onRemove,
}: AssetTransferSelectedCardsProps) {
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)

  const assetsByKey = useMemo(
    () => new Map(organizationAssets.map((asset) => [asset.assetKey, asset])),
    [organizationAssets]
  )

  if (selected.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">No assets selected for transfer.</p>
    )
  }

  return (
    <div className="space-y-2">
      <AssetListHeaderRow />
      {selected.map((ref) => {
        const asset = assetsByKey.get(ref.assetKey)
        const isOpen = expandedAssetKey === ref.assetKey

        if (!asset) {
          return (
            <Item
              key={ref.assetKey}
              variant="outline"
              className={cn('flex items-center justify-between gap-2 px-3 py-2', glassItemBorderClasses)}
            >
              <ItemContent>
                <ItemTitle className="text-xs">
                  Unknown asset · {ref.name || ref.assetKey}
                </ItemTitle>
              </ItemContent>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label={`Remove ${ref.name || ref.assetKey}`}
                onClick={() => onRemove(ref.assetKey)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Item>
          )
        }

        return (
          <ResourceListItemCard
            key={ref.assetKey}
            resource={asset}
            glassItemBorderClasses={glassItemBorderClasses}
            editable={false}
            showEditButton={false}
            showMapAction={false}
            showInlineAssignment={false}
            readOnlyWorkspaceAssignmentFields
            organizationManaged={isOrganizationManagedAssetKey(asset.assetKey)}
            open={isOpen}
            onOpenChange={(open) => setExpandedAssetKey(open ? ref.assetKey : null)}
            onHeaderClick={() =>
              setExpandedAssetKey((previous) => (previous === ref.assetKey ? null : ref.assetKey))
            }
            headerActions={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Remove ${asset.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(ref.assetKey)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            }
          />
        )
      })}
    </div>
  )
}
