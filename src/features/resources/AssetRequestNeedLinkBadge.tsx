import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatAssetRequestNeedLinkAssignee,
  formatAssetRequestNeedLinkResourceKind,
  hasAssetRequestNeedLink,
} from '@/lib/asset-request-ics215-need-link-display'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type AssetRequestNeedLinkBadgeProps = {
  request: ResourceRequestItem
  roster?: WorkspaceRosterMember[]
  className?: string
}

export function AssetRequestNeedLinkBadge({
  request,
  roster = [],
  className,
}: AssetRequestNeedLinkBadgeProps) {
  const link = request.ics215NeedLink
  if (!hasAssetRequestNeedLink(request) || !link) return null

  const assignee = formatAssetRequestNeedLinkAssignee(link, roster)
  const resourceKind = formatAssetRequestNeedLinkResourceKind(link)
  const tooltip = [
    'Linked to ICS-215 Need cell',
    `Assignee: ${assignee}`,
    `Resource column: ${resourceKind}`,
    link.workAssignment.trim() ? `Work assignment: ${link.workAssignment.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={className ?? 'text-[10px]'}>
            ICS-215 Need · {assignee} · {resourceKind}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-line">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
