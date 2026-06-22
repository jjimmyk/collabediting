import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { groupAssetScheduleCompetencyByKey } from '@/lib/workspace-position-asset-service'
import type { WorkspacePositionAssetScheduleRow } from '@/lib/workspace-position-asset-types'
import {
  fetchOrganizationCompetencyFunctions,
  updateRosterCompetencyFunction,
  type RosterCompetencyTarget,
  writeLocalCompetencyCatalog,
} from '@/lib/roster-competency-service'
import { groupMemberScheduleCompetencyByKey } from '@/lib/workspace-member-schedule-service'
import type { WorkspaceMemberScheduleRow } from '@/lib/workspace-member-schedule-service'

type UseRosterCompetencyControlsParams = {
  enabled: boolean
  isSupabaseEnabled: boolean
  canManageRoster: boolean
  activeWorkspaceSupabaseId: string | null
  activeOrganizationId: string | null
  getAccessToken: () => Promise<string | null>
  reloadRoster: () => Promise<void>
  reloadMemberSchedules: () => Promise<void>
  reloadWorkspaceAssets: () => Promise<void>
  reloadPositionAssets: () => Promise<void>
  workspaceMemberSchedules: WorkspaceMemberScheduleRow[]
  workspaceAssetSchedules: WorkspacePositionAssetScheduleRow[]
}

export function useRosterCompetencyControls({
  enabled,
  isSupabaseEnabled,
  canManageRoster,
  activeWorkspaceSupabaseId,
  activeOrganizationId,
  getAccessToken,
  reloadRoster,
  reloadMemberSchedules,
  reloadWorkspaceAssets,
  reloadPositionAssets,
  workspaceMemberSchedules,
  workspaceAssetSchedules,
}: UseRosterCompetencyControlsParams) {
  const [organizationCompetencyOptions, setOrganizationCompetencyOptions] = useState<string[]>([])
  const [updatingCompetencyKey, setUpdatingCompetencyKey] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !canManageRoster) return
    let cancelled = false

    const loadCatalog = async () => {
      if (!isSupabaseEnabled) {
        if (activeOrganizationId) {
          const { readLocalCompetencyCatalog } = await import('@/lib/roster-competency-service')
          if (!cancelled) {
            setOrganizationCompetencyOptions(readLocalCompetencyCatalog(activeOrganizationId))
          }
        }
        return
      }

      if (!activeWorkspaceSupabaseId) return
      const accessToken = await getAccessToken()
      if (!accessToken || cancelled) return

      const result = await fetchOrganizationCompetencyFunctions({
        accessToken,
        workspaceId: activeWorkspaceSupabaseId,
        organizationId: activeOrganizationId,
      })

      if (!cancelled && result.ok) {
        setOrganizationCompetencyOptions(result.labels)
      }
    }

    void loadCatalog()
    return () => {
      cancelled = true
    }
  }, [
    activeOrganizationId,
    activeWorkspaceSupabaseId,
    canManageRoster,
    enabled,
    getAccessToken,
    isSupabaseEnabled,
  ])

  const memberScheduleCompetencyByKey = useMemo(
    () => groupMemberScheduleCompetencyByKey(workspaceMemberSchedules),
    [workspaceMemberSchedules]
  )

  const assetScheduleCompetencyByKey = useMemo(
    () => groupAssetScheduleCompetencyByKey(workspaceAssetSchedules),
    [workspaceAssetSchedules]
  )

  const persistCompetency = useCallback(
    async (target: RosterCompetencyTarget, value: string | null, updatingKey: string) => {
      if (!canManageRoster) return
      setUpdatingCompetencyKey(updatingKey)

      try {
        if (isSupabaseEnabled) {
          if (!activeWorkspaceSupabaseId) {
            toast.error('This workspace is not synced to Supabase yet.')
            return
          }
          const accessToken = await getAccessToken()
          if (!accessToken) {
            toast.error('Sign in again to update competency/function.')
            return
          }

          const result = await updateRosterCompetencyFunction({
            accessToken,
            workspaceId: activeWorkspaceSupabaseId,
            competencyFunction: value,
            target,
            organizationId: activeOrganizationId,
          })

          if (!result.ok) {
            toast.error(result.message)
            return
          }

          if (value) {
            setOrganizationCompetencyOptions((previous) =>
              [...new Set([...previous, value])].sort((a, b) => a.localeCompare(b))
            )
          }

          await reloadRoster()
          if (
            target.kind === 'scheduled_member' ||
            target.kind === 'pending_single_resource'
          ) {
            await reloadMemberSchedules()
          }
          if (
            target.kind === 'position_asset' ||
            target.kind === 'scheduled_position_asset' ||
            target.kind === 'org_chart_asset' ||
            target.kind === 'pending_org_chart_asset'
          ) {
            await reloadPositionAssets()
            await reloadWorkspaceAssets()
          }
          return
        }

        if (activeOrganizationId && value) {
          writeLocalCompetencyCatalog(activeOrganizationId, [
            ...organizationCompetencyOptions,
            value,
          ])
          setOrganizationCompetencyOptions((previous) =>
            [...new Set([...previous, value])].sort((a, b) => a.localeCompare(b))
          )
        }
        await reloadRoster()
      } finally {
        setUpdatingCompetencyKey(null)
      }
    },
    [
      activeOrganizationId,
      activeWorkspaceSupabaseId,
      canManageRoster,
      getAccessToken,
      isSupabaseEnabled,
      organizationCompetencyOptions,
      reloadMemberSchedules,
      reloadPositionAssets,
      reloadRoster,
      reloadWorkspaceAssets,
    ]
  )

  const onMemberCompetencyFunctionChange = useCallback(
    (input: {
      memberId: string
      positionName: string
      scope:
        | 'active'
        | 'scheduled_assign'
        | 'scheduled_unassign'
        | 'scheduled_org_chart'
      value: string | null
    }) => {
      const updatingKey = `member::${input.memberId}::${input.positionName}::${input.scope}`
      let target: RosterCompetencyTarget
      if (input.scope === 'active') {
        target = {
          kind: 'member_position',
          memberId: input.memberId,
          positionName: input.positionName,
        }
      } else if (input.scope === 'scheduled_org_chart') {
        target = { kind: 'pending_single_resource', memberId: input.memberId }
      } else {
        target = {
          kind: 'scheduled_member',
          memberId: input.memberId,
          positionName: input.positionName,
          scheduleAction:
            input.scope === 'scheduled_assign' ? 'assign_on_op_advance' : 'unassign_on_op_advance',
        }
      }
      void persistCompetency(target, input.value, updatingKey)
    },
    [persistCompetency]
  )

  const onAssetCompetencyFunctionChange = useCallback(
    (input: {
      assetKey: string
      positionName: string
      scope:
        | 'active'
        | 'scheduled_assign'
        | 'scheduled_unassign'
        | 'scheduled_org_chart'
        | 'org_chart'
      value: string | null
    }) => {
      const updatingKey =
        input.scope === 'org_chart'
          ? `asset::${input.assetKey}::org_chart`
          : `asset::${input.assetKey}::${input.positionName}::${input.scope}`
      let target: RosterCompetencyTarget
      if (input.scope === 'org_chart') {
        target = { kind: 'org_chart_asset', assetKey: input.assetKey }
      } else if (input.scope === 'scheduled_org_chart') {
        target = { kind: 'pending_org_chart_asset', assetKey: input.assetKey }
      } else if (input.scope === 'active') {
        target = {
          kind: 'position_asset',
          assetKey: input.assetKey,
          positionName: input.positionName,
        }
      } else {
        target = {
          kind: 'scheduled_position_asset',
          assetKey: input.assetKey,
          positionName: input.positionName,
          scheduleAction:
            input.scope === 'scheduled_assign' ? 'assign_on_op_advance' : 'unassign_on_op_advance',
        }
      }
      void persistCompetency(target, input.value, updatingKey)
    },
    [persistCompetency]
  )

  const onSingleResourceCompetencyFunctionChange = useCallback(
    (memberId: string, value: string | null, scheduled: boolean) => {
      const updatingKey = `member::${memberId}::single_resource`
      void persistCompetency(
        {
          kind: scheduled ? 'pending_single_resource' : 'single_resource_member',
          memberId,
        },
        value,
        updatingKey
      )
    },
    [persistCompetency]
  )

  return {
    organizationCompetencyOptions,
    updatingCompetencyKey,
    memberScheduleCompetencyByKey,
    assetScheduleCompetencyByKey,
    onMemberCompetencyFunctionChange,
    onAssetCompetencyFunctionChange,
    onSingleResourceCompetencyFunctionChange,
    canEditCompetencyFunction: canManageRoster && enabled,
  }
}
