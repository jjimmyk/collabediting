import { useCallback, useEffect, useState } from 'react'
import type { OrgChartPersistedLayout } from '@/features/roster/org-chart-layout/types'
import { EMPTY_ORG_CHART_PERSISTED_LAYOUT } from '@/features/roster/org-chart-layout/types'
import {
  clearWorkspaceOrgChartLayout,
  fetchWorkspaceOrgChartLayout,
  saveWorkspaceOrgChartLayout,
} from '@/lib/workspace-org-chart-layout-service'

type UseWorkspaceOrgChartLayoutOptions = {
  enabled: boolean
  workspaceId: string | null
}

export function useWorkspaceOrgChartLayout({
  enabled,
  workspaceId,
}: UseWorkspaceOrgChartLayoutOptions) {
  const [savedLayout, setSavedLayout] = useState<OrgChartPersistedLayout>(
    EMPTY_ORG_CHART_PERSISTED_LAYOUT
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !workspaceId) {
      setSavedLayout(EMPTY_ORG_CHART_PERSISTED_LAYOUT)
      setError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const layout = await fetchWorkspaceOrgChartLayout(workspaceId!)
        if (cancelled) return
        setSavedLayout(layout)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load org chart layout.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [enabled, workspaceId])

  const saveLayout = useCallback(
    async (accessToken: string, layout: OrgChartPersistedLayout) => {
      if (!workspaceId) {
        throw new Error('Workspace is not available.')
      }
      const result = await saveWorkspaceOrgChartLayout({
        accessToken,
        workspaceId,
        layout,
      })
      if (!result.ok) {
        throw new Error(result.message)
      }
      setSavedLayout(layout)
    },
    [workspaceId]
  )

  const resetLayout = useCallback(
    async (accessToken: string) => {
      if (!workspaceId) {
        throw new Error('Workspace is not available.')
      }
      const result = await clearWorkspaceOrgChartLayout({
        accessToken,
        workspaceId,
      })
      if (!result.ok) {
        throw new Error(result.message)
      }
      setSavedLayout(EMPTY_ORG_CHART_PERSISTED_LAYOUT)
    },
    [workspaceId]
  )

  return {
    savedLayout,
    isLoading,
    error,
    saveLayout,
    resetLayout,
    reload: async () => {
      if (!workspaceId) return
      const layout = await fetchWorkspaceOrgChartLayout(workspaceId)
      setSavedLayout(layout)
    },
  }
}
