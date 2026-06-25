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
  if (!canManageAssets) return null

  if (panelView === 'resource-requests') {
    return (
      <Button type="button" size="sm" variant="outline" onClick={onCreateAssetRequest}>
        + Create Asset Request
      </Button>
    )
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={onAddAsset}>
      + Add Asset
    </Button>
  )
}
