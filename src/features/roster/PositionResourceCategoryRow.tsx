import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ResourceListItemData } from '@/features/resources/types'
import { PositionMemberAssignPicker } from '@/features/roster/PositionMemberAssignPicker'
import { PositionAssetPickerPopover } from '@/features/roster/PositionRosterAssetSections'
import { PositionRosterItemActions } from '@/features/roster/PositionRosterItemActions'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import type { ResourceCategoryLifecycle } from '@/lib/workspace-resource-category-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function PositionResourceCategoryCreateButton({
  disabled,
  onClick,
}: {
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 gap-1 px-2 text-[11px]"
      disabled={disabled}
      onClick={onClick}
    >
      <Plus className="h-3.5 w-3.5 shrink-0" />
      Resource Category
    </Button>
  )
}

export function PositionResourceCategoryCreateForm({
  disabled,
  onCreate,
  onCancel,
}: {
  disabled: boolean
  onCreate: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
  }

  return (
    <div className="w-full space-y-2 rounded-md border bg-muted/10 px-2.5 py-2">
      <Input
        ref={inputRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          }
        }}
        placeholder="Resource category name"
        className="h-8 w-full text-xs"
        aria-label="Resource category name"
      />
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={disabled || !name.trim()}
          onClick={submit}
        >
          Add category
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function PositionResourceCategoryRow({
  category,
  position,
  lifecycleLabel,
  canManage,
  isBusy,
  assignableMembers,
  assignableAssets,
  pocMembers,
  assetsEnabled,
  onDelete,
  onFillMember,
  onFillAsset,
  onClearFill,
  showAlsoScheduleForNextOp = false,
  onAlsoScheduleForNextOp,
}: {
  category: PositionResourceCategoryEntry
  position: string
  lifecycleLabel: string
  canManage: boolean
  isBusy: boolean
  assignableMembers: WorkspaceRosterMember[]
  assignableAssets: ResourceListItemData[]
  pocMembers: WorkspaceRosterMember[]
  assetsEnabled: boolean
  onDelete: () => void
  onFillMember: (memberId: string) => void
  onFillAsset: (assetKey: string) => void
  onClearFill: () => void
  showAlsoScheduleForNextOp?: boolean
  onAlsoScheduleForNextOp?: () => void
}) {
  const fillLabel =
    category.filledMemberEmail ??
    category.filledAssetName ??
    'Unfilled — assign a person or asset'

  return (
    <div className="space-y-1.5 rounded-md border px-2 py-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{category.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              Resource Category
            </Badge>
            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
              {lifecycleLabel}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{fillLabel}</p>
        </div>
        <PositionRosterItemActions
          disabled={isBusy}
          showScheduleForNextOp={showAlsoScheduleForNextOp}
          onScheduleForNextOp={onAlsoScheduleForNextOp}
          showRemove={canManage}
          onRemove={onDelete}
          removeLabel={`Remove resource category ${category.name}`}
        />
      </div>
      {canManage ? (
        <div className="flex flex-wrap gap-1.5">
          <PositionMemberAssignPicker
            label="Existing Person"
            disabled={isBusy}
            position={position}
            assignableMembers={assignableMembers}
            onSelectRosterMember={onFillMember}
          />
          {assetsEnabled ? (
            <PositionAssetPickerPopover
              label="Asset"
              assets={assignableAssets}
              pocMembers={pocMembers}
              requirePoc={false}
              disabled={isBusy}
              emptyMessage="No assignable assets"
              compact
              onSelect={(assetKey) => onFillAsset(assetKey)}
            />
          ) : null}
          {(category.filledMemberId || category.filledAssetKey) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              disabled={isBusy}
              onClick={onClearFill}
            >
              Clear fill
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

export function filterResourceCategoriesByLifecycle(
  categories: PositionResourceCategoryEntry[],
  lifecycle: ResourceCategoryLifecycle
): PositionResourceCategoryEntry[] {
  return categories.filter((category) => category.lifecycle === lifecycle)
}
