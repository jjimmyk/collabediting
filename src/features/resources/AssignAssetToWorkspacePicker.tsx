import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResourceListItemData } from '@/features/resources/types'

const PLACEHOLDER_VALUE = '__pick_asset__'

type AssignAssetToWorkspacePickerProps = {
  assets: ResourceListItemData[]
  disabled?: boolean
  label?: string
  onAssign: (assetKey: string) => void
}

export function AssignAssetToWorkspacePicker({
  assets,
  disabled = false,
  label = 'Assign asset',
  onAssign,
}: AssignAssetToWorkspacePickerProps) {
  const [value, setValue] = useState(PLACEHOLDER_VALUE)

  if (assets.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">All catalog assets are already assigned.</p>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (nextValue === PLACEHOLDER_VALUE) return
          onAssign(nextValue)
          setValue(PLACEHOLDER_VALUE)
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue placeholder="Select an unassigned asset" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PLACEHOLDER_VALUE} disabled>
            Select an unassigned asset
          </SelectItem>
          {assets.map((asset) => (
            <SelectItem key={asset.assetKey} value={asset.assetKey}>
              {asset.name} · {asset.type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
