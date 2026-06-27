import { AssetRequestLineItemForm } from '@/features/resources/AssetRequestLineItemForm'
import type { ResourceListItemData } from '@/features/resources/types'
import type { AssetRequestLineItem } from '@/lib/ics-213rr-resource-request'

type AssetRequestLineItemsListProps = {
  items: AssetRequestLineItem[]
  onChangeItem: (index: number, next: AssetRequestLineItem) => void
  onRemoveItem: (index: number) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
}

export function AssetRequestLineItemsList({
  items,
  onChangeItem,
  onRemoveItem,
  organizationAssets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
}: AssetRequestLineItemsListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <AssetRequestLineItemForm
          key={item.id}
          index={index}
          value={item}
          onChange={(next) => onChangeItem(index, next)}
          onRemove={() => onRemoveItem(index)}
          canRemove={items.length > 1}
          organizationAssets={organizationAssets}
          orgAssetIdsByKey={orgAssetIdsByKey}
          glassItemBorderClasses={glassItemBorderClasses}
        />
      ))}
    </div>
  )
}
