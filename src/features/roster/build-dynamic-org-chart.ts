import {
  ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS,
  ICS_ORG_CHART_ROOT_POSITION,
  ICS_ORG_CHART_SECTION_BRANCHES,
  type OrgChartColor,
} from '@/features/roster/ics-org-chart-structure'
import {
  HWCG_SOURCE_CONTROL_ADVISORY_BRANCH,
  HWCG_SOURCE_CONTROL_ADVISORY_POSITIONS,
  HWCG_SOURCE_CONTROL_SECTION_BRANCHES,
  isHwcgSourceControlOrgChartPosition,
} from '@/features/roster/hwcg-source-control-org-chart-structure'
import { HWCG_SOURCE_CONTROL_TEMPLATE_SLUG } from '@/features/roster/hwcg-source-control-roster-template'
import { attachOrgChartAssetsToLayout, attachPendingOrgChartAssetsToLayout } from '@/features/roster/workspace-asset-org-chart'
import {
  attachOrgChartSingleResourcesToLayout,
  attachPendingOrgChartMembersToLayout,
} from '@/features/roster/workspace-member-org-chart'
import {
  buildWorkspaceOrgChartLayout,
  type WorkspaceOrgChartLayout,
  type WorkspacePositionCatalog,
} from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type BuildDynamicOrgChartOptions = {
  templateSlug?: string
}

export function inferRosterTemplateSlugFromCatalog(
  catalog: WorkspacePositionCatalog
): string | null {
  if (catalog.customPositionNames?.has('Source Control Branch')) {
    return HWCG_SOURCE_CONTROL_TEMPLATE_SLUG
  }
  return null
}

function resolveOrgChartBase(templateSlug?: string) {
  if (templateSlug === HWCG_SOURCE_CONTROL_TEMPLATE_SLUG) {
    return {
      rootPosition: ICS_ORG_CHART_ROOT_POSITION,
      commandStaffBranch: HWCG_SOURCE_CONTROL_ADVISORY_BRANCH,
      sectionBranches: HWCG_SOURCE_CONTROL_SECTION_BRANCHES,
    }
  }

  return {
    rootPosition: ICS_ORG_CHART_ROOT_POSITION,
    commandStaffBranch: ICS_ORG_CHART_COMMAND_STAFF_BRANCH,
    sectionBranches: ICS_ORG_CHART_SECTION_BRANCHES,
  }
}

function buildOrgChartLayoutFromCatalog(
  catalog: WorkspacePositionCatalog,
  templateSlug?: string
): WorkspaceOrgChartLayout {
  const isHwcg = templateSlug === HWCG_SOURCE_CONTROL_TEMPLATE_SLUG
  const filteredCatalog = isHwcg
    ? {
        ...catalog,
        customPositions: catalog.customPositions.filter(
          (custom) => !isHwcgSourceControlOrgChartPosition(custom.name)
        ),
      }
    : catalog

  const base = resolveOrgChartBase(templateSlug)

  return buildWorkspaceOrgChartLayout(filteredCatalog, {
    rootPosition: base.rootPosition,
    commandStaffBranch: base.commandStaffBranch,
    sectionBranches: base.sectionBranches,
  })
}

export function buildDynamicOrgChart(
  catalog: WorkspacePositionCatalog,
  orgChartAssets: ResourceListItemData[] = [],
  singleResourceMembers: WorkspaceRosterMember[] = [],
  options: BuildDynamicOrgChartOptions = {}
): WorkspaceOrgChartLayout {
  const templateSlug =
    options.templateSlug ?? inferRosterTemplateSlugFromCatalog(catalog) ?? undefined
  const layout = buildOrgChartLayoutFromCatalog(catalog, templateSlug)
  attachOrgChartAssetsToLayout(layout, orgChartAssets)
  attachPendingOrgChartAssetsToLayout(layout, orgChartAssets)
  attachOrgChartSingleResourcesToLayout(layout, singleResourceMembers)
  return attachPendingOrgChartMembersToLayout(layout, singleResourceMembers)
}

export function isHwcgSourceControlOrgChartTemplate(templateSlug?: string | null): boolean {
  return templateSlug === HWCG_SOURCE_CONTROL_TEMPLATE_SLUG
}

export function getOrgChartCommandStaffPositions(
  templateSlug?: string | null
): readonly string[] {
  if (isHwcgSourceControlOrgChartTemplate(templateSlug)) {
    return HWCG_SOURCE_CONTROL_ADVISORY_POSITIONS
  }
  return ICS_ORG_CHART_COMMAND_STAFF_POSITIONS
}

export function resolveOrgChartRootColor(templateSlug?: string | null): OrgChartColor | undefined {
  return isHwcgSourceControlOrgChartTemplate(templateSlug) ? 'hwcg_ic' : undefined
}
