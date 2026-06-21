import { MapIcon, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORG_CHART_ASSET_CARD_WIDTH } from '@/features/roster/org-chart-layout-tokens'
import { cn } from '@/lib/utils'

type OrgChartAssetCardProps = {
  name: string
  scheduled?: boolean
  canManage?: boolean
  removeLabel: string
  onRemove?: () => void
  onFocusMap?: () => void
}

export function OrgChartAssetCard({
  name,
  scheduled = false,
  canManage = false,
  removeLabel,
  onRemove,
  onFocusMap,
}: OrgChartAssetCardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-dashed bg-background/80 px-2 py-1.5 shadow-sm',
        ORG_CHART_ASSET_CARD_WIDTH,
        scheduled && 'opacity-90'
      )}
      title={name}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-semibold leading-snug">{name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              Asset
            </Badge>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              {scheduled ? 'Org chart · Next OP' : 'Org chart'}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onFocusMap ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground"
              aria-label={`Zoom map to ${name}`}
              onClick={onFocusMap}
            >
              <MapIcon className="h-3 w-3" />
            </Button>
          ) : null}
          {canManage && onRemove ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              aria-label={removeLabel}
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
