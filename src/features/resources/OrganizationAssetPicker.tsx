import { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { AssetTransferSelectedCards } from '@/features/resources/AssetTransferSelectedCards'
import { OrganizationAssetBrowseList } from '@/features/resources/OrganizationAssetBrowseList'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  buildAssetRequestTransferRef,
  type AssetRequestTransferRef,
} from '@/lib/ics-213rr-resource-request'

export type OrganizationAssetPickerMode = 'multi' | 'replace-single'

type OrganizationAssetPickerProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
  selected: AssetRequestTransferRef[]
  onChange: (next: AssetRequestTransferRef[]) => void
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  idPrefix?: string
  mode?: OrganizationAssetPickerMode
  excludeAssetKeys?: string[]
  onReplaceSelect?: (asset: ResourceListItemData) => void
  showSelectedSection?: boolean
  browseLabel?: string
  selectedLabel?: string
}

export function assetToTransferRef(
  asset: ResourceListItemData,
  orgAssetIdsByKey: Record<string, string>
): AssetRequestTransferRef {
  return buildAssetRequestTransferRef({
    assetKey: asset.assetKey,
    organizationAssetId: orgAssetIdsByKey[asset.assetKey] ?? '',
    name: asset.name,
    type: asset.type,
  })
}

export function OrganizationAssetPicker({
  assets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
  selected,
  onChange,
  workspaceOptions = [],
  positionCatalog = null,
  idPrefix = 'asset-picker',
  mode = 'multi',
  excludeAssetKeys = [],
  onReplaceSelect,
  showSelectedSection = mode === 'multi',
  browseLabel = 'Browse organization assets',
  selectedLabel = 'Selected for transfer',
}: OrganizationAssetPickerProps) {
  const [query, setQuery] = useState('')

  const selectedKeys = useMemo(() => new Set(selected.map((ref) => ref.assetKey)), [selected])
  const excludeKeys = useMemo(() => new Set(excludeAssetKeys), [excludeAssetKeys])

  const addAsset = (asset: ResourceListItemData) => {
    if (mode === 'replace-single') {
      onReplaceSelect?.(asset)
      setQuery('')
      return
    }
    onChange([...selected, assetToTransferRef(asset, orgAssetIdsByKey)])
    setQuery('')
  }

  const removeAsset = (assetKey: string) => {
    onChange(selected.filter((ref) => ref.assetKey !== assetKey))
  }

  return (
    <div className="space-y-4">
      {showSelectedSection ? (
        <div className="space-y-2">
          <Label className="text-xs">{selectedLabel}</Label>
          <AssetTransferSelectedCards
            selected={selected}
            organizationAssets={assets}
            workspaceOptions={workspaceOptions}
            positionCatalog={positionCatalog}
            glassItemBorderClasses={glassItemBorderClasses}
            onRemove={removeAsset}
          />
        </div>
      ) : null}

      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs">{browseLabel}</Label>
        <OrganizationAssetBrowseList
          assets={assets}
          selectedKeys={selectedKeys}
          excludeKeys={excludeKeys}
          workspaceOptions={workspaceOptions}
          positionCatalog={positionCatalog}
          glassItemBorderClasses={glassItemBorderClasses}
          onAdd={addAsset}
          query={query}
          onQueryChange={setQuery}
          idPrefix={idPrefix}
        />
      </div>
    </div>
  )
}
