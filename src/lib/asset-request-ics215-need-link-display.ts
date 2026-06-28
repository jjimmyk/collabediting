import type { AssetRequestIcs215NeedLink, ResourceRequestItem } from '@/lib/ics-213rr-resource-request'
import { formatWorkAssignmentTargetLabel } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function hasAssetRequestNeedLink(
  request: Pick<ResourceRequestItem, 'ics215NeedLink'>
): boolean {
  return Boolean(request.ics215NeedLink?.assigneeKey?.trim())
}

export function formatAssetRequestNeedLinkAssignee(
  link: AssetRequestIcs215NeedLink,
  roster: WorkspaceRosterMember[] = []
): string {
  return formatWorkAssignmentTargetLabel(link.assigneeKey, roster) || link.assigneeKey
}

export function formatAssetRequestNeedLinkResourceKind(link: AssetRequestIcs215NeedLink): string {
  return link.columnLabel.trim() || '—'
}

export function formatAssetRequestNeedLinkSummary(
  request: Pick<ResourceRequestItem, 'ics215NeedLink'>,
  roster: WorkspaceRosterMember[] = []
): string | null {
  const link = request.ics215NeedLink
  if (!link?.assigneeKey?.trim()) return null
  const assignee = formatAssetRequestNeedLinkAssignee(link, roster)
  const resourceKind = formatAssetRequestNeedLinkResourceKind(link)
  return `ICS-215 Need · ${assignee} · ${resourceKind}`
}
