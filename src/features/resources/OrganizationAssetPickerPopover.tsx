import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { OrganizationAssetPicker } from '@/features/resources/OrganizationAssetPicker'
import type { ResourceListItemData } from '@/features/resources/types'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { Package } from 'lucide-react'

type OrganizationAssetPickerPopoverProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
  selected: AssetRequestTransferRef[]
  onChange: (next: AssetRequestTransferRef[]) => void
  idPrefix: string
}

export function OrganizationAssetPickerPopover({
  assets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
  selected,
  onChange,
  idPrefix,
}: OrganizationAssetPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 whitespace-nowrap px-2 text-xs"
          aria-label="Select assets to transfer"
        >
          <Package className="h-3.5 w-3.5" />
          {selected.length === 0 ? (
            'Add assets'
          ) : (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] p-3">
        <OrganizationAssetPicker
          assets={assets}
          orgAssetIdsByKey={orgAssetIdsByKey}
          glassItemBorderClasses={glassItemBorderClasses}
          selected={selected}
          onChange={onChange}
          idPrefix={idPrefix}
        />
      </PopoverContent>
    </Popover>
  )
}
