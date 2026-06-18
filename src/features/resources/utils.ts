import type { AccessibleWorkspace } from '@/lib/workspace-types'
import type {
  AssetWorkspaceOption,
  HubAssetCatalogRecord,
  ResourceCostUnitType,
  ResourceListItemData,
  WorkspaceAssetAssignment,
} from '@/features/resources/types'
import { isIncidentArchived } from '@/lib/incident-archive'

export const getResourceIncidentAssignmentLabel = (resource: ResourceListItemData) =>
  getResourceWorkspaceAssignmentLabel(resource)

export const getResourceWorkspaceAssignmentLabel = (resource: ResourceListItemData) => {
  if (resource.assignedWorkspaceKind === 'incident') {
    return resource.assignedIncidentName ?? ''
  }
  if (resource.assignedWorkspaceKind === 'exercise') {
    return resource.assignedExerciseName ?? ''
  }
  return ''
}

export const formatResourceCostPerUnit = (costPerUnit: number) =>
  costPerUnit.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const formatResourceCostUnitType = (costUnitType: ResourceCostUnitType) => {
  if (costUnitType === 'per day') return 'Per day'
  if (costUnitType === 'per hour') return 'Per hour'
  return 'To purchase'
}

export function buildAssetWorkspaceOptions(
  workspaces: AccessibleWorkspace[]
): AssetWorkspaceOption[] {
  return workspaces
    .filter((workspace) => !isIncidentArchived(workspace))
    .map((workspace) => ({
      workspaceId: workspace.workspaceId,
      kind: workspace.kind,
      name: workspace.name,
    }))
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'incident' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
}

export function applyAssignmentsToHubAssets(
  catalog: HubAssetCatalogRecord[],
  assignmentRows: WorkspaceAssetAssignment[],
  workspacesById: Record<string, AccessibleWorkspace>
): ResourceListItemData[] {
  const assignmentsByAssetKey = Object.fromEntries(
    assignmentRows.map((row) => [row.assetKey, row])
  )

  return catalog.map((asset) => {
    const assignment = assignmentsByAssetKey[asset.assetKey]
    const workspaceId = assignment?.workspaceId ?? null
    const workspace = workspaceId ? workspacesById[workspaceId] : undefined

    if (!workspaceId || !workspace) {
      return {
        ...asset,
        deploymentKind: 'available',
        assignedWorkspaceId: null,
        assignedWorkspaceKind: null,
        assignedIncidentName: null,
        assignedExerciseName: null,
        orgChartReportsTo: null,
        orgChartSortOrder: 0,
        ics204DocumentId: null,
        pointOfContactMemberId: null,
      }
    }

    return {
      ...asset,
      deploymentKind: workspace.kind,
      assignedWorkspaceId: workspaceId,
      assignedWorkspaceKind: workspace.kind,
      assignedIncidentName: workspace.kind === 'incident' ? workspace.name : null,
      assignedExerciseName: workspace.kind === 'exercise' ? workspace.name : null,
      orgChartReportsTo: assignment?.orgChartReportsTo ?? null,
      orgChartSortOrder: assignment?.orgChartSortOrder ?? 0,
      ics204DocumentId: assignment?.ics204DocumentId ?? null,
      pointOfContactMemberId: assignment?.pointOfContactMemberId ?? null,
    }
  })
}

export function assignmentsRecordFromRows(
  rows: WorkspaceAssetAssignment[]
): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.assetKey, row.workspaceId]))
}

export function getAssetsAssignedToWorkspace(
  assets: ResourceListItemData[],
  workspaceId: string | null
): ResourceListItemData[] {
  if (!workspaceId) return []
  return assets.filter((asset) => asset.assignedWorkspaceId === workspaceId)
}

export function getAssignedAssetsNotOnOrgChart(assets: ResourceListItemData[]): ResourceListItemData[] {
  return assets.filter((asset) => asset.orgChartReportsTo === null)
}

export function getUnassignedHubAssets(assets: ResourceListItemData[]): ResourceListItemData[] {
  return assets.filter((asset) => asset.assignedWorkspaceId === null)
}
