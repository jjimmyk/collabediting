import { useMemo } from 'react'
import type { ComponentProps } from 'react'
import { createHaveLinkRosterPanelRenderer } from '@/features/roster/create-have-link-roster-panel-renderer'
import type { HaveLinkRosterPanelRenderer } from '@/features/roster/WorkspaceRosterPanel'
import { WorkspaceOrgChartRoster } from '@/features/roster/WorkspaceOrgChartRoster'
import { WorkspacePositionRosterTable } from '@/features/roster/WorkspacePositionRosterTable'

type UseHaveLinkEmbeddedRosterPanelOptions = {
  enabled: boolean
  orgChartProps: ComponentProps<typeof WorkspaceOrgChartRoster>
  tableProps: ComponentProps<typeof WorkspacePositionRosterTable>
}

export function useHaveLinkEmbeddedRosterPanel({
  enabled,
  orgChartProps,
  tableProps,
}: UseHaveLinkEmbeddedRosterPanelOptions): HaveLinkRosterPanelRenderer | undefined {
  return useMemo(() => {
    if (!enabled) return undefined
    return createHaveLinkRosterPanelRenderer(orgChartProps, tableProps)
  }, [enabled, orgChartProps, tableProps])
}
