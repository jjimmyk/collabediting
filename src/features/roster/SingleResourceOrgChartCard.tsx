import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orgChartColorClasses, type OrgChartColor } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type SingleResourceOrgChartCardProps = {
  member: WorkspaceRosterMember
  color?: OrgChartColor
  scheduled?: boolean
  canManage?: boolean
  onOpenDetail?: () => void
  onRemoveFromOrgChart?: (memberId: string) => void
}

export function SingleResourceOrgChartCard({
  member,
  color,
  scheduled = false,
  canManage = false,
  onOpenDetail,
  onRemoveFromOrgChart,
}: SingleResourceOrgChartCardProps) {
  const reportsTo = member.orgChartReportsTo ?? member.pendingOrgChartReportsTo
  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-md border px-2 py-2 shadow-sm',
        scheduled ? 'border-dashed opacity-90' : 'border-dashed',
        orgChartColorClasses(color ?? 'neutral')
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 space-y-1 text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={onOpenDetail}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-xs font-semibold leading-snug">{member.email}</p>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              Single resource
            </Badge>
            {scheduled ? (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                Next OP
              </Badge>
            ) : null}
          </div>
          {reportsTo ? (
            <p className="sr-only">Reports to {reportsTo}</p>
          ) : null}
        </button>
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
