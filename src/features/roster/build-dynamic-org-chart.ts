import {
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
} from '@/features/roster/ics-org-chart-structure'
import {
  buildWorkspaceOrgChartLayout,
  type WorkspaceOrgChartLayout,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'

export function buildDynamicOrgChart(
  catalog: WorkspacePositionCatalog
): WorkspaceOrgChartLayout {
  return buildWorkspaceOrgChartLayout(catalog, {
    rootPosition: ICS_ORG_CHART_ROOT_POSITION,
    commandStaffBranch: ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
    sectionBranches: ICS_ORG_CHART_SECTION_BRANCHES,
  })
}
