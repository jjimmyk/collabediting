import { useState } from 'react'
import { ChevronDown, Unlink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Ics215HaveAssetDetailFields } from '@/features/ics215/Ics215HaveAssetDetailFields'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { Ics215HaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import { formatHaveAssetLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { ScoredWorkspaceAsset } from '@/features/resources/workspace-asset-relevance'
import { cn } from '@/lib/utils'

type Ics215HaveAssetPickCardProps = {
  entry: ScoredWorkspaceAsset
  checked: boolean
  disabled?: boolean
  linkedToThisCell?: boolean
  linkedElsewhere?: Ics215HaveAssetLinkLocation
  onToggle: () => void
  onUnlinkFromElsewhere?: () => void
}

export function Ics215HaveAssetPickCard({
  entry,
  checked,
  disabled = false,
  linkedToThisCell = false,
  linkedElsewhere,
  onToggle,
  onUnlinkFromElsewhere,
}: Ics215HaveAssetPickCardProps) {
  const [open, setOpen] = useState(false)
  const asset = entry.asset
  const blockedByOtherCell = Boolean(linkedElsewhere) && !linkedToThisCell

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-md border',
          checked && 'border-primary/40 bg-primary/5',
          blockedByOtherCell && 'opacity-80',
          disabled && !blockedByOtherCell && 'opacity-70'
        )}
      >
        <div className="flex items-start gap-2 px-3 py-2">
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
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Toggle details for ${asset.name}`}
                aria-expanded={open}
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent className="overflow-hidden">
          <div className="max-h-56 overflow-y-auto border-t px-3 py-3">
            <Ics215HaveAssetDetailFields asset={asset} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
