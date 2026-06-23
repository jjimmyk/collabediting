import { Button } from '@/components/ui/button'

type AssetsTabToolbarProps = {
  canManageAssets: boolean
  onAddAsset: () => void
}

export function AssetsTabToolbar({ canManageAssets, onAddAsset }: AssetsTabToolbarProps) {
  if (!canManageAssets) return null

  return (
    <Button type="button" size="sm" variant="outline" onClick={onAddAsset}>
      + Add Asset
    </Button>
  )
}
