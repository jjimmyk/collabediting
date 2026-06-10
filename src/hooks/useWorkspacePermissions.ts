import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchWorkspacePermissions,
  type ResolvedWorkspacePermissions,
} from '@/lib/workspace-service'

const OFFLINE_PERMISSIONS: ResolvedWorkspacePermissions = {
  positions: ['Incident Commander'],
  permissions: ['edit_ics201'],
  canEditIcs201Form: true,
}

export function useWorkspacePermissions(
  workspaceId: string | null,
  isOrgAdmin: boolean
): ResolvedWorkspacePermissions & { loading: boolean; refresh: () => Promise<void> } {
  const [permissions, setPermissions] = useState<ResolvedWorkspacePermissions>(OFFLINE_PERMISSIONS)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !workspaceId) {
      setPermissions(OFFLINE_PERMISSIONS)
      return
    }

    if (isOrgAdmin) {
      setPermissions({
        positions: ['Org Admin'],
        permissions: ['edit_ics201'],
        canEditIcs201Form: true,
      })
      return
    }

    setLoading(true)
    try {
      const resolved = await fetchWorkspacePermissions(workspaceId)
      setPermissions(resolved)
    } finally {
      setLoading(false)
    }
  }, [isOrgAdmin, workspaceId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    ...permissions,
    loading,
    refresh,
  }
}
