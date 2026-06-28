import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { OrganizationAssetPickerDialog } from '@/features/resources/OrganizationAssetPickerDialog'

type OrganizationAssetPickerPopoverProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
  selected: AssetRequestTransferRef[]
  onChange: (next: AssetRequestTransferRef[]) => void
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  idPrefix: string
  targetWorkspaceId?: string | null
}

export function OrganizationAssetPickerPopover({
  assets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
  selected,
  onChange,
  workspaceOptions = [],
  positionCatalog = null,
  idPrefix,
  targetWorkspaceId = null,
}: OrganizationAssetPickerPopoverProps) {
  return (
    <OrganizationAssetPickerDialog
      assets={assets}
      orgAssetIdsByKey={orgAssetIdsByKey}
      glassItemBorderClasses={glassItemBorderClasses}
      selected={selected}
      onChange={onChange}
      workspaceOptions={workspaceOptions}
      positionCatalog={positionCatalog}
      idPrefix={idPrefix}
      targetWorkspaceId={targetWorkspaceId}
    />
  )
}
