import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { WorkspaceOrgChartLayout } from '@/features/roster/workspace-positions'
import { normalizePositionName, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { getSingleResourceRosterMembers } from '@/lib/roster-member-assignment'

export function validateMemberOrgChartReportsTo(
  reportsTo: string,
  catalog: WorkspacePositionCatalog
): string | null {
  const normalized = normalizePositionName(reportsTo)
  if (!normalized) {
    return 'Select a position to report to.'
  }
  if (!catalog.allPositionNames.includes(normalized)) {
    return 'Reports-to position must be an existing position in this workspace.'
  }
  return null
}

function attachOrgChartNodeToTree(
  nodes: OrgChartNode[],
  parentName: string,
  child: OrgChartNode
): boolean {
  for (const node of nodes) {
    if (node.kind === 'asset' || node.kind === 'single_resource') {
      continue
    }
    if (node.kind === 'position') {
      if (node.position === parentName) {
        node.children = [...(node.children ?? []), child]
        return true
      }
      if (node.children && attachOrgChartNodeToTree(node.children, parentName, child)) {
        return true
      }
      continue
    }
    if (node.kind === 'group' && attachOrgChartNodeToTree(node.children, parentName, child)) {
      return true
    }
  }
  return false
}

export function attachOrgChartSingleResourcesToLayout(
  layout: WorkspaceOrgChartLayout,
  roster: WorkspaceRosterMember[]
): WorkspaceOrgChartLayout {
  const members = getSingleResourceRosterMembers(roster).sort((a, b) =>
    a.email.localeCompare(b.email)
  )

  for (const member of members) {
    const reportsTo = member.orgChartReportsTo
    if (!reportsTo) continue

    const childNode: OrgChartNode = {
      kind: 'single_resource',
      memberId: member.id,
      label: member.email.split('@')[0] || member.email,
      email: member.email,
      color: 'neutral',
    }

    if (reportsTo === layout.rootPosition) {
      layout.rootChildren.push(childNode)
      continue
    }

    const allBranches: OrgChartNode[] = [
      ...layout.rootChildren,
      ...layout.commandStaffBranch.children,
      ...layout.sectionBranches.flatMap((branch) => branch.children),
    ]
    attachOrgChartNodeToTree(allBranches, reportsTo, childNode)
  }

  return layout
}
