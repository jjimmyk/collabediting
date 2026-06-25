import { ChevronRight, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { Ics215HaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { formatHaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import { cn } from '@/lib/utils'

type Ics215HaveAssetPickCardProps = {
  entry: ScoredWorkspaceAsset
  checked: boolean
  disabled?: boolean
  selected?: boolean
  linkedToThisCell?: boolean
  linkedElsewhere?: Ics215HaveAssetLinkLocation
  onToggle: () => void
  onSelectDetail: () => void
  onUnlinkFromElsewhere?: () => void
}

export function Ics215HaveAssetPickCard({
  entry,
  checked,
  disabled = false,
  selected = false,
  linkedToThisCell = false,
  linkedElsewhere,
  onToggle,
  onSelectDetail,
  onUnlinkFromElsewhere,
}: Ics215HaveAssetPickCardProps) {
  const asset = entry.asset
  const blockedByOtherCell = Boolean(linkedElsewhere) && !linkedToThisCell

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 transition-colors',
        selected && 'border-primary/50 bg-primary/5',
        checked && !selected && 'border-primary/30 bg-primary/[0.03]',
        blockedByOtherCell && 'opacity-80',
        disabled && !blockedByOtherCell && 'opacity-70'
      )}
      onClick={onSelectDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectDetail()
        }
      }}
    >
      <Checkbox
        checked={checked}
        disabled={disabled || blockedByOtherCell}
        onCheckedChange={onToggle}
        className="mt-0.5"
        aria-label={`Select ${asset.name}`}
        onClick={(event) => event.stopPropagation()}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
          <span className="text-sm font-medium">{asset.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {asset.type}
          </Badge>
          {linkedToThisCell ? (
            <Badge variant="secondary" className="text-[10px]">
              Linked here
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {asset.unitName || asset.unitType || asset.owner || 'Assigned asset'}
        </p>
        {entry.matchReason ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{entry.matchReason}</p>
        ) : null}
        {linkedElsewhere ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Assigned to {formatHaveAssetLinkLocation(linkedElsewhere)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {linkedToThisCell && checked ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onToggle()
            }}
          >
            <Unlink className="h-3 w-3" />
            Unlink
          </Button>
        ) : null}
        {blockedByOtherCell && onUnlinkFromElsewhere ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              onUnlinkFromElsewhere()
            }}
          >
            <Unlink className="h-3 w-3" />
            Unlink there
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7', selected && 'text-primary')}
          aria-label={`View details for ${asset.name}`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation()
            onSelectDetail()
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
