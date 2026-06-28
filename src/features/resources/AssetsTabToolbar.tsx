import { Button } from '@/components/ui/button'

type AssetsTabToolbarProps = {
  panelView: 'resources' | 'resource-requests'
  canManageAssets: boolean
  onAddAsset: () => void
  onCreateAssetRequest: () => void
}

export function AssetsTabToolbar({
  panelView,
  canManageAssets,
  onAddAsset,
  onCreateAssetRequest,
}: AssetsTabToolbarProps) {
  if (panelView === 'resource-requests') {
    return (
      <Button type="button" size="sm" variant="outline" onClick={onCreateAssetRequest}>
        + Create Asset Request
      </Button>
    )
  }

  if (!canManageAssets) return null

  return (
    <Button type="button" size="sm" variant="outline" onClick={onAddAsset}>
      + Add Asset
    </Button>
  )
}
