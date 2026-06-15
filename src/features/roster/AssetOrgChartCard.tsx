import { Map as MapIcon, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { ResourceListItemData } from '@/features/resources/types'
import { orgChartColorClasses, type OrgChartColor } from '@/features/roster/ics-org-chart-structure'
import { cn } from '@/lib/utils'

type AssetOrgChartCardProps = {
  asset: ResourceListItemData
  color?: OrgChartColor
  canManage?: boolean
  onFocusMap?: (asset: ResourceListItemData) => void
  onRemoveFromOrgChart?: (assetKey: string) => void
}

export function AssetOrgChartCard({
  asset,
  color,
  canManage = false,
  onFocusMap,
  onRemoveFromOrgChart,
}: AssetOrgChartCardProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-md border border-dashed px-2 py-2 shadow-sm',
        orgChartColorClasses(color ?? 'neutral')
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
            <p className="truncate text-xs font-semibold leading-snug">{asset.name}</p>
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              Asset
            </Badge>
          </div>
          <p className="truncate text-[10px] text-muted-foreground">{asset.type}</p>
          {asset.orgChartReportsTo ? (
            <p className="truncate text-[10px] text-muted-foreground">
              Reports to {asset.orgChartReportsTo}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onFocusMap ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label={`Zoom map to ${asset.name}`}
              onClick={() => onFocusMap(asset)}
            >
              <MapIcon className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {canManage && onRemoveFromOrgChart ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${asset.name} from org chart`}
              onClick={() => onRemoveFromOrgChart(asset.assetKey)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
