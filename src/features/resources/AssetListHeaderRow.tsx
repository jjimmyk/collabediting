import { ChevronDown, Map as MapIcon, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ItemActions, ItemContent } from '@/components/ui/item'
import { cn } from '@/lib/utils'

export const ASSET_LIST_ROW_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_10.5rem] items-center gap-x-2'

export const ASSET_LIST_STATUS_CELL_CLASS =
  'flex w-full min-w-0 items-center gap-1'

type AssetListHeaderRowProps = {
  showActionSpacer?: boolean
  /** Match visible row actions: map + chevron (2) or edit + map + chevron (3). */
  actionSlotCount?: 2 | 3
}

function AssetListHeaderActionSpacer({ actionSlotCount }: { actionSlotCount: 2 | 3 }) {
  return (
    <ItemActions className="pointer-events-none invisible shrink-0" aria-hidden>
      {actionSlotCount === 3 ? (
        <Button variant="ghost" size="icon" tabIndex={-1}>
          <Pencil className="h-4 w-4" />
        </Button>
      ) : null}
      <Button variant="ghost" size="icon" tabIndex={-1}>
        <MapIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" tabIndex={-1}>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </ItemActions>
  )
}

export function AssetListHeaderRow({
  showActionSpacer = true,
  actionSlotCount = 3,
}: AssetListHeaderRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-0.5">
      <ItemContent className="min-w-0 flex-1">
        <div className={ASSET_LIST_ROW_GRID_CLASS} role="row">
          <span
            className="min-w-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            role="columnheader"
          >
            Asset ID
          </span>
          <span
            className={cn(
              ASSET_LIST_STATUS_CELL_CLASS,
              'text-xs font-semibold uppercase tracking-wide text-muted-foreground'
            )}
            role="columnheader"
          >
            Asset Status
          </span>
        </div>
      </ItemContent>
      {showActionSpacer ? (
        <AssetListHeaderActionSpacer actionSlotCount={actionSlotCount} />
      ) : null}
    </div>
  )
}
