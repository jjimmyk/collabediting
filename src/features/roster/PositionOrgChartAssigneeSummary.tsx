import { Badge } from '@/components/ui/badge'
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
}

function groupLabel(kind: PositionCardAssigneeGroup['kind']): string | null {
  if (kind === 'scheduled_next_op') return 'Next OP'
  if (kind === 'leaving_next_op') return 'Leaving next OP'
  return null
}

function MemberLines({
  group,
  maxVisible,
}: {
  group: PositionCardAssigneeGroup
  maxVisible: number
}) {
  const label = groupLabel(group.kind)
  const visible = group.members.slice(0, maxVisible)
  const overflow = group.members.length - visible.length

  return (
    <div className="space-y-0.5">
      {label ? (
        <div className="flex items-center gap-1">
          <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
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
          className={
            group.kind === 'leaving_next_op'
              ? 'truncate text-[10px] text-muted-foreground line-through'
              : 'truncate text-[10px] text-foreground'
          }
          title={member.email}
        >
          {member.email}
        </p>
      ))}
      {overflow > 0 ? (
        <p className="text-[9px] text-muted-foreground">+{overflow} more</p>
      ) : null}
    </div>
  )
}

export function PositionOrgChartAssigneeSummary({
  entry,
  horizon = 'current_op',
  maxVisiblePerGroup = 3,
}: PositionOrgChartAssigneeSummaryProps) {
  const groups = buildPositionOrgChartAssigneeGroups(entry, horizon)

  if (positionOrgChartAssigneeSummaryIsEmpty(groups)) {
    return <p className="text-[10px] text-muted-foreground">Unassigned</p>
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => (
        <MemberLines key={group.kind} group={group} maxVisible={maxVisiblePerGroup} />
      ))}
    </div>
  )
}
