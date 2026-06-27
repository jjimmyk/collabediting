import { useMemo, useState } from 'react'
import type { HaveLinkPositionChild } from '@/features/ics215/build-have-link-position-tree'
import type { HaveLinkOperationalPeriod } from '@/features/ics215/have-link-roster-actions'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import { mapHaveLinkOpToInviteMode } from '@/features/ics215/have-link-roster-actions'
import { Ics215HaveRosterRefPickRow } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { PositionAssignmentActionBar } from '@/features/roster/PositionRosterAssignmentSections'
import { ScheduleForNextOpButton } from '@/features/roster/ScheduleForNextOpButton'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import {
  assignExistingMembersEmptyMessage,
  assignableAssetsEmptyMessage,
  scheduleAssignMembersEmptyMessage,
} from '@/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { parseWorkAssignmentTarget } from '@/lib/work-assignment-target'
import {
  canAssetContinueToNextOp,
  canMemberContinueToNextOp,
} from '@/lib/work-assignment-roster-eligibility'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export const ASSIGNED_TO_POSITION_GROUP = 'Assigned to Position'

function childToOption(
  child: HaveLinkPositionChild,
  group = ASSIGNED_TO_POSITION_GROUP
): WorkAssignmentTargetOption {
  return {
    value: child.ref,
    label: child.label,
    group,
    disabled: child.disabled,
    disabledReason: child.disabledReason,
    targetType: child.targetType,
    rosterPresence: child.presence ?? undefined,
  }
}

function canShowScheduleForNextOp(
  child: HaveLinkPositionChild,
  op: HaveLinkOperationalPeriod,
  positionEntry: PositionRosterEntry | null,
  roster: WorkspaceRosterMember[]
): boolean {
  if (op !== 'current' || !positionEntry || child.presence !== 'active' || child.disabled) {
    return false
  }
  const parsed = parseWorkAssignmentTarget(child.ref)
  if (parsed.type === 'member') {
    const member = roster.find((entry) => entry.id === parsed.memberId)
    return member ? canMemberContinueToNextOp(member, positionEntry) : false
  }
  if (parsed.type === 'position_asset' && parsed.assetKey) {
    return canAssetContinueToNextOp(parsed.assetKey, positionEntry)
  }
  return false
}

function scheduleChildForNextOp(
  child: HaveLinkPositionChild,
  position: string,
  rosterActions: HaveLinkRosterActions
) {
  const parsed = parseWorkAssignmentTarget(child.ref)
  if (parsed.type === 'member' && parsed.memberId) {
    void rosterActions.onAlsoScheduleMemberForNextOp(parsed.memberId, position)
  } else if (parsed.type === 'position_asset' && parsed.assetKey) {
    void rosterActions.onAlsoScheduleAssetForNextOp(parsed.assetKey, position)
  }
}

type HaveLinkPositionOpColumnProps = {
  title: string
  emptyMessage: string
  op: HaveLinkOperationalPeriod
  position: string
  positionEntry: PositionRosterEntry | null
  memberSchedulePolicy: PositionMemberSchedulePolicy
  showPositionAssets: boolean
  children: HaveLinkPositionChild[]
  rosterActions?: HaveLinkRosterActions
  selectedRefs: Set<string>
  linkedToThisCellRefs: Set<string>
  linkedRefLocations: Map<string, Ics215HaveLinkLocation>
  onToggleRef: (ref: string) => void
  onUnlinkFromElsewhere?: (location: Ics215HaveLinkLocation, ref: string) => void
}

export function HaveLinkPositionOpColumn({
  title,
  emptyMessage,
  op,
  position,
  positionEntry,
  memberSchedulePolicy,
  showPositionAssets,
  children,
  rosterActions,
  selectedRefs,
  linkedToThisCellRefs,
  linkedRefLocations,
  onToggleRef,
  onUnlinkFromElsewhere,
}: HaveLinkPositionOpColumnProps) {
  const inviteMode = mapHaveLinkOpToInviteMode(op)
  const [expandedInviteMode, setExpandedInviteMode] = useState<typeof inviteMode | null>(null)
  const roster = rosterActions?.workspaceRosterMembers ?? []

  const canManageNextOpActions =
    op === 'next' &&
    Boolean(rosterActions?.canManageRoster) &&
    memberSchedulePolicy.allowScheduleAssign

  const assignableMembers = useMemo(() => {
    if (!rosterActions || op !== 'next') return []
    return rosterActions.scheduleAssignableByPosition[position] ?? []
  }, [op, position, rosterActions])

  const assignableAssets = useMemo(() => {
    if (!rosterActions || !showPositionAssets || op !== 'next') return []
    return rosterActions.scheduleAssignableAssetsByPosition[position] ?? []
  }, [op, position, rosterActions, showPositionAssets])

  const memberEmptyMessage = useMemo(() => {
    if (op !== 'next' || !positionEntry) {
      return assignableMembers.length === 0 ? 'No roster members available to assign.' : ''
    }
    return scheduleAssignMembersEmptyMessage(assignableMembers.length)
  }, [assignableMembers.length, op, positionEntry])

  const isBusy = rosterActions?.isPositionBusy(position) ?? false
  const canScheduleFromCurrentOp =
    op === 'current' &&
    Boolean(rosterActions?.canManageRoster) &&
    memberSchedulePolicy.allowScheduleAssign

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground">{title}</p>
      {canManageNextOpActions && rosterActions ? (
        <PositionAssignmentActionBar
          showAssetActions={showPositionAssets}
          showNewUser
          showResourceCategory
          disabled={isBusy}
          assignableMembers={assignableMembers}
          assignableAssets={assignableAssets}
          pocMembers={rosterActions.pocMembers}
          requireAssetPoc={false}
          memberEmptyMessage={memberEmptyMessage}
          assetEmptyMessage={assignableAssetsEmptyMessage(showPositionAssets)}
          onCreateResourceCategory={(name) => {
            void rosterActions.onCreateResourceCategory(position, name, op)
          }}
          onSelectMember={(memberId) => {
            void rosterActions.onAssignExistingMember(memberId, position, op)
          }}
          onSearchOrgMembers={rosterActions.onSearchOrgMembers}
          onAssignOrgMember={
            rosterActions.onSearchOrgMembers
              ? (userId) => {
                  void rosterActions.onAssignOrgMember(userId, position, op)
                }
              : undefined
          }
          rosterMembersForOrgDedupe={rosterActions.workspaceRosterMembers}
          onSelectAsset={
            showPositionAssets
              ? (assetKey) => {
                  void rosterActions.onAssignAsset(assetKey, position, op)
                }
              : undefined
          }
          position={position}
          inviteMode={inviteMode}
          expandedInviteMode={expandedInviteMode}
          inlinePositionInvite={
            rosterActions.inlinePositionInvite
              ? {
                  ...rosterActions.inlinePositionInvite,
                  onSubmit: async (params, confirmPasswordOverwrite) => {
                    const result = await rosterActions.inlinePositionInvite!.onSubmit(
                      params,
                      confirmPasswordOverwrite
                    )
                    if (result === 'success') {
                      setExpandedInviteMode(null)
                    }
                    return result
                  },
                }
              : undefined
          }
          onToggleInvite={(mode) => {
            setExpandedInviteMode((previous) => (previous === mode ? null : mode))
          }}
        />
      ) : null}
      {children.length === 0 ? (
        <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {children.map((child) => {
            const linkSelectable = op === 'next' && child.linkableForHave
            const showScheduleButton =
              canScheduleFromCurrentOp &&
              rosterActions &&
              canShowScheduleForNextOp(child, op, positionEntry, roster)

            return (
              <div key={`${child.ref}-${child.presence ?? 'unknown'}`} className="space-y-1">
                <Ics215HaveRosterRefPickRow
                  option={childToOption(child)}
                  checked={selectedRefs.has(child.ref)}
                  disabled={child.disabled}
                  linkSelectable={linkSelectable}
                  linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
                  linkedElsewhere={linkedRefLocations.get(child.ref)}
                  onToggle={() => onToggleRef(child.ref)}
                  onUnlinkFromElsewhere={
                    linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                      ? () => onUnlinkFromElsewhere(linkedRefLocations.get(child.ref)!, child.ref)
                      : undefined
                  }
                />
                {showScheduleButton ? (
                  <ScheduleForNextOpButton
                    compact
                    disabled={isBusy}
                    onClick={() => scheduleChildForNextOp(child, position, rosterActions!)}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
