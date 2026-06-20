import { getAssetByKey } from '@/data/hub-asset-catalog'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import { getPositionMemberSchedulePolicy } from '@/lib/roster-member-schedule-policy'
import type { OperationalPeriodRosterSnapshot } from '@/lib/operational-period-roster-types'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

function snapshotAssetsToRosterEntries(
  assets: OperationalPeriodRosterSnapshot['positions'][number]['assets']
): PositionAssetRosterEntry[] {
  return (assets ?? []).map((asset) => {
    const catalog = getAssetByKey(asset.assetKey)
    return {
      assetKey: asset.assetKey,
      name: catalog?.name ?? asset.assetKey,
      type: catalog?.type ?? '',
      pointOfContactMemberId: null,
      pointOfContactEmail: asset.pointOfContactEmail ?? null,
    }
  })
}

export function buildPositionRosterEntriesFromSnapshot(
  snapshot: OperationalPeriodRosterSnapshot,
  searchQuery: string
): PositionRosterEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return snapshot.positions
    .map((position) => ({
      position: position.name,
      members: position.members.map(
        (member, index): WorkspaceRosterMember => ({
          id: `snapshot-${position.name}-${member.email}-${index}`,
          userId: null,
          email: member.email,
          status: member.status as WorkspaceRosterMember['status'],
          icsPosition: member.icsPositions[0] ?? position.name,
          icsPositions: member.icsPositions,
          assignmentKind: 'ics_position',
          orgChartReportsTo: null,
          checkInStatus: member.checkInStatus ?? 'not_arrived',
          addedAt: snapshot.capturedAt,
        })
      ),
      scheduledAssignees: [],
      scheduledUnassignees: [],
      assets: snapshotAssetsToRosterEntries(position.assets),
      scheduledAssignAssets: [],
      scheduledUnassignAssets: [],
      memberSchedulePolicy: getPositionMemberSchedulePolicy({
        name: position.name,
        source: position.source,
        lifecycleStatus: position.lifecycleStatus,
        opAdvanceLabel: position.opAdvanceLabel,
        isPlanned: position.lifecycleStatus === 'planned_create',
        isArchived: position.lifecycleStatus === 'archived',
        isOnOrgChart:
          position.lifecycleStatus !== 'planned_create' && position.lifecycleStatus !== 'archived',
      }),
      editIcs201: position.editIcs201,
      allowWorkAssignment: position.allowWorkAssignment ?? position.source !== 'custom',
      isCustom: position.source === 'custom',
      opAdvanceLabel: position.opAdvanceLabel,
      isPlanned: position.lifecycleStatus === 'planned_create',
    }))
    .filter((entry) => {
      if (!normalizedQuery) return true
      if (entry.position.toLowerCase().includes(normalizedQuery)) return true
      const searchableAssets = [
        ...entry.assets,
        ...entry.scheduledAssignAssets,
        ...entry.scheduledUnassignAssets,
      ]
      if (
        searchableAssets.some((asset) =>
          [asset.name, asset.type, asset.pointOfContactEmail ?? ''].join(' ').toLowerCase().includes(normalizedQuery)
        )
      ) {
        return true
      }
      return entry.members.some((member) =>
        [member.email, member.status, member.checkInStatus, member.addedAt]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
    })
}
