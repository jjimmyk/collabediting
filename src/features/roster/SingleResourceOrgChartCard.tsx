import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orgChartColorClasses, type OrgChartColor } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type SingleResourceOrgChartCardProps = {
  member: WorkspaceRosterMember
  color?: OrgChartColor
  canManage?: boolean
  onRemoveFromOrgChart?: (memberId: string) => void
}

export function SingleResourceOrgChartCard({
  member,
  color,
  canManage = false,
  onRemoveFromOrgChart,
}: SingleResourceOrgChartCardProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-md border border-dashed px-2 py-2 shadow-sm',
        orgChartColorClasses(color ?? 'neutral')
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-xs font-semibold leading-snug">{member.email}</p>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              Single resource
            </Badge>
          </div>
          {member.orgChartReportsTo ? (
            <p className="truncate text-[10px] text-muted-foreground">
              Reports to {member.orgChartReportsTo}
            </p>
          ) : null}
        </div>
        {canManage && onRemoveFromOrgChart ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${member.email} from org chart`}
            onClick={() => onRemoveFromOrgChart(member.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
