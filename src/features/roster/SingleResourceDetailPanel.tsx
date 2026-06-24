import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CompetencyFunctionSelect } from '@/features/roster/CompetencyFunctionSelect'
import { OrgChartReportsToField } from '@/features/roster/OrgChartReportsToField'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'

type SingleResourceDetailPanelProps = {
  member: WorkspaceRosterMember
  scheduled?: boolean
  canManage?: boolean
  catalog?: WorkspacePositionCatalog
  isUpdatingPlacement?: boolean
  onOrgChartPlacementChange?: (reportsTo: string) => void | Promise<void>
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  isUpdatingCompetency?: boolean
  onCompetencyFunctionChange?: (value: string | null) => void
  onRemoveFromOrgChart?: (memberId: string) => void
}

const CHECK_IN_OPTIONS: WorkspaceMemberCheckInStatus[] = [
  'not_arrived',
  'checked_in',
  'checked_out',
]

export function SingleResourceDetailPanel({
  member,
  scheduled = false,
  canManage = false,
  catalog,
  isUpdatingPlacement = false,
  onOrgChartPlacementChange,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  competencyOptions = [],
  canEditCompetencyFunction = false,
  isUpdatingCompetency = false,
  onCompetencyFunctionChange,
  onRemoveFromOrgChart,
}: SingleResourceDetailPanelProps) {
  const reportsTo = member.orgChartReportsTo ?? member.pendingOrgChartReportsTo
  const [reportsToDraft, setReportsToDraft] = useState(reportsTo ?? '')
  const canEditReportsTo = canManage && Boolean(catalog) && Boolean(onOrgChartPlacementChange)

  useEffect(() => {
    setReportsToDraft(reportsTo ?? '')
  }, [reportsTo])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{member.email}</p>
          <Badge variant="outline">Single resource</Badge>
          {scheduled ? <Badge variant="secondary">Next OP</Badge> : null}
        </div>
        {catalog ? (
          <OrgChartReportsToField
            id={`single-resource-reports-to-${member.id}`}
            value={canEditReportsTo ? reportsToDraft : (reportsTo ?? null)}
            catalog={catalog}
            editable={canEditReportsTo}
            disabled={isUpdatingPlacement}
            onValueChange={(nextValue) => {
              setReportsToDraft(nextValue)
              void onOrgChartPlacementChange?.(nextValue)
            }}
          />
        ) : reportsTo ? (
          <p className="text-sm text-muted-foreground">Reports to {reportsTo}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Added {member.addedAt}
          {member.status !== 'active' ? ` · ${member.status}` : ''}
        </p>
      </div>

      {showCheckInStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor={`single-resource-check-in-${member.id}`} className="text-xs">
            Check-in status
          </Label>
          <select
            id={`single-resource-check-in-${member.id}`}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={member.checkInStatus}
            disabled={
              !canEditCheckInStatus ||
              updatingCheckInMemberId === member.id ||
              !onCheckInStatusChange
            }
            onChange={(event) =>
              onCheckInStatusChange?.(member.id, event.target.value as WorkspaceMemberCheckInStatus)
            }
          >
            {CHECK_IN_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {onCompetencyFunctionChange ? (
        <CompetencyFunctionSelect
          value={
            scheduled
              ? (member.pendingCompetencyFunction ?? null)
              : (member.competencyFunction ?? null)
          }
          options={competencyOptions}
          disabled={!canEditCompetencyFunction}
          isUpdating={isUpdatingCompetency}
          onChange={onCompetencyFunctionChange}
        />
      ) : null}

      {canManage && onRemoveFromOrgChart ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onRemoveFromOrgChart(member.id)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Remove from org chart
        </Button>
      ) : null}
    </div>
  )
}
