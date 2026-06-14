import { cn } from '@/lib/utils'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { PositionRosterCard } from '@/features/roster/PositionRosterCard'
import {
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
  orgChartColorClasses,
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'

import {
  rosterOrgBranchClassName,
  rosterOrgCommandStaffClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'

type WorkspaceOrgChartRosterProps = {
  entriesByPosition: Record<string, PositionRosterEntry>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  workspaceLabel: string
  layoutMode?: RosterPanelLayoutMode
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

type PositionNodeProps = {
  position: string
  color?: OrgChartColor
  layoutMode: RosterPanelLayoutMode
  entriesByPosition: Record<string, PositionRosterEntry>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}

function PositionNode({
  position,
  color,
  layoutMode,
  entriesByPosition,
  visiblePositions,
  assignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: PositionNodeProps) {
  if (!visiblePositions.has(position)) return null
  const entry = entriesByPosition[position]
  if (!entry) return null

  return (
    <PositionRosterCard
      entry={entry}
      assignable={assignableByPosition[position] ?? []}
      canManageRoster={canManageRoster}
      glassItemBorderClasses={glassItemBorderClasses}
      isPermissionBusy={isUpdatingPermission === position}
      isAssignBusy={isAssigningPosition === position}
      variant="org"
      color={color}
      layoutMode={layoutMode}
      onToggleEditIcs201={onToggleEditIcs201}
      onAssignExistingMember={onAssignExistingMember}
      onInviteToPosition={onInviteToPosition}
      onUnassignMember={onUnassignMember}
    />
  )
}

function GroupBranch({
  node,
  layoutMode,
  entriesByPosition,
  visiblePositions,
  assignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: {
  node: Extract<OrgChartNode, { kind: 'group' }>
  layoutMode: RosterPanelLayoutMode
  entriesByPosition: Record<string, PositionRosterEntry>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
}) {
  const visibleChildren = node.children.filter(
    (child) => child.kind === 'position' && visiblePositions.has(child.position)
  )
  if (visibleChildren.length === 0) return null

  const leaderChild = node.children.find((child) => child.kind === 'position')
  const leaderEntry =
    leaderChild?.kind === 'position' ? entriesByPosition[leaderChild.position] : undefined
  const leaderEmail = leaderEntry?.members[0]?.email

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          'w-full rounded-md border px-2.5 py-2 text-center shadow-sm',
          orgChartColorClasses(node.color)
        )}
      >
        <p className="text-xs font-semibold leading-snug">{node.label}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          Work team
        </p>
        {leaderEmail && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">Leader: {leaderEmail}</p>
        )}
        <p className="mt-0.5 text-[10px] text-muted-foreground">Type: {node.type}</p>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex w-full flex-col items-center gap-2">
        {node.children.map((child, index) => {
          if (child.kind !== 'position' || !visiblePositions.has(child.position)) {
            return null
          }
          return (
            <div key={child.position} className="flex w-full flex-col items-center">
              {index > 0 && <div className="h-3 w-px bg-border" />}
              <PositionNode
                position={child.position}
                color={child.color ?? node.color}
                layoutMode={layoutMode}
                entriesByPosition={entriesByPosition}
                visiblePositions={visiblePositions}
                assignableByPosition={assignableByPosition}
                canManageRoster={canManageRoster}
                glassItemBorderClasses={glassItemBorderClasses}
                isUpdatingPermission={isUpdatingPermission}
                isAssigningPosition={isAssigningPosition}
                onToggleEditIcs201={onToggleEditIcs201}
                onAssignExistingMember={onAssignExistingMember}
                onInviteToPosition={onInviteToPosition}
                onUnassignMember={onUnassignMember}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CommandStaffRow({
  node,
  layoutMode,
  ...positionNodeProps
}: {
  node: Extract<OrgChartNode, { kind: 'group' }>
  layoutMode: RosterPanelLayoutMode
} & Omit<PositionNodeProps, 'position' | 'color'>) {
  const visibleChildren = node.children.filter(
    (child) => child.kind === 'position' && positionNodeProps.visiblePositions.has(child.position)
  )
  if (visibleChildren.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          'rounded-md border px-3 py-1.5 text-center shadow-sm',
          orgChartColorClasses(node.color)
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide">{node.label}</p>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className={rosterOrgCommandStaffClassName(layoutMode)}>
        {visibleChildren.map((child) => {
          if (child.kind !== 'position') return null
          return (
            <PositionNode
              key={child.position}
              position={child.position}
              color={child.color ?? node.color}
              layoutMode={layoutMode}
              {...positionNodeProps}
            />
          )
        })}
      </div>
    </div>
  )
}

export function WorkspaceOrgChartRoster({
  entriesByPosition,
  visiblePositions,
  assignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  workspaceLabel,
  layoutMode = 'wide',
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
}: WorkspaceOrgChartRosterProps) {
  const visibleSectionBranches = ICS_ORG_CHART_SECTION_BRANCHES.filter((branch) =>
    branch.children.some(
      (child) => child.kind === 'position' && visiblePositions.has(child.position)
    )
  )
  const showCommandStaff = ICS_ORG_CHART_COMMAND_STAFF_BRANCH.children.some(
    (child) => child.kind === 'position' && visiblePositions.has(child.position)
  )
  const showRoot = visiblePositions.has(ICS_ORG_CHART_ROOT_POSITION)
  const showBelowRoot = showCommandStaff || visibleSectionBranches.length > 0

  const positionNodeProps = {
    entriesByPosition,
    visiblePositions,
    assignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    onToggleEditIcs201,
    onAssignExistingMember,
    onInviteToPosition,
    onUnassignMember,
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pt-px">
      <div className="space-y-1 text-center">
        <h3 className="text-sm font-semibold">{workspaceLabel} Roster</h3>
        <p className="text-xs text-muted-foreground">
          Organizational Chart — Incident Command Structure
        </p>
      </div>

      <div className="min-w-0 w-full max-w-full">
        <div className="mx-auto flex w-full min-w-0 max-w-full flex-col items-center px-0">
          {showRoot && (
            <div
              className={cn(
                'w-full min-w-0 max-w-full',
                layoutMode === 'wide' && 'flex justify-center'
              )}
            >
              <PositionNode
                position={ICS_ORG_CHART_ROOT_POSITION}
                layoutMode={layoutMode}
                {...positionNodeProps}
              />
            </div>
          )}

          {showRoot && showBelowRoot && <div className="h-5 w-px bg-border" />}

          {showCommandStaff && (
            <CommandStaffRow
              node={ICS_ORG_CHART_COMMAND_STAFF_BRANCH}
              layoutMode={layoutMode}
              {...positionNodeProps}
            />
          )}

          {showCommandStaff && visibleSectionBranches.length > 0 && (
            <div className="h-5 w-px bg-border" />
          )}

          {visibleSectionBranches.length > 0 && (
            <div className={rosterOrgBranchClassName(layoutMode)}>
              {visibleSectionBranches.map((branch) => (
                <div key={branch.label} className="flex min-w-0 w-full flex-col items-center">
                  {(showRoot || showCommandStaff) && <div className="h-4 w-px bg-border" />}
                  <GroupBranch
                    node={branch}
                    layoutMode={layoutMode}
                    {...positionNodeProps}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
