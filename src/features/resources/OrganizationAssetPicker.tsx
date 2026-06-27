import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ResourceListItemData } from '@/features/resources/types'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { Search, X } from 'lucide-react'

type OrganizationAssetPickerProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  selected: AssetRequestTransferRef[]
  onChange: (next: AssetRequestTransferRef[]) => void
  idPrefix?: string
}

function assetToTransferRef(
  asset: ResourceListItemData,
  orgAssetIdsByKey: Record<string, string>
): AssetRequestTransferRef {
  return {
    assetKey: asset.assetKey,
    organizationAssetId: orgAssetIdsByKey[asset.assetKey] ?? '',
    name: asset.name,
    type: asset.type,
  }
}

export function OrganizationAssetPicker({
  assets,
  orgAssetIdsByKey = {},
  selected,
  onChange,
  idPrefix = 'asset-picker',
}: OrganizationAssetPickerProps) {
  const [query, setQuery] = useState('')

  const selectedKeys = useMemo(() => new Set(selected.map((ref) => ref.assetKey)), [selected])

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return assets
      .filter((asset) => !selectedKeys.has(asset.assetKey))
      .filter((asset) => {
        if (!normalized) return true
        return [asset.name, asset.type, asset.owner, asset.location, asset.assetKey]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      })
      .slice(0, 8)
  }, [assets, query, selectedKeys])

  const addAsset = (asset: ResourceListItemData) => {
    onChange([...selected, assetToTransferRef(asset, orgAssetIdsByKey)])
    setQuery('')
  }

  const removeAsset = (assetKey: string) => {
    onChange(selected.filter((ref) => ref.assetKey !== assetKey))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-search`} className="text-xs">
        Asset to transfer
      </Label>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ref) => (
            <Badge key={ref.assetKey} variant="secondary" className="gap-1 pr-1 text-[11px]">
              {ref.name} · {ref.type}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                aria-label={`Remove ${ref.name}`}
                onClick={() => removeAsset(ref.assetKey)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No assets selected for transfer.</p>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${idPrefix}-search`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search organization assets"
          className="h-8 pl-7 text-xs"
        />
      </div>
      {assets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No organization assets available.</p>
      ) : filteredAssets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No matching assets.</p>
      ) : (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
          {filteredAssets.map((asset) => (
            <Button
              key={asset.assetKey}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-left text-xs"
              onClick={() => addAsset(asset)}
            >
              <span className="truncate">
                {asset.name} · {asset.type}
                {asset.location ? (
                  <span className="text-muted-foreground"> · {asset.location}</span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
