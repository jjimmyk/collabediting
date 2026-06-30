import type { WorkspacePositionSettingsMap } from '@/lib/workspace-position-settings'
import type { StandardPositionLifecycleRow } from '@/lib/operational-period-roster-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { PositionAssetScheduleMap } from '@/lib/workspace-position-asset-types'
import {
  buildWorkspacePositionCatalog,
  type WorkspaceCustomPosition,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export function buildStandardLifecycleFromDraft(
  draft: BuildTeamRosterDraft
): StandardPositionLifecycleRow[] {
  return draft.archivedStandardPositions.map((positionName) => ({
    positionName,
    opAdvanceLabel: 'retire_on_op_advance' as const,
    archivedAt: new Date(0).toISOString(),
  }))
}

export function buildCustomPositionsFromDraft(
  draft: BuildTeamRosterDraft
): WorkspaceCustomPosition[] {
  return draft.customPositions.map((position, index) => ({
    id: position.id,
    name: position.name,
    reportsTo: position.reportsTo,
    sortOrder: index,
    lifecycleStatus: position.createOnFirstOpPeriod ? 'planned_create' : 'active',
  }))
}

export function buildDraftPositionCatalog(draft: BuildTeamRosterDraft): WorkspacePositionCatalog {
  return buildWorkspacePositionCatalog(
    buildCustomPositionsFromDraft(draft),
    buildStandardLifecycleFromDraft(draft)
  )
}

export function buildDraftRosterMembers(draft: BuildTeamRosterDraft): WorkspaceRosterMember[] {
  return draft.draftMembers.map((member) => ({
    id: member.id,
    userId: member.existingUserId,
    email: member.email,
    status: member.status ?? 'invited',
    icsPosition: member.icsPositions[0] ?? '',
    icsPositions: member.assignmentKind === 'ics_position' ? member.icsPositions : [],
    assignmentKind: member.assignmentKind,
    orgChartReportsTo:
      member.assignmentKind === 'single_resource' ? member.orgChartReportsTo : null,
    pendingOrgChartReportsTo: null,
    competencyFunction:
      member.assignmentKind === 'single_resource' ? member.competencyFunction ?? null : null,
    competencyByPosition:
      member.assignmentKind === 'ics_position'
        ? Object.fromEntries(
            member.icsPositions.map((position) => [position, member.competencyFunction ?? null])
          )
        : undefined,
    checkInStatus: 'not_arrived',
    addedAt: new Date().toISOString(),
  }))
}

export function buildDraftPositionSettings(draft: BuildTeamRosterDraft): WorkspacePositionSettingsMap {
  const settings: Record<
    string,
    {
      allowWorkAssignment: boolean
      positionType: BuildTeamRosterDraft['positionSettings'][string]['positionType']
      customTypeLabel: string | null
    }
  > = {}

  for (const [position, row] of Object.entries(draft.positionSettings)) {
    settings[position] = {
      allowWorkAssignment: row.allowWorkAssignment,
      positionType: row.positionType,
      customTypeLabel: row.customTypeLabel,
    }
  }

  return settings
}

function resolveDraftAssetCatalogRecord(
  assetKey: string,
  organizationAssets: ResourceListItemData[]
): ResourceListItemData | null {
  return organizationAssets.find((asset) => asset.assetKey === assetKey) ?? null
}

export function buildDraftAssetsByKey(
  draft: BuildTeamRosterDraft,
  organizationAssets: ResourceListItemData[],
  rosterMembers: WorkspaceRosterMember[]
): Record<string, ResourceListItemData> {
  const memberById = new Map(rosterMembers.map((member) => [member.id, member]))
  const assetsByKey: Record<string, ResourceListItemData> = {}

  for (const draftAsset of draft.draftAssets ?? []) {
    const catalogAsset = resolveDraftAssetCatalogRecord(draftAsset.assetKey, organizationAssets)
    if (!catalogAsset) continue

    const pocMember = draftAsset.pointOfContactDraftMemberId
      ? memberById.get(draftAsset.pointOfContactDraftMemberId)
      : null

    if (draftAsset.assignmentKind === 'single_resource') {
      assetsByKey[draftAsset.assetKey] = {
        ...catalogAsset,
        orgChartReportsTo:
          draftAsset.effectiveWhen === 'now' ? draftAsset.orgChartReportsTo : null,
        pendingOrgChartReportsTo:
          draftAsset.effectiveWhen === 'next_op_advance' ? draftAsset.orgChartReportsTo : null,
        pointOfContactMemberId: draftAsset.pointOfContactDraftMemberId,
      }
      continue
    }

    assetsByKey[draftAsset.assetKey] = {
      ...catalogAsset,
      pointOfContactMemberId: draftAsset.pointOfContactDraftMemberId,
      pointOfContact: pocMember?.email ?? catalogAsset.pointOfContact,
    }
  }

  return assetsByKey
}

export function buildDraftPositionAssetsByPosition(
  draft: BuildTeamRosterDraft,
  organizationAssets: ResourceListItemData[],
  rosterMembers: WorkspaceRosterMember[]
): Record<string, PositionAssetRosterEntry[]> {
  const memberById = new Map(rosterMembers.map((member) => [member.id, member]))
  const assetsByPosition: Record<string, PositionAssetRosterEntry[]> = {}

  for (const draftAsset of draft.draftAssets ?? []) {
    if (draftAsset.assignmentKind !== 'ics_position' || draftAsset.effectiveWhen !== 'now') {
      continue
    }

    const catalogAsset = resolveDraftAssetCatalogRecord(draftAsset.assetKey, organizationAssets)
    if (!catalogAsset) continue

    const pocMember = draftAsset.pointOfContactDraftMemberId
      ? memberById.get(draftAsset.pointOfContactDraftMemberId)
      : null

    const entry: PositionAssetRosterEntry = {
      assetKey: draftAsset.assetKey,
      name: catalogAsset.name,
      type: catalogAsset.type,
      pointOfContactMemberId: draftAsset.pointOfContactDraftMemberId,
      pointOfContactEmail: pocMember?.email ?? null,
      competencyFunction: null,
    }

    const position = draftAsset.icsPosition
    assetsByPosition[position] = [...(assetsByPosition[position] ?? []), entry]
  }

  return assetsByPosition
}

export function buildDraftAssetSchedulesByPosition(
  draft: BuildTeamRosterDraft
): PositionAssetScheduleMap {
  const schedules: PositionAssetScheduleMap = {}

  for (const draftAsset of draft.draftAssets ?? []) {
    if (draftAsset.effectiveWhen !== 'next_op_advance') {
      continue
    }

    if (draftAsset.assignmentKind === 'ics_position') {
      const position = draftAsset.icsPosition
      const current = schedules[position] ?? { assignAssetKeys: [], unassignAssetKeys: [] }
      schedules[position] = {
        ...current,
        assignAssetKeys: [...current.assignAssetKeys, draftAsset.assetKey],
      }
    }
  }

  return schedules
}
