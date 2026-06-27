import { Button } from '@/components/ui/button'
import { AssetRequestLineItemFields } from '@/features/resources/AssetRequestLineItemFields'
import type { ResourceListItemData } from '@/features/resources/types'
import type { AssetRequestLineItem } from '@/lib/ics-213rr-resource-request'
import { Trash2 } from 'lucide-react'

type AssetRequestLineItemFormProps = {
  index: number
  value: AssetRequestLineItem
  onChange: (next: AssetRequestLineItem) => void
  onRemove?: () => void
  canRemove: boolean
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
  idPrefix?: string
}

export function AssetRequestLineItemForm({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  organizationAssets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
  idPrefix = 'asset-request-item',
}: AssetRequestLineItemFormProps) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Requested item {index + 1}
        </p>
        {canRemove && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>

      <AssetRequestLineItemFields
        index={index}
        value={value}
        onChange={onChange}
        organizationAssets={organizationAssets}
        orgAssetIdsByKey={orgAssetIdsByKey}
        glassItemBorderClasses={glassItemBorderClasses}
        idPrefix={idPrefix}
      />
    </div>
  )
}
