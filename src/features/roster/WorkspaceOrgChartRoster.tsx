import { cn } from '@/lib/utils'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import { PositionRosterCard } from '@/features/roster/PositionRosterCard'
import { AssetOrgChartCard } from '@/features/roster/AssetOrgChartCard'
import type { WorkspaceOrgChartLayout, WorkspacePositionMeta } from '@/features/roster/workspace-positions'

import {
  orgChartColorClasses,
  type OrgChartColor,
  type OrgChartNode,
} from '@/features/roster/ics-org-chart-structure'

import {
  rosterOrgBranchClassName,
  rosterOrgCommandStaffClassName,
  type RosterPanelLayoutMode,
} from '@/features/roster/roster-layout'

type WorkspaceOrgChartRosterProps = {
  orgChartLayout: WorkspaceOrgChartLayout
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
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
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveAssetFromOrgChart?: (assetKey: string) => void
}

type OrgChartRenderProps = {
  layoutMode: RosterPanelLayoutMode
  entriesByPosition: Record<string, PositionRosterEntry>
  assetsByKey: Record<string, ResourceListItemData>
  visiblePositions: Set<string>
  assignableByPosition: Record<string, WorkspaceRosterMember[]>
  canManageRoster: boolean
  glassItemBorderClasses: string
  isUpdatingPermission: string | null
  isAssigningPosition: string | null
  isUpdatingOpAdvanceLabel: string | null
  showOpAdvanceLabels: boolean
  positionMetaByName: Record<string, WorkspacePositionMeta>
  onToggleEditIcs201: (position: string, enabled: boolean) => void
  onAssignExistingMember: (memberId: string, position: string) => void
  onInviteToPosition: (position: string) => void
  onUnassignMember: (memberId: string, position: string) => void
  onOpAdvanceLabelChange?: (position: string, label: PositionOpAdvanceLabel) => void
  onFocusAsset?: (asset: ResourceListItemData) => void
  onRemoveAssetFromOrgChart?: (assetKey: string) => void
}

function filterVisibleOrgChartChildren(
  children: OrgChartNode[],
  visiblePositions: Set<string>
): OrgChartNode[] {
  return children.filter((child) => {
    if (child.kind === 'asset') return true
    if (child.kind === 'position') {
      return (
        visiblePositions.has(child.position) ||
        filterVisibleOrgChartChildren(child.children ?? [], visiblePositions).length > 0
      )
    }
    return false
  })
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

  return (
    <>
      <div className="h-4 w-px bg-border" />
      <div className="flex w-full flex-col items-center gap-2">
        {visibleChildren.map((child, index) => (
          <div
            key={
              child.kind === 'asset'
                ? child.assetKey
                : child.kind === 'position'
                  ? child.position
                  : child.label
            }
            className="flex w-full flex-col items-center"
          >
            {index > 0 && <div className="h-3 w-px bg-border" />}
            <OrgChartChildNode node={child} parentColor={parentColor} renderProps={renderProps} />
          </div>
        ))}
      </div>
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
    return (
      <AssetOrgChartCard
        asset={asset}
        color={node.color ?? parentColor}
        canManage={renderProps.canManageRoster}
        onFocusMap={renderProps.onFocusAsset}
        onRemoveFromOrgChart={renderProps.onRemoveAssetFromOrgChart}
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
  visiblePositions,
  assignableByPosition,
  canManageRoster,
  glassItemBorderClasses,
  isUpdatingPermission,
  isAssigningPosition,
  isUpdatingOpAdvanceLabel,
  showOpAdvanceLabels,
  positionMetaByName,
  onToggleEditIcs201,
  onAssignExistingMember,
  onInviteToPosition,
  onUnassignMember,
  onOpAdvanceLabelChange,
  onFocusAsset,
  onRemoveAssetFromOrgChart,
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
    visiblePositions,
    assignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    isUpdatingOpAdvanceLabel,
    showOpAdvanceLabels,
    positionMetaByName,
    onToggleEditIcs201,
    onAssignExistingMember,
    onInviteToPosition,
    onUnassignMember,
    onOpAdvanceLabelChange,
    onFocusAsset,
    onRemoveAssetFromOrgChart,
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <PositionRosterCard
        entry={entry}
        assignable={assignableByPosition[position] ?? []}
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
        onInviteToPosition={onInviteToPosition}
        onUnassignMember={onUnassignMember}
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
  const visibleChildren = node.children.filter(
    (child) => child.kind === 'position' && positionBranchIsVisible(child, renderProps.visiblePositions)
  )
  if (visibleChildren.length === 0) return null

  const leaderChild = node.children.find((child) => child.kind === 'position')
  const leaderEntry =
    leaderChild?.kind === 'position' ? renderProps.entriesByPosition[leaderChild.position] : undefined
  const leaderEmail = leaderEntry?.members[0]?.email

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          'w-full rounded-md border px-2.5 py-2 text-center shadow-sm',
          orgChartColorClasses(node.color)
        )}
      >
        <p className="text-xs font-semibold leading-snug">{node.label}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          Work team
        </p>
        {leaderEmail && (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">Leader: {leaderEmail}</p>
        )}
        <p className="mt-0.5 text-[10px] text-muted-foreground">Type: {node.type}</p>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex w-full flex-col items-center gap-2">
        {visibleChildren.map((child, index) => {
          if (child.kind !== 'position') return null
          return (
            <div key={child.position} className="flex w-full flex-col items-center">
              {index > 0 && <div className="h-3 w-px bg-border" />}
              <PositionNode
                position={child.position}
                color={child.color ?? node.color}
                children={child.children ?? []}
                {...renderProps}
              />
            </div>
          )
        })}
      </div>
    </div>
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
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          'rounded-md border px-3 py-1.5 text-center shadow-sm',
          orgChartColorClasses(node.color)
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide">{node.label}</p>
      </div>
      <div className="h-4 w-px bg-border" />
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
    </div>
  )
}

export function WorkspaceOrgChartRoster({
  orgChartLayout,
  entriesByPosition,
  assetsByKey,
  visiblePositions,
  assignableByPosition,
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
  onInviteToPosition,
  onUnassignMember,
  onOpAdvanceLabelChange,
  onFocusAsset,
  onRemoveAssetFromOrgChart,
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
  const showBelowRoot = showCommandStaff || visibleSectionBranches.length > 0

  const renderProps: OrgChartRenderProps = {
    layoutMode,
    entriesByPosition,
    assetsByKey,
    visiblePositions,
    assignableByPosition,
    canManageRoster,
    glassItemBorderClasses,
    isUpdatingPermission,
    isAssigningPosition,
    isUpdatingOpAdvanceLabel,
    showOpAdvanceLabels,
    positionMetaByName,
    onToggleEditIcs201,
    onAssignExistingMember,
    onInviteToPosition,
    onUnassignMember,
    onOpAdvanceLabelChange,
    onFocusAsset,
    onRemoveAssetFromOrgChart,
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

          {showRoot && showBelowRoot && <div className="h-5 w-px bg-border" />}

          {showCommandStaff && <CommandStaffRow node={orgChartLayout.commandStaffBranch} renderProps={renderProps} />}

          {showCommandStaff && visibleSectionBranches.length > 0 && (
            <div className="h-5 w-px bg-border" />
          )}

          {visibleSectionBranches.length > 0 && (
            <div className={rosterOrgBranchClassName(layoutMode)}>
              {visibleSectionBranches.map((branch) => (
                <div key={branch.label} className="flex min-w-0 w-full flex-col items-center">
                  {(showRoot || showCommandStaff) && <div className="h-4 w-px bg-border" />}
                  <GroupBranch node={branch} renderProps={renderProps} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
