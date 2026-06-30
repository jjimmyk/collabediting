import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceMemberCheckInStatus, WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type {
  PositionRosterInlineInviteProps,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import { PositionRosterCard } from '@/features/roster/PositionRosterCard'
import {
  type PositionRosterAssetHandlers,
} from '@/features/roster/PositionRosterAssetSections'
import type { PositionRosterUnifiedAssignmentSectionsProps, PositionAssignmentSectionsLayout } from '@/features/roster/PositionRosterAssignmentSections'
import { OrgChartCollapsibleAssetCard } from '@/features/roster/OrgChartCollapsibleAssetCard'
import { OrgChartNodeDetailDialog } from '@/features/roster/OrgChartNodeDetailDialog'
import { HaveLinkSingleRefDetailPick } from '@/features/ics215/HaveLinkDetailPickSection'
import type { HaveLinkPickMode } from '@/features/ics215/have-link-pick-mode'
import type { RosterSchedulingPhase } from '@/lib/roster-scheduling-phase'
import type { BuildTeamDraftMember } from '@/features/roster/roster-template-types'
import {
  lookupHaveLinkLocation,
  resolveOrgChartAssetHaveRef,
  resolveSingleResourceHaveRef,
} from '@/features/roster/resolve-roster-have-ref'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import { SingleResourceDetailPanel } from '@/features/roster/SingleResourceDetailPanel'
import {
  OrgChartCrossbarColumns,
  OrgChartCenterSpine,
  OrgChartFork,
  OrgChartInboundStem,
  OrgChartRightIndentStack,
  OrgChartVerticalLine,
} from '@/features/roster/OrgChartConnectors'
import { OrgChartCardAnchor } from '@/features/roster/org-chart-card-anchor'
import { orgChartNodeConnectorId } from '@/features/roster/org-chart-node-id'
import { OrgChartWideLayout } from '@/features/roster/org-chart-wide-layout'
import type { OrgChartWideRenderProps } from '@/features/roster/org-chart-wide-layout.types'
import {
  buildIcDirectReportNodes,
  filterVisibleOrgChartChildren,
  orgChartNodeKey,
  positionBranchIsVisible,
  positionNodeIsVisible,
} from '@/features/roster/org-chart-visibility'
import {
  isHwcgSourceControlOrgChartTemplate,
  getOrgChartCommandStaffPositions,
  resolveOrgChartRootColor,
} from '@/features/roster/build-dynamic-org-chart'
import {
  ORG_CHART_CANVAS_MIN_WIDTH,
  ORG_CHART_ASSET_DETAIL_MODAL_CLASS,
  ORG_CHART_CARD_TO_CHILDREN_GAP,
  ORG_CHART_CONNECTOR_STEM_HEIGHT,
  ORG_CHART_HWCG_POSITION_CARD_WIDTH_FIXED,
  ORG_CHART_POSITION_CARD_MAX_WIDTH,
  ORG_CHART_POSITION_CARD_WIDTH,
  ORG_CHART_SUBORDINATE_ROW_GAP,
  orgChartSectionColumnClassName,
} from '@/features/roster/org-chart-layout-tokens'
import type { RosterDisplayFilters } from '@/features/roster/roster-display-filters'
import { singleResourceNodeVisible } from '@/features/roster/roster-display-filters'
import {
  orgChartBranchSectionKey,
  orgChartSectionFilterEnabled,
} from '@/features/roster/roster-org-chart-sections'
import type { WorkspacePositionType } from '@/features/roster/workspace-position-type'
import { SingleResourceOrgChartCard } from '@/features/roster/SingleResourceOrgChartCard'
import type { WorkspaceOrgChartLayout, WorkspacePositionMeta, WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { OrgChartExportScope } from '@/features/roster/org-chart-export-scope'

import {
  rosterOrgCommandStaffCrossbarClassName,
  rosterOrgSectionColumnsClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'
import {
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'

type WorkspaceOrgChartRosterProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isUpdatingOpAdvanceLabel?: string | null
  workspaceLabel: string
  layoutMode?: RosterPanelLayoutMode
  orgChartTemplateSlug?: string | null
  zoom?: number
  showOpAdvanceLabels?: boolean
  positionMetaByName?: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (
    userId: string,
    position: string,
    mode?: RosterInviteAssignmentMode,
    email?: string
  ) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
  draftMembersForOrgDedupe?: BuildTeamDraftMember[]
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveAssetFromOrgChart?: (assetKey: string) => void
  onRemoveSingleResourceFromOrgChart?: (memberId: string) => void
  showCheckInStatus?: boolean
  canEditCheckInStatus?: boolean
  updatingCheckInMemberId?: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  competencyOptions?: string[]
  canEditCompetencyFunction?: boolean
  updatingCompetencyKey?: string | null
  onSingleResourceCompetencyFunctionChange?: (
    memberId: string,
    value: string | null,
    scheduled: boolean
  ) => void
  onMemberCompetencyFunctionChange?: (input: {
    memberId: string
    positionName: string
    scope:
      | 'active'
      | 'scheduled_assign'
      | 'scheduled_unassign'
      | 'scheduled_org_chart'
    value: string | null
  }) => void
  memberScheduleCompetencyByKey?: Record<string, string | null>
  onAssetCompetencyFunctionChange?: PositionRosterUnifiedAssignmentSectionsProps['onAssetCompetencyFunctionChange']
  showPositionAssets?: boolean
  assignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  pocMembers?: WorkspaceRosterMember[]
  onRemovePositionFromRoster?: (position: string) => void
  removingPositionFromRoster?: string | null
  canRemovePositionFromRoster?: (entry: PositionRosterEntry) => boolean
  positionRemovalBlockedReason?: (entry: PositionRosterEntry) => string | null
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
  positionCatalog?: WorkspacePositionCatalog
  isUpdatingPositionIdentity?: string | null
  onSaveCustomPosition?: (input: {
    positionId: string
    currentName: string
    name?: string
    reportsTo?: string
  }) => void | Promise<void>
  onCreateResourceCategory?: (
    position: string,
    name: string,
    lifecycle: import('@/lib/workspace-resource-category-types').ResourceCategoryLifecycle
  ) => void
  onDeleteResourceCategory?: (categoryId: string) => void
  onScheduleResourceCategoryForNextOp?: (categoryId: string, position: string) => void
  onFillResourceCategoryMember?: (categoryId: string, memberId: string) => void
  onFillResourceCategoryAsset?: (categoryId: string, assetKey: string) => void
  onClearResourceCategoryFill?: (categoryId: string) => void
  isSavingAssetOrgChartPlacement?: boolean
  onAssetOrgChartPlacementChange?: (assetKey: string, reportsTo: string | null) => void
  isUpdatingSingleResourcePlacement?: string | null
  onSingleResourceOrgChartPlacementChange?: (
    memberId: string,
    reportsTo: string,
    scheduled: boolean
  ) => void
  exportMode?: boolean
  haveLinkIndexByRef?: PositionRosterUnifiedAssignmentSectionsProps['haveLinkIndexByRef']
  activeHaveCell?: PositionRosterUnifiedAssignmentSectionsProps['activeHaveCell']
  highlightedHaveRef?: PositionRosterUnifiedAssignmentSectionsProps['highlightedHaveRef']
  haveLinkPickMode?: HaveLinkPickMode
  ics215aLocationsByPosition?: import('@/features/ics215a/location-utils').Ics215aLocationByPositionIndex
  onFocusIcs215aRowOnMap?: (rowId: number) => void
  assignmentSectionsLayout?: PositionAssignmentSectionsLayout
  isProjected?: boolean
  rosterTimeHorizon?: OrgChartExportScope
  managementEntriesByPosition?: Record<string, PositionRosterEntry>
  rosterSchedulingPhase?: RosterSchedulingPhase
} & Partial<PositionRosterAssetHandlers>

type OrgChartRenderProps = {
  layoutMode: RosterPanelLayoutMode
  orgChartTemplateSlug?: string | null
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
  displayFilters: RosterDisplayFilters
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleAssignableByPosition: Record<string, WorkspaceRosterMember[]>
  scheduleUnassignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isUpdatingOpAdvanceLabel: string | null
  showOpAdvanceLabels: boolean
  positionMetaByName: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (
    userId: string,
    position: string,
    mode?: RosterInviteAssignmentMode,
    email?: string
  ) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
  draftMembersForOrgDedupe?: BuildTeamDraftMember[]
  onScheduleAssignMember: (memberId: string, position: string) => void
  onScheduleUnassignMember: (memberId: string, position: string) => void
  onRemoveScheduledAssign: (memberId: string, position: string) => void
  onRemoveScheduledUnassign: (memberId: string, position: string) => void
  onInviteToPosition: (position: string, mode: RosterInviteAssignmentMode) => void
  onUnassignMember: (memberId: string, position: string) => void
  inlinePositionInvite?: PositionRosterInlineInviteProps
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveAssetFromOrgChart?: (assetKey: string) => void
  onRemoveSingleResourceFromOrgChart?: (memberId: string) => void
  showCheckInStatus: boolean
  canEditCheckInStatus: boolean
  updatingCheckInMemberId: string | null
  onCheckInStatusChange?: (memberId: string, status: WorkspaceMemberCheckInStatus) => void
  showAllowWorkAssignment: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  showPositionAssets: boolean
  assignableAssetsByPosition: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition: Record<string, ResourceListItemData[]>
  pocMembers: WorkspaceRosterMember[]
  onAssignAsset?: (assetKey: string, position: string, pointOfContactMemberId?: string) => void
  onUnassignAsset?: (assetKey: string, position: string) => void
  onScheduleAssignAsset?: (assetKey: string, position: string) => void
  onScheduleUnassignAsset?: (assetKey: string, position: string) => void
  onRemoveScheduledAssignAsset?: (assetKey: string, position: string) => void
  onRemoveScheduledUnassignAsset?: (assetKey: string, position: string) => void
  onUpdateAssetPointOfContact?: (assetKey: string, memberId: string | null) => void
  onRemovePositionFromRoster?: (position: string) => void
  removingPositionFromRoster?: string | null
  canRemovePositionFromRoster?: (entry: PositionRosterEntry) => boolean
  positionRemovalBlockedReason?: (entry: PositionRosterEntry) => string | null
  onPositionTypeChange?: (
    position: string,
    positionType: WorkspacePositionType | null,
    customTypeLabel: string | null
  ) => void
  positionCatalog?: WorkspacePositionCatalog
  isUpdatingPositionIdentity?: string | null
  onSaveCustomPosition?: (input: {
    positionId: string
    currentName: string
    name?: string
    reportsTo?: string
  }) => void | Promise<void>
  onCreateResourceCategory?: (
    position: string,
    name: string,
    lifecycle: import('@/lib/workspace-resource-category-types').ResourceCategoryLifecycle
  ) => void
  onDeleteResourceCategory?: (categoryId: string) => void
  onScheduleResourceCategoryForNextOp?: (categoryId: string, position: string) => void
  onFillResourceCategoryMember?: (categoryId: string, memberId: string) => void
  onFillResourceCategoryAsset?: (categoryId: string, assetKey: string) => void
  onClearResourceCategoryFill?: (categoryId: string) => void
  exportMode?: boolean
  isProjected: boolean
  rosterTimeHorizon: OrgChartExportScope
  managementEntriesByPosition?: Record<string, PositionRosterEntry>
  onOpenOrgChartAssetDetail: (assetKey: string) => void
  onOpenSingleResourceDetail: (memberId: string) => void
  competencyOptions: string[]
  canEditCompetencyFunction: boolean
  updatingCompetencyKey: string | null
  onMemberCompetencyFunctionChange?: (input: {
    memberId: string
    positionName: string
    scope:
      | 'active'
      | 'scheduled_assign'
      | 'scheduled_unassign'
      | 'scheduled_org_chart'
    value: string | null
  }) => void
  memberScheduleCompetencyByKey: Record<string, string | null>
  onAssetCompetencyFunctionChange?: PositionRosterUnifiedAssignmentSectionsProps['onAssetCompetencyFunctionChange']
  onSingleResourceCompetencyFunctionChange?: (
    memberId: string,
    value: string | null,
    scheduled: boolean
  ) => void
  haveLinkIndexByRef?: PositionRosterUnifiedAssignmentSectionsProps['haveLinkIndexByRef']
  activeHaveCell?: PositionRosterUnifiedAssignmentSectionsProps['activeHaveCell']
  highlightedHaveRef?: PositionRosterUnifiedAssignmentSectionsProps['highlightedHaveRef']
  haveLinkPickMode?: HaveLinkPickMode
  ics215aLocationsByPosition?: import('@/features/ics215a/location-utils').Ics215aLocationByPositionIndex
  onFocusIcs215aRowOnMap?: (rowId: number) => void
  rosterSchedulingPhase?: RosterSchedulingPhase
}

function isSubordinateRowChild(node: OrgChartNode): boolean {
  return node.kind === 'position' || node.kind === 'asset' || node.kind === 'single_resource'
}

function OrgChartLayoutNode({
  node,
  parentColor,
  renderProps,
  stackConnectFromParent = false,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
  stackConnectFromParent?: boolean
}) {
  if (node.kind === 'stack') {
    const visibleChildren = filterVisibleOrgChartChildren(
      node.children,
      renderProps.visiblePositions,
      renderProps.displayFilters,
      renderProps.isProjected
    )
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartRightIndentStack connectFromParent={stackConnectFromParent}>
        {visibleChildren.map((child, index) => (
          <OrgChartLayoutNode
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartRightIndentStack>
    )
  }

  if (node.kind === 'fork') {
    const visibleChildren = filterVisibleOrgChartChildren(
      node.children,
      renderProps.visiblePositions,
      renderProps.displayFilters,
      renderProps.isProjected
    )
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartFork
        layout={renderProps.layoutMode === 'wide' ? 'horizontal' : 'vertical'}
        forkVariant={node.forkVariant}
      >
        {visibleChildren.map((child, index) => (
          <OrgChartLayoutNode
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartFork>
    )
  }

  return (
    <OrgChartChildNode node={node} parentColor={parentColor} renderProps={renderProps} />
  )
}

function OrgChartChildren({
  children,
  parentColor,
  renderProps,
  connectFromParent = false,
}: {
  children: OrgChartNode[]
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
  connectFromParent?: boolean
}) {
  const visibleChildren = filterVisibleOrgChartChildren(
    children,
    renderProps.visiblePositions,
    renderProps.displayFilters,
    renderProps.isProjected
  )
  if (visibleChildren.length === 0) return null

  if (visibleChildren.every(isSubordinateRowChild)) {
    return (
      <OrgChartRightIndentStack connectFromParent={connectFromParent}>
        {visibleChildren.map((child, index) => (
          <OrgChartLayoutNode
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartRightIndentStack>
    )
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col items-center',
        ORG_CHART_SUBORDINATE_ROW_GAP
      )}
    >
      {visibleChildren.map((child, index) => {
        if (child.kind === 'stack') {
          return (
            <OrgChartLayoutNode
              key={orgChartNodeKey(child, index)}
              node={child}
              parentColor={parentColor}
              renderProps={renderProps}
              stackConnectFromParent
            />
          )
        }

        if (child.kind === 'fork') {
          return (
            <OrgChartInboundStem key={orgChartNodeKey(child, index)}>
              <OrgChartLayoutNode
                node={child}
                parentColor={parentColor}
                renderProps={renderProps}
              />
            </OrgChartInboundStem>
          )
        }

        return (
          <OrgChartInboundStem key={orgChartNodeKey(child, index)}>
            <OrgChartLayoutNode
              node={child}
              parentColor={parentColor}
              renderProps={renderProps}
            />
          </OrgChartInboundStem>
        )
      })}
    </div>
  )
}

function OrgChartChildNode({
  node,
  parentColor,
  renderProps,
  suppressChildren = false,
  connectorAnchorId,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
  suppressChildren?: boolean
  connectorAnchorId?: string
}) {
  const wrapAnchor = (content: React.ReactNode, className?: string) =>
    connectorAnchorId ? (
      <OrgChartCardAnchor id={connectorAnchorId} className={className}>
        {content}
      </OrgChartCardAnchor>
    ) : (
      content
    )

  if (node.kind === 'asset') {
    const asset = renderProps.assetsByKey[node.assetKey]
    if (!asset) return null

    const scheduled = node.scheduled ?? false

    return (
      <div className={cn('flex w-full min-w-0 justify-center', ORG_CHART_POSITION_CARD_WIDTH)}>
        {wrapAnchor(
          <OrgChartCollapsibleAssetCard
            asset={asset}
            color={node.color ?? parentColor}
            scheduled={scheduled}
            glassItemBorderClasses={renderProps.glassItemBorderClasses}
            canManage={renderProps.canManageRoster}
            pocMembers={renderProps.pocMembers}
            removeLabel={
              scheduled
                ? `Remove ${asset.name} from next OP org chart schedule`
                : `Remove ${asset.name} from org chart`
            }
            onOpenDetail={() => renderProps.onOpenOrgChartAssetDetail(asset.assetKey)}
            onRemove={
              renderProps.canManageRoster && renderProps.onRemoveAssetFromOrgChart
                ? () => renderProps.onRemoveAssetFromOrgChart!(asset.assetKey)
                : undefined
            }
            onUpdateAssetPointOfContact={renderProps.onUpdateAssetPointOfContact}
          />
        )}
      </div>
    )
  }

  if (node.kind === 'single_resource') {
    if (!singleResourceNodeVisible(node.scheduled, renderProps.displayFilters, renderProps.isProjected)) {
      return null
    }
    const member = renderProps.rosterById[node.memberId]
    if (!member) return null
    return (
      <div className={cn('flex w-full min-w-0 justify-center', ORG_CHART_POSITION_CARD_WIDTH)}>
        {wrapAnchor(
          <SingleResourceOrgChartCard
            member={member}
            color={node.color ?? parentColor}
            scheduled={renderProps.isProjected ? false : node.scheduled}
            canManage={renderProps.canManageRoster}
            onOpenDetail={() => renderProps.onOpenSingleResourceDetail(member.id)}
            onRemoveFromOrgChart={renderProps.onRemoveSingleResourceFromOrgChart}
          />
        )}
      </div>
    )
  }

  if (
    node.kind !== 'position' ||
    !positionNodeIsVisible(
      node.position,
      node.children ?? [],
      renderProps.visiblePositions,
      renderProps.displayFilters,
      renderProps.isProjected
    )
  ) {
    return null
  }

  return (
    <PositionNode
      position={node.position}
      color={node.color ?? parentColor}
      children={node.children ?? []}
      suppressChildren={suppressChildren}
      connectorAnchorId={connectorAnchorId}
      {...renderProps}
    />
  )
}

function PositionNode({
  position,
  color,
  children = [],
  suppressChildren = false,
  connectorAnchorId,
  layoutMode,
  entriesByPosition,
  assetsByKey,
  rosterById,
  visiblePositions,
  displayFilters,
  assignableByPosition,
  scheduleAssignableByPosition,
  scheduleUnassignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  isUpdatingOpAdvanceLabel,
  showOpAdvanceLabels,
  positionMetaByName,
  onToggleEditIcs201,
  onAssignExistingMember,
  onSearchOrgMembers,
  onAssignOrgMember,
  workspaceRosterMembers = [],
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
  inlinePositionInvite,
  onOpAdvanceLabelChange,
  onFocusAsset,
  onRemoveAssetFromOrgChart,
  onRemoveSingleResourceFromOrgChart,
  showCheckInStatus,
  canEditCheckInStatus,
  updatingCheckInMemberId,
  onCheckInStatusChange,
  showAllowWorkAssignment,
  onToggleAllowWorkAssignment,
  showPositionAssets,
  assignableAssetsByPosition,
  scheduleAssignableAssetsByPosition,
  scheduleUnassignableAssetsByPosition,
  pocMembers,
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
  onRemovePositionFromRoster,
  removingPositionFromRoster,
  canRemovePositionFromRoster,
  positionRemovalBlockedReason,
  onPositionTypeChange,
  positionCatalog,
  isUpdatingPositionIdentity,
  onSaveCustomPosition,
  onCreateResourceCategory,
  onDeleteResourceCategory,
  onScheduleResourceCategoryForNextOp,
  onFillResourceCategoryMember,
  onFillResourceCategoryAsset,
  onClearResourceCategoryFill,
  onOpenOrgChartAssetDetail,
  onOpenSingleResourceDetail,
  competencyOptions,
  canEditCompetencyFunction,
  updatingCompetencyKey,
  onMemberCompetencyFunctionChange,
  memberScheduleCompetencyByKey,
  onAssetCompetencyFunctionChange,
  onSingleResourceCompetencyFunctionChange,
  haveLinkIndexByRef,
  activeHaveCell = null,
  highlightedHaveRef = null,
  haveLinkPickMode,
  isProjected = false,
  rosterTimeHorizon = 'current_op',
  orgChartTemplateSlug = null,
  managementEntriesByPosition,
  ics215aLocationsByPosition = {},
  onFocusIcs215aRowOnMap,
  rosterSchedulingPhase = 'live_ops',
  draftMembersForOrgDedupe = [],
}: {
  position: string
  color?: OrgChartColor
  children?: OrgChartNode[]
  suppressChildren?: boolean
  connectorAnchorId?: string
} & OrgChartRenderProps) {
  if (
    !positionNodeIsVisible(position, children, visiblePositions, displayFilters, isProjected)
  ) {
    return null
  }
  const entry = entriesByPosition[position]
  if (!entry) return null
  const managementEntry = managementEntriesByPosition?.[position]

  const renderProps: OrgChartRenderProps = {
    layoutMode,
    entriesByPosition,
    assetsByKey,
    rosterById,
    visiblePositions,
    displayFilters,
    isProjected,
    rosterTimeHorizon,
    orgChartTemplateSlug,
    managementEntriesByPosition,
    assignableByPosition,
    scheduleAssignableByPosition,
    scheduleUnassignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    isUpdatingOpAdvanceLabel,
    showOpAdvanceLabels,
    positionMetaByName,
    onToggleEditIcs201,
    onAssignExistingMember,
    onSearchOrgMembers,
    onAssignOrgMember,
    workspaceRosterMembers,
    onScheduleAssignMember,
    onScheduleUnassignMember,
    onRemoveScheduledAssign,
    onRemoveScheduledUnassign,
    onInviteToPosition,
    onUnassignMember,
    inlinePositionInvite,
    onOpAdvanceLabelChange,
    onFocusAsset,
    onRemoveAssetFromOrgChart,
    onRemoveSingleResourceFromOrgChart,
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
    showAllowWorkAssignment,
    onToggleAllowWorkAssignment,
    showPositionAssets,
    assignableAssetsByPosition,
    scheduleAssignableAssetsByPosition,
    scheduleUnassignableAssetsByPosition,
    pocMembers,
    onAssignAsset,
    onUnassignAsset,
    onScheduleAssignAsset,
    onScheduleUnassignAsset,
    onRemoveScheduledAssignAsset,
    onRemoveScheduledUnassignAsset,
    onUpdateAssetPointOfContact,
    onRemovePositionFromRoster,
    removingPositionFromRoster,
    canRemovePositionFromRoster,
    positionRemovalBlockedReason,
    onPositionTypeChange,
    positionCatalog,
    isUpdatingPositionIdentity,
    onSaveCustomPosition,
    onOpenOrgChartAssetDetail,
    onOpenSingleResourceDetail,
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
    onMemberCompetencyFunctionChange,
    memberScheduleCompetencyByKey,
    onAssetCompetencyFunctionChange,
    onSingleResourceCompetencyFunctionChange,
    haveLinkIndexByRef,
    activeHaveCell,
    highlightedHaveRef,
    haveLinkPickMode,
    ics215aLocationsByPosition,
    onFocusIcs215aRowOnMap,
    rosterSchedulingPhase,
    draftMembersForOrgDedupe,
  }

  const canRemove =
    canRemovePositionFromRoster?.(managementEntry ?? entry) ?? false
  const removalBlockedReason = positionRemovalBlockedReason?.(managementEntry ?? entry) ?? null
  const hasVisibleChildren =
    !suppressChildren &&
    filterVisibleOrgChartChildren(children, visiblePositions, displayFilters, isProjected).length >
      0
  const useHwcgCards = isHwcgSourceControlOrgChartTemplate(orgChartTemplateSlug)
  const cardWidthClass = useHwcgCards
    ? ORG_CHART_HWCG_POSITION_CARD_WIDTH_FIXED
    : layoutMode === 'wide'
      ? ORG_CHART_POSITION_CARD_MAX_WIDTH
      : undefined

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col',
        hasVisibleChildren
          ? ['items-start', ORG_CHART_CARD_TO_CHILDREN_GAP]
          : 'items-center',
        cardWidthClass
      )}
    >
      {connectorAnchorId ? (
        <OrgChartCardAnchor id={connectorAnchorId} className="w-full">
          <PositionRosterCard
            entry={entry}
            managementEntry={managementEntry}
            rosterTimeHorizon={rosterTimeHorizon}
            assignable={assignableByPosition[position] ?? []}
            scheduleAssignable={scheduleAssignableByPosition[position] ?? []}
            scheduleUnassignable={scheduleUnassignableByPosition[position] ?? []}
            canManageRoster={canManageRoster}
            glassItemBorderClasses={glassItemBorderClasses}
            isPermissionBusy={isUpdatingPermission === position}
            isAssignBusy={isAssigningPosition === position}
            variant="org"
            color={color}
            layoutMode={layoutMode}
            orgChartTemplateSlug={orgChartTemplateSlug}
            showOpAdvanceLabels={showOpAdvanceLabels}
            positionMeta={positionMetaByName[position]}
            isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel === position}
            onOpAdvanceLabelChange={
              onOpAdvanceLabelChange
                ? (label) => onOpAdvanceLabelChange(position, label)
                : undefined
            }
            onToggleEditIcs201={onToggleEditIcs201}
            onAssignExistingMember={onAssignExistingMember}
            onSearchOrgMembers={onSearchOrgMembers}
            onAssignOrgMember={onAssignOrgMember}
            workspaceRosterMembers={workspaceRosterMembers}
            onScheduleAssignMember={onScheduleAssignMember}
            onScheduleUnassignMember={onScheduleUnassignMember}
            onRemoveScheduledAssign={onRemoveScheduledAssign}
            onRemoveScheduledUnassign={onRemoveScheduledUnassign}
            onInviteToPosition={onInviteToPosition}
            onUnassignMember={onUnassignMember}
            inlinePositionInvite={inlinePositionInvite}
            showCheckInStatus={showCheckInStatus}
            canEditCheckInStatus={canEditCheckInStatus}
            updatingCheckInMemberId={updatingCheckInMemberId}
            onCheckInStatusChange={onCheckInStatusChange}
            competencyOptions={competencyOptions}
            canEditCompetencyFunction={canEditCompetencyFunction}
            updatingCompetencyKey={updatingCompetencyKey}
            memberScheduleCompetencyByKey={memberScheduleCompetencyByKey}
            onMemberCompetencyFunctionChange={onMemberCompetencyFunctionChange}
            onAssetCompetencyFunctionChange={onAssetCompetencyFunctionChange}
            showAllowWorkAssignment={showAllowWorkAssignment}
            onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
            onPositionTypeChange={onPositionTypeChange}
            showPositionAssets={showPositionAssets}
            assignableAssets={assignableAssetsByPosition[position] ?? []}
            scheduleAssignableAssets={scheduleAssignableAssetsByPosition[position] ?? []}
            scheduleUnassignableAssets={scheduleUnassignableAssetsByPosition[position] ?? []}
            pocMembers={pocMembers}
            assetsByKey={assetsByKey}
            onFocusAsset={onFocusAsset}
            onAssignAsset={onAssignAsset}
            onUnassignAsset={onUnassignAsset}
            onScheduleAssignAsset={onScheduleAssignAsset}
            onScheduleUnassignAsset={onScheduleUnassignAsset}
            onRemoveScheduledAssignAsset={onRemoveScheduledAssignAsset}
            onRemoveScheduledUnassignAsset={onRemoveScheduledUnassignAsset}
            onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
            canRemoveFromRoster={canRemove}
            removalBlockedReason={removalBlockedReason}
            isRemovingFromRoster={removingPositionFromRoster === position}
            onRemoveFromRoster={
              canManageRoster && onRemovePositionFromRoster
                ? () => onRemovePositionFromRoster(position)
                : undefined
            }
            positionCatalog={positionCatalog}
            isUpdatingPositionIdentity={isUpdatingPositionIdentity === position}
            onSaveCustomPosition={onSaveCustomPosition}
            onCreateResourceCategory={onCreateResourceCategory}
            onDeleteResourceCategory={onDeleteResourceCategory}
            onScheduleResourceCategoryForNextOp={onScheduleResourceCategoryForNextOp}
            onFillResourceCategoryMember={onFillResourceCategoryMember}
            onFillResourceCategoryAsset={onFillResourceCategoryAsset}
            onClearResourceCategoryFill={onClearResourceCategoryFill}
            haveLinkIndexByRef={haveLinkIndexByRef}
            activeHaveCell={activeHaveCell}
            highlightedHaveRef={highlightedHaveRef}
            haveLinkPickMode={haveLinkPickMode}
            ics215aLocationEntries={ics215aLocationsByPosition[position] ?? []}
            onFocusIcs215aRowOnMap={onFocusIcs215aRowOnMap}
            rosterSchedulingPhase={rosterSchedulingPhase}
            draftMembersForOrgDedupe={draftMembersForOrgDedupe}
          />
        </OrgChartCardAnchor>
      ) : (
        <PositionRosterCard
          entry={entry}
          managementEntry={managementEntry}
          rosterTimeHorizon={rosterTimeHorizon}
          assignable={assignableByPosition[position] ?? []}
          scheduleAssignable={scheduleAssignableByPosition[position] ?? []}
          scheduleUnassignable={scheduleUnassignableByPosition[position] ?? []}
          canManageRoster={canManageRoster}
          glassItemBorderClasses={glassItemBorderClasses}
          isPermissionBusy={isUpdatingPermission === position}
          isAssignBusy={isAssigningPosition === position}
          variant="org"
          color={color}
          layoutMode={layoutMode}
          showOpAdvanceLabels={showOpAdvanceLabels}
          positionMeta={positionMetaByName[position]}
          isUpdatingOpAdvanceLabel={isUpdatingOpAdvanceLabel === position}
          onOpAdvanceLabelChange={
            onOpAdvanceLabelChange
              ? (label) => onOpAdvanceLabelChange(position, label)
              : undefined
          }
          onToggleEditIcs201={onToggleEditIcs201}
          onAssignExistingMember={onAssignExistingMember}
          onSearchOrgMembers={onSearchOrgMembers}
          onAssignOrgMember={onAssignOrgMember}
          workspaceRosterMembers={workspaceRosterMembers}
          onScheduleAssignMember={onScheduleAssignMember}
          onScheduleUnassignMember={onScheduleUnassignMember}
          onRemoveScheduledAssign={onRemoveScheduledAssign}
          onRemoveScheduledUnassign={onRemoveScheduledUnassign}
          onInviteToPosition={onInviteToPosition}
          onUnassignMember={onUnassignMember}
          inlinePositionInvite={inlinePositionInvite}
          showCheckInStatus={showCheckInStatus}
          canEditCheckInStatus={canEditCheckInStatus}
          updatingCheckInMemberId={updatingCheckInMemberId}
          onCheckInStatusChange={onCheckInStatusChange}
          competencyOptions={competencyOptions}
          canEditCompetencyFunction={canEditCompetencyFunction}
          updatingCompetencyKey={updatingCompetencyKey}
          memberScheduleCompetencyByKey={memberScheduleCompetencyByKey}
          onMemberCompetencyFunctionChange={onMemberCompetencyFunctionChange}
          onAssetCompetencyFunctionChange={onAssetCompetencyFunctionChange}
          showAllowWorkAssignment={showAllowWorkAssignment}
          onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
          onPositionTypeChange={onPositionTypeChange}
          showPositionAssets={showPositionAssets}
          assignableAssets={assignableAssetsByPosition[position] ?? []}
          scheduleAssignableAssets={scheduleAssignableAssetsByPosition[position] ?? []}
          scheduleUnassignableAssets={scheduleUnassignableAssetsByPosition[position] ?? []}
          pocMembers={pocMembers}
          assetsByKey={assetsByKey}
          onFocusAsset={onFocusAsset}
          onAssignAsset={onAssignAsset}
          onUnassignAsset={onUnassignAsset}
          onScheduleAssignAsset={onScheduleAssignAsset}
          onScheduleUnassignAsset={onScheduleUnassignAsset}
          onRemoveScheduledAssignAsset={onRemoveScheduledAssignAsset}
          onRemoveScheduledUnassignAsset={onRemoveScheduledUnassignAsset}
          onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
          canRemoveFromRoster={canRemove}
          removalBlockedReason={removalBlockedReason}
          isRemovingFromRoster={removingPositionFromRoster === position}
          onRemoveFromRoster={
            canManageRoster && onRemovePositionFromRoster
              ? () => onRemovePositionFromRoster(position)
              : undefined
          }
          positionCatalog={positionCatalog}
          isUpdatingPositionIdentity={isUpdatingPositionIdentity === position}
          onSaveCustomPosition={onSaveCustomPosition}
          onCreateResourceCategory={onCreateResourceCategory}
          onDeleteResourceCategory={onDeleteResourceCategory}
          onScheduleResourceCategoryForNextOp={onScheduleResourceCategoryForNextOp}
          onFillResourceCategoryMember={onFillResourceCategoryMember}
          onFillResourceCategoryAsset={onFillResourceCategoryAsset}
          onClearResourceCategoryFill={onClearResourceCategoryFill}
          haveLinkIndexByRef={haveLinkIndexByRef}
          activeHaveCell={activeHaveCell}
          highlightedHaveRef={highlightedHaveRef}
          haveLinkPickMode={haveLinkPickMode}
          ics215aLocationEntries={ics215aLocationsByPosition[position] ?? []}
          onFocusIcs215aRowOnMap={onFocusIcs215aRowOnMap}
          rosterSchedulingPhase={rosterSchedulingPhase}
          draftMembersForOrgDedupe={draftMembersForOrgDedupe}
        />
      )}
      {!suppressChildren ? (
        <OrgChartChildren
          children={children}
          parentColor={color}
          renderProps={renderProps}
          connectFromParent
        />
      ) : null}
    </div>
  )
}

function GroupBranch({
  node,
  renderProps,
}: {
  node: Extract<OrgChartNode, { kind: 'group' }>
  renderProps: OrgChartRenderProps
}) {
  const chief = node.children.find(
    (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
      child.kind === 'position' &&
      positionBranchIsVisible(
        child,
        renderProps.visiblePositions,
        renderProps.displayFilters,
        renderProps.isProjected
      )
  )
  if (!chief) return null

  return (
    <PositionNode
      position={chief.position}
      color={chief.color ?? node.color}
      children={chief.children ?? []}
      {...renderProps}
    />
  )
}

function getCommandStaffPositionNode(
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>,
  position: string
): Extract<OrgChartNode, { kind: 'position' }> | null {
  return (
    commandStaffBranch.children.find(
      (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
        child.kind === 'position' && child.position === position
    ) ?? null
  )
}

function getVisibleCommandStaffPositions(
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>,
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters,
  templateSlug?: string | null,
  isProjected = false
): string[] {
  const positions = getOrgChartCommandStaffPositions(templateSlug)
  return positions.filter((position) => {
    const node = getCommandStaffPositionNode(commandStaffBranch, position)
    if (!node) return false
    return positionBranchIsVisible(node, visiblePositions, displayFilters, isProjected)
  })
}

function CommandStaffPositionNode({
  commandStaffBranch,
  position,
  renderProps,
}: {
  commandStaffBranch: Extract<OrgChartNode, { kind: 'group' }>
  position: string
  renderProps: OrgChartRenderProps
}) {
  const node = getCommandStaffPositionNode(commandStaffBranch, position)
  if (!node) return null

  return (
    <PositionNode
      position={position}
      color={node.color ?? 'neutral'}
      children={node.children ?? []}
      {...renderProps}
    />
  )
}

function SectionBranchesCrossbar({
  visibleSectionBranches,
  layoutMode,
  renderProps,
  showInboundStem,
}: {
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  layoutMode: RosterPanelLayoutMode
  renderProps: OrgChartRenderProps
  showInboundStem: boolean
}) {
  if (visibleSectionBranches.length === 0) return null

  if (layoutMode === 'wide') {
    return (
      <OrgChartCrossbarColumns
        columnClassName={rosterOrgSectionColumnsClassName(layoutMode)}
        columns={visibleSectionBranches.map((branch) => (
          <div
            key={branch.label}
            className={cn(
              'flex flex-col items-start',
              orgChartSectionColumnClassName(branch.label, renderProps.orgChartTemplateSlug)
            )}
          >
            <GroupBranch node={branch} renderProps={renderProps} />
          </div>
        ))}
        showInboundStem={showInboundStem}
      />
    )
  }

  return (
    <>
      {showInboundStem ? (
        <OrgChartVerticalLine heightClassName={ORG_CHART_CONNECTOR_STEM_HEIGHT} />
      ) : null}
      <div
        className={cn(
          'grid w-max min-w-full gap-x-4 gap-y-6',
          rosterOrgSectionColumnsClassName(layoutMode)
        )}
      >
        {visibleSectionBranches.map((branch) => (
          <div
            key={branch.label}
            className={cn(
              'flex flex-col items-start',
              orgChartSectionColumnClassName(branch.label, renderProps.orgChartTemplateSlug)
            )}
          >
            <GroupBranch node={branch} renderProps={renderProps} />
          </div>
        ))}
      </div>
    </>
  )
}

function IncidentCommanderSpine({
  orgChartLayout,
  renderProps,
  visibleSectionBranches,
  showCommandStaff,
  visibleCommandStaff,
  connectFromParent = true,
}: {
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartRenderProps
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  showCommandStaff: boolean
  visibleCommandStaff: string[]
  connectFromParent?: boolean
}) {
  const { layoutMode } = renderProps
  const visibleRootChildren = filterVisibleOrgChartChildren(
    orgChartLayout.rootChildren,
    renderProps.visiblePositions,
    renderProps.displayFilters,
    renderProps.isProjected
  )
  const hasSections = visibleSectionBranches.length > 0
  const commandStaffNodes = showCommandStaff
    ? visibleCommandStaff
        .map((position) =>
          orgChartLayout.commandStaffBranch.children.find(
            (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
              child.kind === 'position' && child.position === position
          )
        )
        .filter((node): node is Extract<OrgChartNode, { kind: 'position' }> => node !== undefined)
    : []
  const icDirectReportNodes = buildIcDirectReportNodes(commandStaffNodes, visibleRootChildren)
  const hasIcDirectReports = icDirectReportNodes.length > 0

  if (!hasIcDirectReports && !hasSections) {
    return null
  }

  const spineAboveSections = connectFromParent || hasIcDirectReports

  return (
    <>
      {connectFromParent ? <OrgChartCenterSpine /> : null}
      {hasIcDirectReports ? (
        <OrgChartCrossbarColumns
          columnClassName={rosterOrgCommandStaffCrossbarClassName(layoutMode)}
          columns={[
            ...visibleCommandStaff.map((position) => (
              <CommandStaffPositionNode
                key={position}
                commandStaffBranch={orgChartLayout.commandStaffBranch}
                position={position}
                renderProps={renderProps}
              />
            )),
            ...visibleRootChildren.map((child, index) => (
              <OrgChartLayoutNode
                key={orgChartNodeKey(child, index)}
                node={child}
                renderProps={renderProps}
              />
            )),
          ]}
          showInboundStem={false}
        />
      ) : null}
      {hasSections ? (
        <SectionBranchesCrossbar
          visibleSectionBranches={visibleSectionBranches}
          layoutMode={layoutMode}
          renderProps={renderProps}
          showInboundStem={spineAboveSections}
        />
      ) : null}
    </>
  )
}

function IncidentCommanderSubtree({
  orgChartLayout,
  renderProps,
  visibleSectionBranches,
  showCommandStaff,
  visibleCommandStaff,
}: {
  orgChartLayout: WorkspaceOrgChartLayout
  renderProps: OrgChartRenderProps
  visibleSectionBranches: Extract<OrgChartNode, { kind: 'group' }>[]
  showCommandStaff: boolean
  visibleCommandStaff: string[]
}) {
  const { layoutMode } = renderProps
  const icVisible =
    renderProps.displayFilters.showIncidentCommander &&
    positionNodeIsVisible(
      orgChartLayout.rootPosition,
      orgChartLayout.rootChildren,
      renderProps.visiblePositions,
      renderProps.displayFilters,
      renderProps.isProjected
    )

  if (!icVisible) {
    return (
      <IncidentCommanderSpine
        orgChartLayout={orgChartLayout}
        renderProps={renderProps}
        visibleSectionBranches={visibleSectionBranches}
        showCommandStaff={showCommandStaff}
        visibleCommandStaff={visibleCommandStaff}
        connectFromParent={false}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col items-center',
        layoutMode === 'wide' && 'max-w-full'
      )}
    >
      <PositionNode
        position={orgChartLayout.rootPosition}
        children={orgChartLayout.rootChildren}
        suppressChildren
        {...renderProps}
      />
      <IncidentCommanderSpine
        orgChartLayout={orgChartLayout}
        renderProps={renderProps}
        visibleSectionBranches={visibleSectionBranches}
        showCommandStaff={showCommandStaff}
        visibleCommandStaff={visibleCommandStaff}
      />
    </div>
  )
}

export function WorkspaceOrgChartRoster({
  orgChartLayout,
  entriesByPosition,
  assetsByKey,
  rosterById,
  visiblePositions,
  displayFilters,
  assignableByPosition,
  scheduleAssignableByPosition,
  scheduleUnassignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  isUpdatingOpAdvanceLabel = null,
  workspaceLabel,
  layoutMode = 'wide',
  orgChartTemplateSlug = null,
  zoom = 1,
  showOpAdvanceLabels = false,
  positionMetaByName = {},
  onToggleEditIcs201,
  onAssignExistingMember,
  onSearchOrgMembers,
  onAssignOrgMember,
  workspaceRosterMembers = [],
  onScheduleAssignMember,
  onScheduleUnassignMember,
  onRemoveScheduledAssign,
  onRemoveScheduledUnassign,
  onInviteToPosition,
  onUnassignMember,
  inlinePositionInvite,
  onOpAdvanceLabelChange,
  onFocusAsset,
  onRemoveAssetFromOrgChart,
  onRemoveSingleResourceFromOrgChart,
  showCheckInStatus = false,
  canEditCheckInStatus = false,
  updatingCheckInMemberId = null,
  onCheckInStatusChange,
  competencyOptions = [],
  canEditCompetencyFunction = false,
  updatingCompetencyKey = null,
  onSingleResourceCompetencyFunctionChange,
  onMemberCompetencyFunctionChange,
  memberScheduleCompetencyByKey = {},
  onAssetCompetencyFunctionChange,
  showAllowWorkAssignment = false,
  onToggleAllowWorkAssignment,
  showPositionAssets = false,
  assignableAssetsByPosition = {},
  scheduleAssignableAssetsByPosition = {},
  scheduleUnassignableAssetsByPosition = {},
  pocMembers = [],
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
  onRemovePositionFromRoster,
  removingPositionFromRoster = null,
  canRemovePositionFromRoster,
  positionRemovalBlockedReason,
  onPositionTypeChange,
  positionCatalog,
  isUpdatingPositionIdentity = null,
  onSaveCustomPosition,
  onCreateResourceCategory,
  onDeleteResourceCategory,
  onScheduleResourceCategoryForNextOp,
  onFillResourceCategoryMember,
  onFillResourceCategoryAsset,
  onClearResourceCategoryFill,
  isSavingAssetOrgChartPlacement = false,
  onAssetOrgChartPlacementChange,
  isUpdatingSingleResourcePlacement = null,
  onSingleResourceOrgChartPlacementChange,
  exportMode = false,
  isProjected = false,
  rosterTimeHorizon = 'current_op',
  managementEntriesByPosition,
  haveLinkIndexByRef,
  activeHaveCell = null,
  highlightedHaveRef = null,
  haveLinkPickMode,
  ics215aLocationsByPosition = {},
  onFocusIcs215aRowOnMap,
  rosterSchedulingPhase = 'live_ops',
  draftMembersForOrgDedupe = [],
}: WorkspaceOrgChartRosterProps) {
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null)
  const [selectedSingleResourceMemberId, setSelectedSingleResourceMemberId] = useState<string | null>(
    null
  )
  const selectedAsset = selectedAssetKey ? assetsByKey[selectedAssetKey] : null
  const selectedSingleResourceMember = selectedSingleResourceMemberId
    ? rosterById[selectedSingleResourceMemberId]
    : null

  const visibleSectionBranches = orgChartLayout.sectionBranches.filter((branch) => {
    const sectionKey = orgChartBranchSectionKey(branch)
    if (sectionKey && !orgChartSectionFilterEnabled(sectionKey, displayFilters)) {
      return false
    }
    return branch.children.some(
      (child) =>
        child.kind === 'position' &&
        positionBranchIsVisible(child, visiblePositions, displayFilters, isProjected)
    )
  })
  const visibleCommandStaff = displayFilters.showCommandStaff
    ? getVisibleCommandStaffPositions(
        orgChartLayout.commandStaffBranch,
        visiblePositions,
        displayFilters,
        orgChartTemplateSlug,
        isProjected
      )
    : []
  const showCommandStaff = visibleCommandStaff.length > 0
  const renderIcPosition =
    showCommandStaff ||
    visibleSectionBranches.length > 0 ||
    (displayFilters.showIncidentCommander &&
      positionNodeIsVisible(
        orgChartLayout.rootPosition,
        orgChartLayout.rootChildren,
        visiblePositions,
        displayFilters,
        isProjected
      )) ||
    filterVisibleOrgChartChildren(
      orgChartLayout.rootChildren,
      visiblePositions,
      displayFilters,
      isProjected
    ).length > 0
  const showIcCard = renderIcPosition

  const renderProps: OrgChartRenderProps = {
    layoutMode,
    orgChartTemplateSlug,
    entriesByPosition,
    assetsByKey,
    rosterById,
    visiblePositions,
    displayFilters,
    isProjected,
    rosterTimeHorizon,
    managementEntriesByPosition,
    assignableByPosition,
    scheduleAssignableByPosition,
    scheduleUnassignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    isUpdatingOpAdvanceLabel,
    showOpAdvanceLabels,
    positionMetaByName,
    onToggleEditIcs201,
    onAssignExistingMember,
    onSearchOrgMembers,
    onAssignOrgMember,
    workspaceRosterMembers,
    onScheduleAssignMember,
    onScheduleUnassignMember,
    onRemoveScheduledAssign,
    onRemoveScheduledUnassign,
    onInviteToPosition,
    onUnassignMember,
    inlinePositionInvite,
    onOpAdvanceLabelChange,
    onFocusAsset,
    onRemoveAssetFromOrgChart,
    onRemoveSingleResourceFromOrgChart,
    showCheckInStatus,
    canEditCheckInStatus,
    updatingCheckInMemberId,
    onCheckInStatusChange,
    showAllowWorkAssignment,
    onToggleAllowWorkAssignment,
    showPositionAssets,
    assignableAssetsByPosition,
    scheduleAssignableAssetsByPosition,
    scheduleUnassignableAssetsByPosition,
    pocMembers,
    onAssignAsset,
    onUnassignAsset,
    onScheduleAssignAsset,
    onScheduleUnassignAsset,
    onRemoveScheduledAssignAsset,
    onRemoveScheduledUnassignAsset,
    onUpdateAssetPointOfContact,
    onRemovePositionFromRoster,
    removingPositionFromRoster,
    canRemovePositionFromRoster,
    positionRemovalBlockedReason,
    onPositionTypeChange,
    positionCatalog,
    isUpdatingPositionIdentity,
    onSaveCustomPosition,
    onCreateResourceCategory,
    onDeleteResourceCategory,
    onScheduleResourceCategoryForNextOp,
    onFillResourceCategoryMember,
    onFillResourceCategoryAsset,
    onClearResourceCategoryFill,
    exportMode,
    onOpenOrgChartAssetDetail: exportMode ? () => undefined : setSelectedAssetKey,
    onOpenSingleResourceDetail: exportMode ? () => undefined : setSelectedSingleResourceMemberId,
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
    onMemberCompetencyFunctionChange,
    memberScheduleCompetencyByKey,
    onAssetCompetencyFunctionChange,
    onSingleResourceCompetencyFunctionChange,
    haveLinkIndexByRef,
    activeHaveCell,
    highlightedHaveRef,
    haveLinkPickMode,
    ics215aLocationsByPosition,
    onFocusIcs215aRowOnMap,
    rosterSchedulingPhase,
    draftMembersForOrgDedupe,
  }

  const wideRenderProps: OrgChartWideRenderProps = {
    ...renderProps,
    renderLeafNode: (node, options) => (
      <OrgChartChildNode
        node={node}
        parentColor={options.parentColor}
        renderProps={renderProps}
        suppressChildren={options.suppressChildren}
        connectorAnchorId={options.connectorAnchorId}
      />
    ),
  }

  return (
    <div
      className={cn('min-w-0 w-full max-w-full', exportMode ? 'space-y-0 pt-0' : 'space-y-4 pt-px')}
    >
      {exportMode ? null : (
        <div className="space-y-1 text-center">
          <h3 className="text-sm font-semibold">{workspaceLabel} Roster</h3>
          <p className="text-xs text-muted-foreground">
            Organizational Chart — Incident Command Structure
          </p>
        </div>
      )}

      <div className={cn('min-w-0 w-full max-w-full', exportMode && 'pointer-events-none')}>
        <div
          className={cn(
            'inline-flex w-max min-w-full flex-col items-center px-4 pb-2',
            layoutMode === 'wide' &&
              !isHwcgSourceControlOrgChartTemplate(orgChartTemplateSlug) &&
              ORG_CHART_CANVAS_MIN_WIDTH
          )}
        >
          {showIcCard ? (
            <div
              className={cn(
                'w-full min-w-0 max-w-full',
                layoutMode === 'wide' && 'flex justify-center'
              )}
            >
              {layoutMode === 'wide' ? (
                <OrgChartWideLayout
                  orgChartLayout={orgChartLayout}
                  renderProps={wideRenderProps}
                  visibleSectionBranches={visibleSectionBranches}
                  showCommandStaff={showCommandStaff}
                  visibleCommandStaff={visibleCommandStaff}
                  zoom={zoom}
                  useExportConnectors={exportMode}
                />
              ) : (
                <IncidentCommanderSubtree
                  orgChartLayout={orgChartLayout}
                  renderProps={renderProps}
                  visibleSectionBranches={visibleSectionBranches}
                  showCommandStaff={showCommandStaff}
                  visibleCommandStaff={visibleCommandStaff}
                />
              )}
            </div>
          ) : visibleSectionBranches.length > 0 ? (
            layoutMode === 'wide' ? (
              <OrgChartWideLayout
                orgChartLayout={orgChartLayout}
                renderProps={wideRenderProps}
                visibleSectionBranches={visibleSectionBranches}
                showCommandStaff={false}
                visibleCommandStaff={[]}
                zoom={zoom}
                useExportConnectors={exportMode}
              />
            ) : (
              <div
                className={cn(
                  'grid w-max min-w-full gap-x-4 gap-y-6',
                  rosterOrgSectionColumnsClassName(layoutMode)
                )}
              >
                {visibleSectionBranches.map((branch) => (
                  <div
                    key={branch.label}
                    className={cn(
                      'flex flex-col items-center',
                      orgChartSectionColumnClassName(branch.label, orgChartTemplateSlug)
                    )}
                  >
                    <GroupBranch node={branch} renderProps={renderProps} />
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>

      {exportMode ? null : (
        <>
      <OrgChartNodeDetailDialog
        open={selectedAsset !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAssetKey(null)
        }}
        title={selectedAsset?.name ?? 'Org chart asset'}
        description={
          haveLinkPickMode
            ? `Link items to Have — ${haveLinkPickMode.columnLabel}`
            : 'Org chart asset details'
        }
        contentClassName={ORG_CHART_ASSET_DETAIL_MODAL_CLASS}
      >
        {selectedAsset ? (
          <>
            {haveLinkPickMode ? (
              <HaveLinkSingleRefDetailPick
                pickMode={haveLinkPickMode}
                ref={resolveOrgChartAssetHaveRef(
                  selectedAsset.assetKey,
                  haveLinkPickMode.roster,
                  haveLinkPickMode.assetsByKey
                )}
                label={selectedAsset.name}
              />
            ) : null}
            <RosterAssetResourceListItem
            asset={{
              assetKey: selectedAsset.assetKey,
              name: selectedAsset.name,
              type: selectedAsset.type,
              pointOfContactMemberId: selectedAsset.pointOfContactMemberId,
              pointOfContactEmail: null,
              competencyFunction: selectedAsset.pendingOrgChartReportsTo
                ? (selectedAsset.pendingCompetencyFunction ?? null)
                : selectedAsset.competencyFunction,
            }}
            resource={selectedAsset}
            variant="orgChart"
            glassItemBorderClasses={glassItemBorderClasses}
            badgeLabel={
              selectedAsset.pendingOrgChartReportsTo ? 'Org chart · Next OP' : 'Org chart'
            }
            showPoc={Boolean(onUpdateAssetPointOfContact)}
            pocMembers={pocMembers}
            canManage={canManageRoster}
            canEditPoc={canManageRoster}
            isBusy={false}
            removeLabel={`Remove ${selectedAsset.name} from org chart`}
            onRemove={
              canManageRoster && onRemoveAssetFromOrgChart
                ? () => {
                    onRemoveAssetFromOrgChart(selectedAsset.assetKey)
                    setSelectedAssetKey(null)
                  }
                : undefined
            }
            onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
            competencyOptions={competencyOptions}
            canEditCompetencyFunction={canEditCompetencyFunction}
            isUpdatingCompetency={
              updatingCompetencyKey ===
              (selectedAsset.pendingOrgChartReportsTo
                ? `asset::${selectedAsset.assetKey}::org_chart::scheduled_org_chart`
                : `asset::${selectedAsset.assetKey}::org_chart`)
            }
            onUpdateAssetCompetencyFunction={
              onAssetCompetencyFunctionChange
                ? (value) =>
                    onAssetCompetencyFunctionChange({
                      assetKey: selectedAsset.assetKey,
                      positionName: 'org_chart',
                      scope: selectedAsset.pendingOrgChartReportsTo
                        ? 'scheduled_org_chart'
                        : 'org_chart',
                      value,
                    })
                : undefined
            }
            orgChartReportsTo={
              selectedAsset.pendingOrgChartReportsTo ?? selectedAsset.orgChartReportsTo
            }
            positionCatalog={positionCatalog}
            isSavingOrgChartPlacement={isSavingAssetOrgChartPlacement}
            onOrgChartPlacementChange={
              canManageRoster && onAssetOrgChartPlacementChange
                ? (reportsTo) => {
                    if (reportsTo) {
                      onAssetOrgChartPlacementChange(selectedAsset.assetKey, reportsTo)
                    }
                  }
                : undefined
            }
            haveLinkLocation={lookupHaveLinkLocation(
              haveLinkIndexByRef,
              resolveOrgChartAssetHaveRef(
                selectedAsset.assetKey,
                workspaceRosterMembers,
                assetsByKey
              )
            )}
            activeHaveCell={activeHaveCell}
            highlightedHaveRef={highlightedHaveRef}
            assetHaveRef={resolveOrgChartAssetHaveRef(
              selectedAsset.assetKey,
              workspaceRosterMembers,
              assetsByKey
            )}
          />
          </>
        ) : null}
      </OrgChartNodeDetailDialog>

      <OrgChartNodeDetailDialog
        open={selectedSingleResourceMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSingleResourceMemberId(null)
        }}
        title={selectedSingleResourceMember?.email ?? 'Single resource'}
        description={
          haveLinkPickMode
            ? `Link items to Have — ${haveLinkPickMode.columnLabel}`
            : 'Single resource assigned on the org chart'
        }
      >
        {selectedSingleResourceMember ? (
          <>
            {haveLinkPickMode ? (
              <HaveLinkSingleRefDetailPick
                pickMode={haveLinkPickMode}
                ref={resolveSingleResourceHaveRef(selectedSingleResourceMember)}
                label={selectedSingleResourceMember.email}
              />
            ) : null}
            <SingleResourceDetailPanel
            member={selectedSingleResourceMember}
            scheduled={Boolean(selectedSingleResourceMember.pendingOrgChartReportsTo)}
            canManage={canManageRoster}
            catalog={positionCatalog}
            isUpdatingPlacement={isUpdatingSingleResourcePlacement === selectedSingleResourceMember.id}
            onOrgChartPlacementChange={
              canManageRoster && onSingleResourceOrgChartPlacementChange && positionCatalog
                ? (reportsTo) =>
                    onSingleResourceOrgChartPlacementChange(
                      selectedSingleResourceMember.id,
                      reportsTo,
                      Boolean(selectedSingleResourceMember.pendingOrgChartReportsTo)
                    )
                : undefined
            }
            showCheckInStatus={showCheckInStatus}
            canEditCheckInStatus={canEditCheckInStatus}
            updatingCheckInMemberId={updatingCheckInMemberId}
            onCheckInStatusChange={onCheckInStatusChange}
            competencyOptions={competencyOptions}
            canEditCompetencyFunction={canEditCompetencyFunction}
            isUpdatingCompetency={
              updatingCompetencyKey === `member::${selectedSingleResourceMember.id}::single_resource`
            }
            onCompetencyFunctionChange={
              onSingleResourceCompetencyFunctionChange
                ? (value) =>
                    onSingleResourceCompetencyFunctionChange(
                      selectedSingleResourceMember.id,
                      value,
                      Boolean(selectedSingleResourceMember.pendingOrgChartReportsTo)
                    )
                : undefined
            }
            onRemoveFromOrgChart={
              canManageRoster && onRemoveSingleResourceFromOrgChart
                ? (memberId) => {
                    onRemoveSingleResourceFromOrgChart(memberId)
                    setSelectedSingleResourceMemberId(null)
                  }
                : undefined
            }
          />
          </>
        ) : null}
      </OrgChartNodeDetailDialog>
        </>
      )}
    </div>
  )
}
