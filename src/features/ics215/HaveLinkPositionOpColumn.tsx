import { useMemo, useState } from 'react'
import type { HaveLinkPositionChild } from '@/features/ics215/build-have-link-position-tree'
import type { HaveLinkOperationalPeriod } from '@/features/ics215/have-link-roster-actions'
import type { HaveLinkRosterActions } from '@/features/ics215/have-link-roster-actions'
import { mapHaveLinkOpToInviteMode } from '@/features/ics215/have-link-roster-actions'
import { Ics215HaveRosterRefPickRow } from '@/features/ics215/Ics215HaveRosterRefPickRow'
import type { Ics215HaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { PositionAssignmentActionBar } from '@/features/roster/PositionRosterAssignmentSections'
import type { PositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import {
  assignExistingMembersEmptyMessage,
  assignableAssetsEmptyMessage,
  scheduleAssignMembersEmptyMessage,
} from '@/features/roster/position-roster-messages'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

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

  const canManageActions =
    Boolean(rosterActions?.canManageRoster) &&
    (op === 'current'
      ? memberSchedulePolicy.allowActiveAssignment
      : memberSchedulePolicy.allowScheduleAssign)

  const assignableMembers = useMemo(() => {
    if (!rosterActions) return []
    return op === 'current'
      ? (rosterActions.assignableByPosition[position] ?? [])
      : (rosterActions.scheduleAssignableByPosition[position] ?? [])
  }, [op, position, rosterActions])

  const assignableAssets = useMemo(() => {
    if (!rosterActions || !showPositionAssets) return []
    return op === 'current'
      ? (rosterActions.assignableAssetsByPosition[position] ?? [])
      : (rosterActions.scheduleAssignableAssetsByPosition[position] ?? [])
  }, [op, position, rosterActions, showPositionAssets])

  const memberEmptyMessage = useMemo(() => {
    if (!positionEntry) {
      return assignableMembers.length === 0 ? 'No roster members available to assign.' : ''
    }
    if (op === 'current') {
      return assignExistingMembersEmptyMessage(positionEntry, assignableMembers.length)
    }
    return scheduleAssignMembersEmptyMessage(assignableMembers.length)
  }, [assignableMembers.length, op, positionEntry])

  const isBusy = rosterActions?.isPositionBusy(position) ?? false

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground">{title}</p>
      {canManageActions && rosterActions ? (
        <PositionAssignmentActionBar
          showAssetActions={showPositionAssets}
          showNewUser
          showResourceCategory
          disabled={isBusy}
          assignableMembers={assignableMembers}
          assignableAssets={assignableAssets}
          pocMembers={rosterActions.pocMembers}
          requireAssetPoc={op === 'current'}
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
              ? (assetKey, pointOfContactMemberId) => {
                  void rosterActions.onAssignAsset(assetKey, position, op, pointOfContactMemberId)
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
          {children.map((child) => (
            <Ics215HaveRosterRefPickRow
              key={child.ref}
              option={childToOption(child)}
              checked={selectedRefs.has(child.ref)}
              disabled={child.disabled}
              linkedToThisCell={linkedToThisCellRefs.has(child.ref)}
              linkedElsewhere={linkedRefLocations.get(child.ref)}
              onToggle={() => onToggleRef(child.ref)}
              onUnlinkFromElsewhere={
                linkedRefLocations.get(child.ref) && onUnlinkFromElsewhere
                  ? () => onUnlinkFromElsewhere(linkedRefLocations.get(child.ref)!, child.ref)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
