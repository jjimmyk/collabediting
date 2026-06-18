import { useState } from 'react'
import { CalendarClock, Package, Trash2, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { PositionAssetRosterEntry } from '@/lib/workspace-position-asset-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type PositionRosterAssetHandlers = {
  onAssignAsset: (assetKey: string, position: string, pointOfContactMemberId?: string) => void
  onUnassignAsset: (assetKey: string, position: string) => void
  onScheduleAssignAsset: (assetKey: string, position: string) => void
  onScheduleUnassignAsset: (assetKey: string, position: string) => void
  onRemoveScheduledAssignAsset: (assetKey: string, position: string) => void
  onRemoveScheduledUnassignAsset: (assetKey: string, position: string) => void
  onUpdateAssetPointOfContact: (assetKey: string, memberId: string | null) => void
}

export type PositionRosterAssetSectionsProps = PositionRosterAssetHandlers & {
  entry: PositionRosterEntry
  assignableAssets: ResourceListItemData[]
  scheduleAssignableAssets: ResourceListItemData[]
  scheduleUnassignableAssets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  canManageRoster: boolean
  isBusy: boolean
}

export function AssetPointOfContactSelect({
  assetKey,
  value,
  members,
  disabled = false,
  compact = false,
  onChange,
}: {
  assetKey: string
  value: string | null
  members: WorkspaceRosterMember[]
  disabled?: boolean
  compact?: boolean
  onChange: (memberId: string | null) => void
}) {
  return (
    <div className={compact ? 'min-w-[8rem]' : 'space-y-1'}>
      {!compact ? (
        <Label htmlFor={`asset-poc-${assetKey}`} className="text-[10px] text-muted-foreground">
          Point of Contact
        </Label>
      ) : null}
      <Select
        value={value ?? '__none__'}
        disabled={disabled}
        onValueChange={(next) => onChange(next === '__none__' ? null : next)}
      >
        <SelectTrigger
          id={`asset-poc-${assetKey}`}
          className={compact ? 'h-7 text-[11px]' : 'h-8 text-xs'}
        >
          <SelectValue placeholder="Select POC" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No POC selected</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function PositionAssetRow({
  asset,
  badgeLabel,
  pocMembers,
  canManage,
  canEditPoc,
  isBusy,
  removeLabel,
  onRemove,
  onUpdateAssetPointOfContact,
}: {
  asset: PositionAssetRosterEntry
  badgeLabel: string
  pocMembers: WorkspaceRosterMember[]
  canManage: boolean
  canEditPoc: boolean
  isBusy: boolean
  removeLabel: string
  onRemove?: () => void
  onUpdateAssetPointOfContact: (assetKey: string, memberId: string | null) => void
}) {
  return (
    <div className="space-y-1.5 rounded-md border px-2 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{asset.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
              {badgeLabel}
            </Badge>
            {asset.type ? (
              <span className="truncate text-[10px] text-muted-foreground">{asset.type}</span>
            ) : null}
            {!asset.pointOfContactMemberId && !asset.pointOfContactEmail ? (
              <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                POC required
              </Badge>
            ) : null}
          </div>
        </div>
        {canManage && onRemove ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={removeLabel}
            disabled={isBusy}
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <AssetPointOfContactSelect
        assetKey={asset.assetKey}
        value={asset.pointOfContactMemberId}
        members={pocMembers}
        disabled={!canEditPoc || isBusy}
        compact
        onChange={(memberId) => onUpdateAssetPointOfContact(asset.assetKey, memberId)}
      />
    </div>
  )
}

function PositionAssetPickerPopover({
  label,
  assets,
  pocMembers,
  requirePoc,
  disabled,
  emptyMessage,
  onSelect,
}: {
  label: string
  assets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  requirePoc: boolean
  disabled: boolean
  emptyMessage: string
  onSelect: (assetKey: string, pointOfContactMemberId?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedAssetKey, setSelectedAssetKey] = useState<string | null>(null)
  const [pocMemberId, setPocMemberId] = useState<string | null>(null)

  const selectedAsset = assets.find((asset) => asset.assetKey === selectedAssetKey) ?? null
  const needsPoc =
    requirePoc && selectedAsset && !selectedAsset.pointOfContactMemberId && !pocMemberId

  const reset = () => {
    setSelectedAssetKey(null)
    setPocMemberId(null)
  }

  return (
    <div className="space-y-1 pt-1">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) reset()
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-full gap-1 text-xs"
            disabled={disabled || assets.length === 0}
          >
            <Truck className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-2 p-2">
          {!selectedAsset ? (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {assets.map((asset) => (
                <Button
                  key={asset.assetKey}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto min-h-8 w-full justify-start py-1.5 text-left text-xs"
                  onClick={() => setSelectedAssetKey(asset.assetKey)}
                >
                  <span className="truncate">{asset.name}</span>
                  {asset.type ? (
                    <span className="ml-1 truncate text-[10px] text-muted-foreground">
                      · {asset.type}
                    </span>
                  ) : null}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium">{selectedAsset.name}</p>
              {requirePoc && !selectedAsset.pointOfContactMemberId ? (
                <AssetPointOfContactSelect
                  assetKey={selectedAsset.assetKey}
                  value={pocMemberId}
                  members={pocMembers}
                  onChange={setPocMemberId}
                />
              ) : null}
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="flex-1" onClick={reset}>
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={Boolean(needsPoc)}
                  onClick={() => {
                    onSelect(
                      selectedAsset.assetKey,
                      selectedAsset.pointOfContactMemberId ?? pocMemberId ?? undefined
                    )
                    setOpen(false)
                    reset()
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {assets.length === 0 && emptyMessage ? (
        <p className="px-1 text-[11px] text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </div>
  )
}

export function PositionRosterAssetSections({
  entry,
  assignableAssets,
  scheduleAssignableAssets,
  scheduleUnassignableAssets,
  pocMembers,
  canManageRoster,
  isBusy,
  onAssignAsset,
  onUnassignAsset,
  onScheduleAssignAsset,
  onScheduleUnassignAsset,
  onRemoveScheduledAssignAsset,
  onRemoveScheduledUnassignAsset,
  onUpdateAssetPointOfContact,
}: PositionRosterAssetSectionsProps) {
  const policy = entry.memberSchedulePolicy
  const canAssignNow = policy.allowActiveAssignment
  const canScheduleAssign = policy.allowScheduleAssign
  const canScheduleUnassign = policy.allowScheduleUnassign

  return (
    <>
      <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
        <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          Assigned assets
        </p>
        {entry.assets.length === 0 ? (
          <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
            No assets assigned to this position.
          </p>
        ) : (
          entry.assets.map((asset) => (
            <PositionAssetRow
              key={`asset-now-${entry.position}-${asset.assetKey}`}
              asset={asset}
              badgeLabel="Assigned"
              pocMembers={pocMembers}
              canManage={canManageRoster && canAssignNow}
              canEditPoc={canManageRoster}
              isBusy={isBusy}
              removeLabel={`Remove ${asset.name} from ${entry.position}`}
              onRemove={() => onUnassignAsset(asset.assetKey, entry.position)}
              onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
            />
          ))
        )}
        {canManageRoster && canAssignNow ? (
          <PositionAssetPickerPopover
            label="Assign asset"
            assets={assignableAssets}
            pocMembers={pocMembers}
            requirePoc
            disabled={isBusy}
            emptyMessage="No workspace assets are available to assign to this position."
            onSelect={(assetKey, pointOfContactMemberId) =>
              onAssignAsset(assetKey, entry.position, pointOfContactMemberId)
            }
          />
        ) : null}
      </div>

      {entry.scheduledAssignAssets.length > 0 || canScheduleAssign ? (
        <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled assign (next OP)
          </p>
          {entry.scheduledAssignAssets.length === 0 ? (
            <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
              No assets scheduled to assign.
            </p>
          ) : (
            entry.scheduledAssignAssets.map((asset) => (
              <PositionAssetRow
                key={`asset-sched-assign-${entry.position}-${asset.assetKey}`}
                asset={asset}
                badgeLabel="Next OP"
                pocMembers={pocMembers}
                canManage={canManageRoster}
                canEditPoc={canManageRoster}
                isBusy={isBusy}
                removeLabel={`Remove ${asset.name} from next OP assign schedule`}
                onRemove={() => onRemoveScheduledAssignAsset(asset.assetKey, entry.position)}
                onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
              />
            ))
          )}
          {canManageRoster && canScheduleAssign ? (
            <PositionAssetPickerPopover
              label="Schedule assign for next OP"
              assets={scheduleAssignableAssets}
              pocMembers={pocMembers}
              requirePoc={false}
              disabled={isBusy}
              emptyMessage="No workspace assets are available to schedule for this position."
              onSelect={(assetKey) => onScheduleAssignAsset(assetKey, entry.position)}
            />
          ) : null}
        </div>
      ) : null}

      {entry.scheduledUnassignAssets.length > 0 || canScheduleUnassign ? (
        <div className="space-y-1.5 rounded-md border bg-muted/10 px-2.5 py-2">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Scheduled unassign (next OP)
          </p>
          {entry.scheduledUnassignAssets.length === 0 ? (
            <p className="rounded-md border border-dashed px-2 py-2 text-center text-[11px] text-muted-foreground">
              No assets scheduled to unassign.
            </p>
          ) : (
            entry.scheduledUnassignAssets.map((asset) => (
              <PositionAssetRow
                key={`asset-sched-unassign-${entry.position}-${asset.assetKey}`}
                asset={asset}
                badgeLabel="Next OP"
                pocMembers={pocMembers}
                canManage={canManageRoster}
                canEditPoc={canManageRoster}
                isBusy={isBusy}
                removeLabel={`Remove ${asset.name} from next OP unassign schedule`}
                onRemove={() => onRemoveScheduledUnassignAsset(asset.assetKey, entry.position)}
                onUpdateAssetPointOfContact={onUpdateAssetPointOfContact}
              />
            ))
          )}
          {canManageRoster && canScheduleUnassign ? (
            <PositionAssetPickerPopover
              label="Schedule unassign for next OP"
              assets={scheduleUnassignableAssets}
              pocMembers={pocMembers}
              requirePoc={false}
              disabled={isBusy}
              emptyMessage="No assigned assets can be scheduled to unassign."
              onSelect={(assetKey) => onScheduleUnassignAsset(assetKey, entry.position)}
            />
          ) : null}
        </div>
      ) : null}
    </>
  )
}
