import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AssetRequestLineItemsList } from '@/features/resources/AssetRequestLineItemsList'
import { AssetRequestLineItemsTable } from '@/features/resources/AssetRequestLineItemsTable'
import type { ResourceListItemData } from '@/features/resources/types'
import { createEmptyAssetRequestLineItem, type AssetRequestLineItem } from '@/lib/ics-213rr-resource-request'
import { LayoutList, Plus, Table2 } from 'lucide-react'

export type AssetRequestItemsView = 'list' | 'table'

type AssetRequestLineItemsSectionProps = {
  items: AssetRequestLineItem[]
  view: AssetRequestItemsView
  onViewChange: (view: AssetRequestItemsView) => void
  onChangeItems: (items: AssetRequestLineItem[]) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
}

export function AssetRequestLineItemsSection({
  items,
  view,
  onViewChange,
  onChangeItems,
  organizationAssets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
}: AssetRequestLineItemsSectionProps) {
  const updateItem = (index: number, next: AssetRequestLineItem) => {
    onChangeItems(items.map((item, itemIndex) => (itemIndex === index ? next : item)))
  }

  const removeItem = (index: number) => {
    onChangeItems(items.filter((_, itemIndex) => itemIndex !== index))
  }

  const addItem = () => {
    onChangeItems([...items, createEmptyAssetRequestLineItem()])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Requested items
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(next) => {
              if (next === 'list' || next === 'table') {
                onViewChange(next)
              }
            }}
            variant="outline"
            size="sm"
            aria-label="Requested items view"
          >
            <ToggleGroupItem value="list" className="gap-1 px-2.5 text-xs">
              <LayoutList className="h-3.5 w-3.5" />
              List view
            </ToggleGroupItem>
            <ToggleGroupItem value="table" className="gap-1 px-2.5 text-xs">
              <Table2 className="h-3.5 w-3.5" />
              Table view
            </ToggleGroupItem>
          </ToggleGroup>
          <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" />
            Add requested item
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <AssetRequestLineItemsList
          items={items}
          onChangeItem={updateItem}
          onRemoveItem={removeItem}
          organizationAssets={organizationAssets}
          orgAssetIdsByKey={orgAssetIdsByKey}
          glassItemBorderClasses={glassItemBorderClasses}
        />
      ) : (
        <AssetRequestLineItemsTable
          items={items}
          onChangeItem={updateItem}
          onRemoveItem={removeItem}
          organizationAssets={organizationAssets}
          orgAssetIdsByKey={orgAssetIdsByKey}
          glassItemBorderClasses={glassItemBorderClasses}
        />
      )}
    </div>
  )
}
