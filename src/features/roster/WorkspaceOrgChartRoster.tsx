import { cn } from '@/lib/utils'
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
import { RosterAssetResourceListItem } from '@/features/roster/RosterAssetResourceListItem'
import { SingleResourceOrgChartCard } from '@/features/roster/SingleResourceOrgChartCard'
import type { WorkspaceOrgChartLayout, WorkspacePositionMeta } from '@/features/roster/workspace-positions'

import {
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'

import {
  OrgChartCrossbarColumns,
  OrgChartFork,
  OrgChartLeftRailStack,
  OrgChartVerticalLine,
} from '@/features/roster/OrgChartConnectors'

import {
  rosterOrgCommandStaffClassName,
  rosterOrgSectionColumnsClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'

type WorkspaceOrgChartRosterProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
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
  showPositionAssets?: boolean
  assignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleAssignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  scheduleUnassignableAssetsByPosition?: Record<string, ResourceListItemData[]>
  pocMembers?: WorkspaceRosterMember[]
} & Partial<PositionRosterAssetHandlers>

type OrgChartRenderProps = {
  layoutMode: RosterPanelLayoutMode
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  rosterById: Record<string, WorkspaceRosterMember>
  visiblePositions: Set<string>
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
}

function filterVisibleOrgChartChildren(
  children: OrgChartNode[],
  visiblePositions: Set<string>
): OrgChartNode[] {
  return children.filter((child) => {
    if (child.kind === 'asset' || child.kind === 'single_resource') return true
    if (child.kind === 'stack' || child.kind === 'fork') {
      return filterVisibleOrgChartChildren(child.children, visiblePositions).length > 0
    }
    if (child.kind === 'position') {
      return (
        visiblePositions.has(child.position) ||
        filterVisibleOrgChartChildren(child.children ?? [], visiblePositions).length > 0
      )
    }
    return false
  })
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
    const visibleChildren = filterVisibleOrgChartChildren(node.children, renderProps.visiblePositions)
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartLeftRailStack>
        {visibleChildren.map((child, index) => (
          <OrgChartLayoutNode
            key={orgChartNodeKey(child, index)}
            node={child}
            parentColor={node.color ?? parentColor}
            renderProps={renderProps}
          />
        ))}
      </OrgChartLeftRailStack>
    )
  }

  if (node.kind === 'fork') {
    const visibleChildren = filterVisibleOrgChartChildren(node.children, renderProps.visiblePositions)
    if (visibleChildren.length === 0) return null
    return (
      <OrgChartFork>
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
  const visibleChildren = filterVisibleOrgChartChildren(children, renderProps.visiblePositions)
  if (visibleChildren.length === 0) return null

  if (visibleChildren.length === 1) {
    const only = visibleChildren[0]
    if (only.kind === 'stack' || only.kind === 'fork') {
      return (
        <OrgChartLayoutNode node={only} parentColor={parentColor} renderProps={renderProps} />
      )
    }
    return (
      <>
        <OrgChartVerticalLine />
        <OrgChartLayoutNode node={only} parentColor={parentColor} renderProps={renderProps} />
      </>
    )
  }

  return (
    <>
      {visibleChildren.map((child, index) => (
        <div
          key={orgChartNodeKey(child, index)}
          className="flex w-full min-w-0 flex-col items-center"
        >
          {index === 0 ? <OrgChartVerticalLine /> : null}
          <OrgChartLayoutNode node={child} parentColor={parentColor} renderProps={renderProps} />
        </div>
      ))}
    </>
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

    const assetEntry = {
      assetKey: asset.assetKey,
      name: asset.name,
      type: asset.type,
      pointOfContactMemberId: asset.pointOfContactMemberId ?? null,
      pointOfContactEmail: null,
    }
    const scheduled = node.scheduled ?? false

    return (
      <RosterAssetResourceListItem
        asset={assetEntry}
        resource={asset}
        glassItemBorderClasses={renderProps.glassItemBorderClasses}
        badgeLabel={scheduled ? 'Org chart · Next OP' : 'Org chart'}
        showPoc={false}
        canManage={renderProps.canManageRoster}
        isBusy={false}
        removeLabel={
          scheduled
            ? `Remove ${asset.name} from next OP org chart schedule`
            : `Remove ${asset.name} from org chart`
        }
        onRemove={
          renderProps.canManageRoster && renderProps.onRemoveAssetFromOrgChart
            ? () => renderProps.onRemoveAssetFromOrgChart!(asset.assetKey)
            : undefined
        }
        onFocusMap={
          renderProps.onFocusAsset ? () => renderProps.onFocusAsset!(asset) : undefined
        }
      />
    )
  }

  if (node.kind === 'single_resource') {
    const member = renderProps.rosterById[node.memberId]
    if (!member) return null
    return (
      <SingleResourceOrgChartCard
        member={member}
        color={node.color ?? parentColor}
        scheduled={node.scheduled}
        canManage={renderProps.canManageRoster}
        onRemoveFromOrgChart={renderProps.onRemoveSingleResourceFromOrgChart}
      />
    )
  }

  if (node.kind !== 'position' || !renderProps.visiblePositions.has(node.position)) {
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
  layoutMode,
  entriesByPosition,
  assetsByKey,
  rosterById,
  visiblePositions,
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
}: {
  position: string
  color?: OrgChartColor
  children?: OrgChartNode[]
} & OrgChartRenderProps) {
  if (!visiblePositions.has(position)) return null
  const entry = entriesByPosition[position]
  if (!entry) return null

  const renderProps: OrgChartRenderProps = {
    layoutMode,
    entriesByPosition,
    assetsByKey,
    rosterById,
    visiblePositions,
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
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
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
        showAllowWorkAssignment={showAllowWorkAssignment}
        onToggleAllowWorkAssignment={onToggleAllowWorkAssignment}
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
      />
      <OrgChartChildren children={children} parentColor={color} renderProps={renderProps} />
    </div>
  )
}

function positionBranchIsVisible(
  node: Extract<OrgChartNode, { kind: 'position' }>,
  visiblePositions: Set<string>
): boolean {
  return (
    visiblePositions.has(node.position) ||
    filterVisibleOrgChartChildren(node.children ?? [], visiblePositions).length > 0
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
      child.kind === 'position' && positionBranchIsVisible(child, renderProps.visiblePositions)
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

function CommandStaffRow({
  node,
  renderProps,
}: {
  node: Extract<OrgChartNode, { kind: 'group' }>
  renderProps: OrgChartRenderProps
}) {
  const visibleChildren = node.children.filter(
    (child) => child.kind === 'position' && positionBranchIsVisible(child, renderProps.visiblePositions)
  )
  if (visibleChildren.length === 0) return null

  return (
    <div className={rosterOrgCommandStaffClassName(renderProps.layoutMode)}>
      {visibleChildren.map((child) => {
        if (child.kind !== 'position') return null
        return (
          <PositionNode
            key={child.position}
            position={child.position}
            color={child.color ?? node.color}
            children={child.children ?? []}
            {...renderProps}
          />
        )
      })}
    </div>
  )
}

export function WorkspaceOrgChartRoster({
  orgChartLayout,
  entriesByPosition,
  assetsByKey,
  rosterById,
  visiblePositions,
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
}: WorkspaceOrgChartRosterProps) {
  const visibleSectionBranches = orgChartLayout.sectionBranches.filter((branch) =>
    branch.children.some(
      (child) => child.kind === 'position' && positionBranchIsVisible(child, visiblePositions)
    )
  )
  const showCommandStaff = orgChartLayout.commandStaffBranch.children.some(
    (child) => child.kind === 'position' && positionBranchIsVisible(child, visiblePositions)
  )
  const showRoot =
    visiblePositions.has(orgChartLayout.rootPosition) ||
    filterVisibleOrgChartChildren(orgChartLayout.rootChildren, visiblePositions).length > 0

  const renderProps: OrgChartRenderProps = {
    layoutMode,
    entriesByPosition,
    assetsByKey,
    rosterById,
    visiblePositions,
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
        <div className="mx-auto flex w-full min-w-0 max-w-full flex-col items-center px-0">
          {showRoot && (
            <div
              className={cn(
                'w-full min-w-0 max-w-full',
                layoutMode === 'wide' && 'flex justify-center'
              )}
            >
              {visiblePositions.has(orgChartLayout.rootPosition) ? (
                <PositionNode
                  position={orgChartLayout.rootPosition}
                  children={orgChartLayout.rootChildren}
                  {...renderProps}
                />
              ) : (
                <OrgChartChildren
                  children={orgChartLayout.rootChildren}
                  renderProps={renderProps}
                />
              )}
            </div>
          )}

          {showRoot && showCommandStaff && <OrgChartVerticalLine heightClassName="h-5" />}

          {showCommandStaff && (
            <CommandStaffRow node={orgChartLayout.commandStaffBranch} renderProps={renderProps} />
          )}

          {visibleSectionBranches.length > 0 && (
            <>
              {(showRoot || showCommandStaff) && <OrgChartVerticalLine heightClassName="h-5" />}
              {layoutMode === 'wide' ? (
                <OrgChartCrossbarColumns
                  columnClassName={rosterOrgSectionColumnsClassName(layoutMode)}
                  columns={visibleSectionBranches.map((branch) => (
                    <GroupBranch key={branch.label} node={branch} renderProps={renderProps} />
                  ))}
                />
              ) : (
                <div
                  className={cn(
                    'grid w-full min-w-0 gap-6',
                    rosterOrgSectionColumnsClassName(layoutMode)
                  )}
                >
                  {visibleSectionBranches.map((branch) => (
                    <GroupBranch key={branch.label} node={branch} renderProps={renderProps} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
