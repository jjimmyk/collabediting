import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'

export function resolveWorkspaceDisplayName(
  workspaceId: string,
  workspaceOptions: AssetWorkspaceOption[],
  asset?: ResourceListItemData
): string {
  const fromOptions = workspaceOptions.find((option) => option.workspaceId === workspaceId)?.name
  if (fromOptions) return fromOptions
  if (asset?.assignedWorkspaceId === workspaceId) {
    return asset.assignedIncidentName || asset.assignedExerciseName || 'this workspace'
  }
  return 'this workspace'
}

export function getAssetWorkspaceAssignmentBlockReason(
  asset: ResourceListItemData,
  targetWorkspaceId: string | null | undefined,
  workspaceOptions: AssetWorkspaceOption[]
): string | null {
  if (!targetWorkspaceId) return null
  if (asset.assignedWorkspaceId !== targetWorkspaceId) return null
  const name = resolveWorkspaceDisplayName(targetWorkspaceId, workspaceOptions, asset)
  return `This item is already assigned to workspace ${name}.`
}
