import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssetTransferSelectedCards } from '@/features/resources/AssetTransferSelectedCards'
import type { ResourceListItemData } from '@/features/resources/types'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { Search } from 'lucide-react'

type OrganizationAssetPickerProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
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
  glassItemBorderClasses = '',
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
      .slice(0, 20)
  }, [assets, query, selectedKeys])

  const addAsset = (asset: ResourceListItemData) => {
    onChange([...selected, assetToTransferRef(asset, orgAssetIdsByKey)])
    setQuery('')
  }

  const removeAsset = (assetKey: string) => {
    onChange(selected.filter((ref) => ref.assetKey !== assetKey))
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={`${idPrefix}-search`} className="text-xs">
        Asset to transfer
      </Label>

      <AssetTransferSelectedCards
        selected={selected}
        organizationAssets={assets}
        glassItemBorderClasses={glassItemBorderClasses}
        onRemove={removeAsset}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${idPrefix}-search`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search organization assets to add"
          className="h-8 pl-7 text-xs"
        />
      </div>
      {assets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No organization assets available.</p>
      ) : filteredAssets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          {query.trim() ? 'No matching assets.' : 'All matching assets are already selected.'}
        </p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-1">
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
