import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  buildPositionOrgChartAssigneeGroups,
  positionOrgChartAssigneeSummaryIsEmpty,
  type PositionCardAssigneeGroup,
} from '@/features/roster/position-org-chart-assignee-display'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

type PositionOrgChartAssigneeSummaryProps = {
  entry: PositionRosterEntry
  horizon?: OrgChartExportScope
  maxVisiblePerGroup?: number
  secondaryTextClassName?: string
}

function groupLabel(kind: PositionCardAssigneeGroup['kind']): string | null {
  if (kind === 'scheduled_next_op') return 'Next OP'
  if (kind === 'leaving_next_op') return 'Leaving next OP'
  return null
}

function MemberLines({
  group,
  maxVisible,
  secondaryTextClassName,
}: {
  group: PositionCardAssigneeGroup
  maxVisible: number
  secondaryTextClassName: string
}) {
  const label = groupLabel(group.kind)
  const visible = group.members.slice(0, maxVisible)
  const overflow = group.members.length - visible.length

  return (
    <div className="space-y-0.5">
      {label ? (
        <div className="flex items-center gap-1">
          <p
            className={cn(
              'text-[9px] font-medium uppercase tracking-wide',
              secondaryTextClassName
            )}
          >
            {label}
          </p>
          {group.kind === 'scheduled_next_op' ? (
            <Badge variant="secondary" className="h-3.5 px-1 text-[8px]">
              Scheduled
            </Badge>
          ) : null}
        </div>
      ) : null}
      {visible.map((member) => (
        <p
          key={`${group.kind}-${member.id}`}
          className={cn(
            'truncate text-[10px]',
            group.kind === 'leaving_next_op' ? 'line-through' : undefined,
            secondaryTextClassName
          )}
          title={member.email}
        >
          {member.email}
        </p>
      ))}
      {overflow > 0 ? (
        <p className={cn('text-[9px]', secondaryTextClassName)}>+{overflow} more</p>
      ) : null}
    </div>
  )
}

export function PositionOrgChartAssigneeSummary({
  entry,
  horizon = 'current_op',
  maxVisiblePerGroup = 3,
  secondaryTextClassName = 'text-muted-foreground',
}: PositionOrgChartAssigneeSummaryProps) {
  const groups = buildPositionOrgChartAssigneeGroups(entry, horizon)

  if (positionOrgChartAssigneeSummaryIsEmpty(groups)) {
    return <p className={cn('text-[10px]', secondaryTextClassName)}>Unassigned</p>
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <MemberLines
          key={group.kind}
          group={group}
          maxVisible={maxVisiblePerGroup}
          secondaryTextClassName={secondaryTextClassName}
        />
      ))}
    </div>
  )
}
