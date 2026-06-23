import {
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
} from '@/features/roster/ics-org-chart-structure'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'
import { attachOrgChartAssetsToLayout } from '@/features/roster/workspace-asset-org-chart'
import { attachOrgChartSingleResourcesToLayout } from '@/features/roster/workspace-member-org-chart'
import {
  buildWorkspaceOrgChartLayout,
  type WorkspaceOrgChartLayout,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function buildOrgChartLayoutForExport(
  catalog: WorkspacePositionCatalog,
  orgChartAssets: ResourceListItemData[],
  singleResourceMembers: WorkspaceRosterMember[],
  _scope: OrgChartExportScope
): WorkspaceOrgChartLayout {
  const layout = buildWorkspaceOrgChartLayout(catalog, {
    rootPosition: ICS_ORG_CHART_ROOT_POSITION,
    commandStaffBranch: ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
    sectionBranches: ICS_ORG_CHART_SECTION_BRANCHES,
  })
  attachOrgChartAssetsToLayout(layout, orgChartAssets)
  attachOrgChartSingleResourcesToLayout(layout, singleResourceMembers)
  return layout
}
