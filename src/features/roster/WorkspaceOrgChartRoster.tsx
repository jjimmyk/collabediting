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
import type { PositionRosterUnifiedAssignmentSectionsProps } from '@/features/roster/PositionRosterAssignmentSections'
import { OrgChartCollapsibleAssetCard } from '@/features/roster/OrgChartCollapsibleAssetCard'
import { OrgChartNodeDetailDialog } from '@/features/roster/OrgChartNodeDetailDialog'
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import { SingleResourceDetailPanel } from '@/features/roster/SingleResourceDetailPanel'
import {
  OrgChartCrossbarColumns,
  OrgChartFork,
  OrgChartInboundStem,
  OrgChartVerticalLine,
  OrgChartVerticalStack,
} from '@/features/roster/OrgChartConnectors'
import {
  ORG_CHART_CANVAS_MIN_WIDTH,
  ORG_CHART_POSITION_CARD_MAX_WIDTH,
  ORG_CHART_POSITION_CARD_WIDTH,
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
import type { WorkspaceOrgChartLayout, WorkspacePositionMeta } from '@/features/roster/workspace-positions'

import {
  rosterOrgCommandStaffCrossbarClassName,
  rosterOrgSectionColumnsClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'
import {
  ICS_ORG_CHART_COMMAND_STAFF_POSITIONS,
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
  showOpAdvanceLabels?: boolean
  positionMetaByName?: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  showAllowWorkAssignment?: boolean
  onToggleAllowWorkAssignment?: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onAssignOrgMember?: (userId: string, position: string) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
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
} & Partial<PositionRosterAssetHandlers>

type OrgChartRenderProps = {
  layoutMode: RosterPanelLayoutMode
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
  onAssignOrgMember?: (userId: string, position: string) => void
  workspaceRosterMembers?: WorkspaceRosterMember[]
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
}

function filterVisibleOrgChartChildren(
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters
): OrgChartNode[] {
  return children.filter((child) => {
    if (child.kind === 'asset') return true
    if (child.kind === 'single_resource') {
      return singleResourceNodeVisible(child.scheduled, displayFilters)
    }
    if (child.kind === 'stack' || child.kind === 'fork') {
      return (
        filterVisibleOrgChartChildren(child.children, visiblePositions, displayFilters).length > 0
      )
    }
    if (child.kind === 'position') {
      return (
        visiblePositions.has(child.position) ||
        filterVisibleOrgChartChildren(child.children ?? [], visiblePositions, displayFilters)
          .length > 0
      )
    }
    return false
  })
}

function positionNodeIsVisible(
  position: string,
  children: OrgChartNode[],
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters
): boolean {
  if (visiblePositions.has(position)) return true
  return filterVisibleOrgChartChildren(children, visiblePositions, displayFilters).length > 0
}

function orgChartNodeKey(node: OrgChartNode, index: number): string {
  if (node.kind === 'asset') return node.assetKey
  if (node.kind === 'single_resource') return node.memberId
  if (node.kind === 'position') return node.position
  if (node.kind === 'stack') return `stack-${index}`
  if (node.kind === 'fork') return `fork-${index}`
  return node.label
}

function OrgChartLayoutNode({
  node,
  parentColor,
  renderProps,
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
}) {
  if (node.kind === 'stack') {
    const visibleChildren = filterVisibleOrgChartChildren(
      node.children,
      renderProps.visiblePositions,
      renderProps.displayFilters
    )
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartVerticalStack>
        {visibleChildren.map((child, index) => (
          <OrgChartLayoutNode
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartVerticalStack>
    )
  }

  if (node.kind === 'fork') {
    const visibleChildren = filterVisibleOrgChartChildren(
      node.children,
      renderProps.visiblePositions,
      renderProps.displayFilters
    )
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartFork layout={renderProps.layoutMode === 'wide' ? 'horizontal' : 'vertical'}>
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
}: {
  children: OrgChartNode[]
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
}) {
  const visibleChildren = filterVisibleOrgChartChildren(
    children,
    renderProps.visiblePositions,
    renderProps.displayFilters
  )
  if (visibleChildren.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      {visibleChildren.map((child, index) => {
        if (child.kind === 'stack' || child.kind === 'fork') {
          return (
            <OrgChartLayoutNode
              key={orgChartNodeKey(child, index)}
              node={child}
              parentColor={parentColor}
              renderProps={renderProps}
            />
          )
        }

        return (
          <OrgChartInboundStem key={orgChartNodeKey(child, index)} heightClassName="h-5">
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
}: {
  node: OrgChartNode
  parentColor?: OrgChartColor
  renderProps: OrgChartRenderProps
}) {
  if (node.kind === 'asset') {
    const asset = renderProps.assetsByKey[node.assetKey]
    if (!asset) return null

    const scheduled = node.scheduled ?? false

    return (
      <div className="flex w-full justify-center">
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
          onFocusMap={
            renderProps.onFocusAsset ? () => renderProps.onFocusAsset!(asset) : undefined
          }
          onUpdateAssetPointOfContact={renderProps.onUpdateAssetPointOfContact}
        />
      </div>
    )
  }

  if (node.kind === 'single_resource') {
    if (!singleResourceNodeVisible(node.scheduled, renderProps.displayFilters)) {
      return null
    }
    const member = renderProps.rosterById[node.memberId]
    if (!member) return null
    return (
      <div className={cn('flex w-full justify-center', ORG_CHART_POSITION_CARD_WIDTH)}>
        <SingleResourceOrgChartCard
          member={member}
          color={node.color ?? parentColor}
          scheduled={node.scheduled}
          canManage={renderProps.canManageRoster}
          onOpenDetail={() => renderProps.onOpenSingleResourceDetail(member.id)}
          onRemoveFromOrgChart={renderProps.onRemoveSingleResourceFromOrgChart}
        />
      </div>
    )
  }

  if (
    node.kind !== 'position' ||
    !positionNodeIsVisible(
      node.position,
      node.children ?? [],
      renderProps.visiblePositions,
      renderProps.displayFilters
    )
  ) {
    return null
  }

  return (
    <PositionNode
      position={node.position}
      color={node.color ?? parentColor}
      children={node.children ?? []}
      {...renderProps}
    />
  )
}

function PositionNode({
  position,
  color,
  children = [],
  suppressChildren = false,
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
  onOpenOrgChartAssetDetail,
  onOpenSingleResourceDetail,
  competencyOptions,
  canEditCompetencyFunction,
  updatingCompetencyKey,
  onMemberCompetencyFunctionChange,
  memberScheduleCompetencyByKey,
  onAssetCompetencyFunctionChange,
  onSingleResourceCompetencyFunctionChange,
}: {
  position: string
  color?: OrgChartColor
  children?: OrgChartNode[]
  suppressChildren?: boolean
} & OrgChartRenderProps) {
  if (
    !positionNodeIsVisible(position, children, visiblePositions, displayFilters)
  ) {
    return null
  }
  const entry = entriesByPosition[position]
  if (!entry) return null

  const renderProps: OrgChartRenderProps = {
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
    onOpenOrgChartAssetDetail,
    onOpenSingleResourceDetail,
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
    onMemberCompetencyFunctionChange,
    memberScheduleCompetencyByKey,
    onAssetCompetencyFunctionChange,
    onSingleResourceCompetencyFunctionChange,
  }

  const canRemove =
    canRemovePositionFromRoster?.(entry) ?? false
  const removalBlockedReason = positionRemovalBlockedReason?.(entry) ?? null

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col items-center',
        layoutMode === 'wide' && ORG_CHART_POSITION_CARD_MAX_WIDTH
      )}
    >
      <PositionRosterCard
        entry={entry}
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
      />
      {!suppressChildren ? (
        <OrgChartChildren children={children} parentColor={color} renderProps={renderProps} />
      ) : null}
    </div>
  )
}

function positionBranchIsVisible(
  node: Extract<OrgChartNode, { kind: 'position' }>,
  visiblePositions: Set<string>,
  displayFilters: RosterDisplayFilters
): boolean {
  return positionNodeIsVisible(
    node.position,
    node.children ?? [],
    visiblePositions,
    displayFilters
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
      positionBranchIsVisible(child, renderProps.visiblePositions, renderProps.displayFilters)
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
  displayFilters: RosterDisplayFilters
): string[] {
  return ICS_ORG_CHART_COMMAND_STAFF_POSITIONS.filter((position) => {
    const node = getCommandStaffPositionNode(commandStaffBranch, position)
    if (!node) return false
    return positionBranchIsVisible(node, visiblePositions, displayFilters)
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
      color="neutral"
      children={node.children ?? []}
      {...renderProps}
    />
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
      renderProps.displayFilters
    )

  if (!icVisible) {
    return (
      <>
        {visibleCommandStaff.length > 0 ? (
          <OrgChartCrossbarColumns
            columnClassName={rosterOrgCommandStaffCrossbarClassName(layoutMode)}
            columns={visibleCommandStaff.map((position) => (
              <CommandStaffPositionNode
                key={position}
                commandStaffBranch={orgChartLayout.commandStaffBranch}
                position={position}
                renderProps={renderProps}
              />
            ))}
            showInboundStem
          />
        ) : null}
        <OrgChartChildren
          children={orgChartLayout.rootChildren}
          renderProps={renderProps}
        />
        {visibleSectionBranches.length > 0 ? (
          layoutMode === 'wide' ? (
            <OrgChartCrossbarColumns
              columnClassName={rosterOrgSectionColumnsClassName(layoutMode)}
              columns={visibleSectionBranches.map((branch) => (
                <div
                  key={branch.label}
                  className={cn(
                    'flex flex-col items-center',
                    orgChartSectionColumnClassName(branch.label)
                  )}
                >
                  <GroupBranch node={branch} renderProps={renderProps} />
                </div>
              ))}
              showInboundStem={
                visibleCommandStaff.length > 0 || orgChartLayout.rootChildren.length > 0
              }
            />
          ) : (
            <>
              {(visibleCommandStaff.length > 0 || orgChartLayout.rootChildren.length > 0) && (
                <OrgChartVerticalLine heightClassName="h-5" />
              )}
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
                      orgChartSectionColumnClassName(branch.label)
                    )}
                  >
                    <GroupBranch node={branch} renderProps={renderProps} />
                  </div>
                ))}
              </div>
            </>
          )
        ) : null}
      </>
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

      {showCommandStaff && visibleCommandStaff.length > 0 ? (
        <OrgChartCrossbarColumns
          columnClassName={rosterOrgCommandStaffCrossbarClassName(layoutMode)}
          columns={visibleCommandStaff.map((position) => (
            <CommandStaffPositionNode
              key={position}
              commandStaffBranch={orgChartLayout.commandStaffBranch}
              position={position}
              renderProps={renderProps}
            />
          ))}
          showInboundStem
        />
      ) : null}

      <OrgChartChildren children={orgChartLayout.rootChildren} renderProps={renderProps} />

      {visibleSectionBranches.length > 0 &&
        (layoutMode === 'wide' ? (
          <OrgChartCrossbarColumns
            columnClassName={rosterOrgSectionColumnsClassName(layoutMode)}
            columns={visibleSectionBranches.map((branch) => (
              <div
                key={branch.label}
                className={cn(
                  'flex flex-col items-center',
                  orgChartSectionColumnClassName(branch.label)
                )}
              >
                <GroupBranch node={branch} renderProps={renderProps} />
              </div>
            ))}
            showInboundStem
          />
        ) : (
          <>
            <OrgChartVerticalLine heightClassName="h-5" />
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
                    orgChartSectionColumnClassName(branch.label)
                  )}
                >
                  <GroupBranch node={branch} renderProps={renderProps} />
                </div>
              ))}
            </div>
          </>
        ))}
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
        positionBranchIsVisible(child, visiblePositions, displayFilters)
    )
  })
  const visibleCommandStaff = displayFilters.showCommandStaff
    ? getVisibleCommandStaffPositions(
        orgChartLayout.commandStaffBranch,
        visiblePositions,
        displayFilters
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
        displayFilters
      )) ||
    filterVisibleOrgChartChildren(
      orgChartLayout.rootChildren,
      visiblePositions,
      displayFilters
    ).length > 0
  const showIcCard = renderIcPosition

  const renderProps: OrgChartRenderProps = {
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
    onOpenOrgChartAssetDetail: setSelectedAssetKey,
    onOpenSingleResourceDetail: setSelectedSingleResourceMemberId,
    competencyOptions,
    canEditCompetencyFunction,
    updatingCompetencyKey,
    onMemberCompetencyFunctionChange,
    memberScheduleCompetencyByKey,
    onAssetCompetencyFunctionChange,
    onSingleResourceCompetencyFunctionChange,
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-4 pt-px">
      <div className="space-y-1 text-center">
        <h3 className="text-sm font-semibold">{workspaceLabel} Roster</h3>
        <p className="text-xs text-muted-foreground">
          Organizational Chart — Incident Command Structure
        </p>
      </div>

      <div className="min-w-0 w-full max-w-full">
        <div
          className={cn(
            'inline-flex w-max min-w-full flex-col items-center px-4 pb-2',
            layoutMode === 'wide' && ORG_CHART_CANVAS_MIN_WIDTH
          )}
        >
          {showIcCard ? (
            <div
              className={cn(
                'w-full min-w-0 max-w-full',
                layoutMode === 'wide' && 'flex justify-center'
              )}
            >
              <IncidentCommanderSubtree
                orgChartLayout={orgChartLayout}
                renderProps={renderProps}
                visibleSectionBranches={visibleSectionBranches}
                showCommandStaff={showCommandStaff}
                visibleCommandStaff={visibleCommandStaff}
              />
            </div>
          ) : visibleSectionBranches.length > 0 ? (
            layoutMode === 'wide' ? (
              <OrgChartCrossbarColumns
                columnClassName={rosterOrgSectionColumnsClassName(layoutMode)}
                columns={visibleSectionBranches.map((branch) => (
                  <div
                    key={branch.label}
                    className={cn(
                      'flex flex-col items-center',
                      orgChartSectionColumnClassName(branch.label)
                    )}
                  >
                    <GroupBranch node={branch} renderProps={renderProps} />
                  </div>
                ))}
                showInboundStem={false}
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
                      orgChartSectionColumnClassName(branch.label)
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

      <OrgChartNodeDetailDialog
        open={selectedAsset !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAssetKey(null)
        }}
        title={selectedAsset?.name ?? 'Org chart asset'}
        description="Org chart asset details"
      >
        {selectedAsset ? (
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
            onFocusMap={onFocusAsset ? () => onFocusAsset(selectedAsset) : undefined}
          />
        ) : null}
      </OrgChartNodeDetailDialog>

      <OrgChartNodeDetailDialog
        open={selectedSingleResourceMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSingleResourceMemberId(null)
        }}
        title={selectedSingleResourceMember?.email ?? 'Single resource'}
        description="Single resource assigned on the org chart"
      >
        {selectedSingleResourceMember ? (
          <SingleResourceDetailPanel
            member={selectedSingleResourceMember}
            scheduled={Boolean(selectedSingleResourceMember.pendingOrgChartReportsTo)}
            canManage={canManageRoster}
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
        ) : null}
      </OrgChartNodeDetailDialog>
    </div>
  )
}
