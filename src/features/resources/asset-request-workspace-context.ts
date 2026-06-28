import type { AssetRequestWorkspaceContext, ResourceRequestItem } from '@/lib/ics-213rr-resource-request'

export function workspaceContextFromAssetRequest(
  request: ResourceRequestItem,
  activeContext: AssetRequestWorkspaceContext | null
): AssetRequestWorkspaceContext | null {
  const workspaceId = request.sourceWorkspaceId?.trim()
  if (!workspaceId) return null

  if (activeContext?.workspaceId === workspaceId) {
    return activeContext
  }

  return {
    workspaceId,
    workspaceKind: request.sourceWorkspaceKind ?? 'incident',
    workspaceName: request.sourceWorkspaceName?.trim() || request.incidentName.trim(),
    mapLocation: request.mapLocation ?? null,
  }
}
