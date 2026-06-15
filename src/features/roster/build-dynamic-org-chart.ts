import {
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
} from '@/features/roster/ics-org-chart-structure'
import { attachOrgChartAssetsToLayout } from '@/features/roster/workspace-asset-org-chart'
import {
  buildWorkspaceOrgChartLayout,
  type WorkspaceOrgChartLayout,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'

export function buildDynamicOrgChart(
  catalog: WorkspacePositionCatalog,
  orgChartAssets: ResourceListItemData[] = []
): WorkspaceOrgChartLayout {
  const layout = buildWorkspaceOrgChartLayout(catalog, {
    rootPosition: ICS_ORG_CHART_ROOT_POSITION,
    commandStaffBranch: ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
    sectionBranches: ICS_ORG_CHART_SECTION_BRANCHES,
  })
  return attachOrgChartAssetsToLayout(layout, orgChartAssets)
}
