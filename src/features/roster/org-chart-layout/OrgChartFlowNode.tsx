import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { PositionRosterCard } from '@/features/roster/PositionRosterCard'
import { AssetOrgChartCard } from '@/features/roster/AssetOrgChartCard'
import { SingleResourceOrgChartCard } from '@/features/roster/SingleResourceOrgChartCard'
import type { OrgChartCanvasNodeDef } from '@/features/roster/org-chart-layout/types'
import { useOrgChartNodeRenderContext } from '@/features/roster/org-chart-layout/OrgChartNodeRenderContext'

type OrgChartFlowNodeData = {
  def: OrgChartCanvasNodeDef
}

function OrgChartFlowNodeComponent({ data }: NodeProps) {
  const ctx = useOrgChartNodeRenderContext()
  const def = (data as OrgChartFlowNodeData).def

  if (def.kind === 'asset') {
    const asset = def.assetKey ? ctx.assetsByKey[def.assetKey] : undefined
    if (!asset) return null
    return (
      <div className="relative">
        <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
        <AssetOrgChartCard
          asset={asset}
          color={def.color}
          canManage={ctx.canManageRoster}
          onFocusMap={ctx.onFocusAsset}
          onRemoveFromOrgChart={ctx.onRemoveAssetFromOrgChart}
        />
        <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
      </div>
    )
  }

  if (def.kind === 'single_resource') {
    const member = def.memberId ? ctx.rosterById[def.memberId] : undefined
    if (!member) return null
    return (
      <div className="relative">
        <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
        <SingleResourceOrgChartCard
          member={member}
          color={def.color}
          canManage={ctx.canManageRoster}
          onRemoveFromOrgChart={ctx.onRemoveSingleResourceFromOrgChart}
        />
        <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
      </div>
    )
  }

  const position = def.position
  if (!position || !ctx.visiblePositions.has(position)) {
    return null
  }

  const entry = ctx.entriesByPosition[position]
  if (!entry) return null

  return (
    <div className="relative w-48 max-w-[12rem]">
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
      <PositionRosterCard
        entry={entry}
        assignable={ctx.assignableByPosition[position] ?? []}
        scheduleAssignable={ctx.scheduleAssignableByPosition[position] ?? []}
        scheduleUnassignable={ctx.scheduleUnassignableByPosition[position] ?? []}
        canManageRoster={ctx.canManageRoster}
        glassItemBorderClasses={ctx.glassItemBorderClasses}
        isPermissionBusy={ctx.isUpdatingPermission === position}
        isAssignBusy={ctx.isAssigningPosition === position}
        variant="org"
        color={def.color}
        layoutMode={ctx.layoutMode}
        showOpAdvanceLabels={ctx.showOpAdvanceLabels}
        positionMeta={ctx.positionMetaByName[position]}
        isUpdatingOpAdvanceLabel={ctx.isUpdatingOpAdvanceLabel === position}
        onOpAdvanceLabelChange={
          ctx.onOpAdvanceLabelChange
            ? (label) => ctx.onOpAdvanceLabelChange!(position, label)
            : undefined
        }
        onToggleEditIcs201={ctx.onToggleEditIcs201}
        onAssignExistingMember={ctx.onAssignExistingMember}
        onScheduleAssignMember={ctx.onScheduleAssignMember}
        onScheduleUnassignMember={ctx.onScheduleUnassignMember}
        onRemoveScheduledAssign={ctx.onRemoveScheduledAssign}
        onRemoveScheduledUnassign={ctx.onRemoveScheduledUnassign}
        onInviteToPosition={ctx.onInviteToPosition}
        onUnassignMember={ctx.onUnassignMember}
        inlinePositionInvite={ctx.inlinePositionInvite}
        showCheckInStatus={ctx.showCheckInStatus}
        canEditCheckInStatus={ctx.canEditCheckInStatus}
        updatingCheckInMemberId={ctx.updatingCheckInMemberId}
        onCheckInStatusChange={ctx.onCheckInStatusChange}
        showAllowWorkAssignment={ctx.showAllowWorkAssignment}
        onToggleAllowWorkAssignment={ctx.onToggleAllowWorkAssignment}
        showPositionAssets={ctx.showPositionAssets}
        assignableAssets={ctx.assignableAssetsByPosition[position] ?? []}
        scheduleAssignableAssets={ctx.scheduleAssignableAssetsByPosition[position] ?? []}
        scheduleUnassignableAssets={ctx.scheduleUnassignableAssetsByPosition[position] ?? []}
        pocMembers={ctx.pocMembers}
        onAssignAsset={ctx.onAssignAsset}
        onUnassignAsset={ctx.onUnassignAsset}
        onScheduleAssignAsset={ctx.onScheduleAssignAsset}
        onScheduleUnassignAsset={ctx.onScheduleUnassignAsset}
        onRemoveScheduledAssignAsset={ctx.onRemoveScheduledAssignAsset}
        onRemoveScheduledUnassignAsset={ctx.onRemoveScheduledUnassignAsset}
        onUpdateAssetPointOfContact={ctx.onUpdateAssetPointOfContact}
      />
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-border !bg-muted" />
    </div>
  )
}

export const OrgChartFlowNode = memo(OrgChartFlowNodeComponent)
