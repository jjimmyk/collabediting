export type ResourceCategoryLifecycle = 'active' | 'scheduled_assign' | 'scheduled_unassign'

export type WorkspaceResourceCategoryRow = {
  id: string
  workspaceId: string
  positionName: string
  name: string
  lifecycle: ResourceCategoryLifecycle
  filledMemberId: string | null
  filledAssetKey: string | null
  sortOrder: number
  createdAt: string
  createdBy: string | null
}

export type PositionResourceCategoryEntry = {
  id: string
  name: string
  lifecycle: ResourceCategoryLifecycle
  filledMemberId: string | null
  filledAssetKey: string | null
  filledMemberEmail: string | null
  filledAssetName: string | null
  sortOrder: number
}

export function groupResourceCategoriesByPosition(
  categories: WorkspaceResourceCategoryRow[]
): Record<string, PositionResourceCategoryEntry[]> {
  const map: Record<string, PositionResourceCategoryEntry[]> = {}

  for (const row of categories) {
    const current = map[row.positionName] ?? []
    current.push({
      id: row.id,
      name: row.name,
      lifecycle: row.lifecycle,
      filledMemberId: row.filledMemberId,
      filledAssetKey: row.filledAssetKey,
      filledMemberEmail: null,
      filledAssetName: null,
      sortOrder: row.sortOrder,
    })
    map[row.positionName] = current
  }

  for (const positionName of Object.keys(map)) {
    map[positionName]?.sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }
      return left.name.localeCompare(right.name)
    })
  }

  return map
}
