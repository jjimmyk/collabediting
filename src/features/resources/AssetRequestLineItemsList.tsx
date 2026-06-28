import { AssetRequestLineItemForm } from '@/features/resources/AssetRequestLineItemForm'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { AssetRequestLineItem } from '@/lib/ics-213rr-resource-request'

type AssetRequestLineItemsListProps = {
  items: AssetRequestLineItem[]
  onChangeItem: (index: number, next: AssetRequestLineItem) => void
  onRemoveItem: (index: number) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses?: string
  targetWorkspaceId?: string | null
}

export function AssetRequestLineItemsList({
  items,
  onChangeItem,
  onRemoveItem,
  organizationAssets,
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  glassItemBorderClasses = '',
  targetWorkspaceId = null,
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
          workspaceOptions={workspaceOptions}
          positionCatalog={positionCatalog}
          glassItemBorderClasses={glassItemBorderClasses}
          targetWorkspaceId={targetWorkspaceId}
        />
      ))}
    </div>
  )
}
