import { useState } from 'react'
import { Trash2, Truck } from 'lucide-react'
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
import { CompetencyFunctionSelect } from '@/features/roster/CompetencyFunctionSelect'
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
  onUpdateAssetCompetencyFunction?: (assetKey: string, value: string | null) => void
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

export function PositionAssetRow({
  asset,
  badgeLabel,
  pocMembers,
  canManage,
  canEditPoc,
  isBusy,
  removeLabel,
  onRemove,
  onUpdateAssetPointOfContact,
  canEditCompetencyFunction = false,
  competencyOptions = [],
  isUpdatingCompetency = false,
  onUpdateAssetCompetencyFunction,
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
  canEditCompetencyFunction?: boolean
  competencyOptions?: string[]
  isUpdatingCompetency?: boolean
  onUpdateAssetCompetencyFunction?: (assetKey: string, value: string | null) => void
}) {
  return (
    <div className="space-y-1.5 rounded-md border px-2 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{asset.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              Asset
            </Badge>
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
      {onUpdateAssetCompetencyFunction ? (
        <CompetencyFunctionSelect
          value={asset.competencyFunction}
          options={competencyOptions}
          disabled={!canEditCompetencyFunction || isBusy}
          compact
          isUpdating={isUpdatingCompetency}
          onChange={(value) => onUpdateAssetCompetencyFunction(asset.assetKey, value)}
        />
      ) : null}
    </div>
  )
}

export function PositionAssetPickerPopover({
  label,
  assets,
  pocMembers,
  requirePoc,
  disabled,
  emptyMessage,
  compact = false,
  onSelect,
}: {
  label: string
  assets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  requirePoc: boolean
  disabled: boolean
  emptyMessage: string
  compact?: boolean
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
    <div className={compact ? 'min-w-[6.5rem] flex-1' : 'space-y-1 pt-1'}>
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
            className={
              compact
                ? 'h-7 w-full gap-1 px-2 text-[11px]'
                : 'h-7 w-full gap-1 text-xs'
            }
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
      {assets.length === 0 && emptyMessage && !compact ? (
        <p className="px-1 text-[11px] text-muted-foreground">{emptyMessage}</p>
      ) : null}
    </div>
  )
}
