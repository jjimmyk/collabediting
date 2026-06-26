import { useMemo, useState } from 'react'
import { AlertCircle, Layers, Loader2, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  filterHubMapVisibleItems,
  type HubMapVisibleItem,
} from '@/features/hub/map/hub-map-visible-items'

type HubMapVisibleItemsPillProps = {
  items: readonly HubMapVisibleItem[]
  className?: string
  glassItemBorderClasses?: string
  onRemoveItem: (item: HubMapVisibleItem) => void
  onClearAll: () => void
}

export function HubMapVisibleItemsPill({
  items,
  className,
  glassItemBorderClasses = '',
  onRemoveItem,
  onClearAll,
}: HubMapVisibleItemsPillProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(
    () => filterHubMapVisibleItems(items, searchQuery),
    [items, searchQuery]
  )

  if (items.length === 0) {
    return null
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSearchQuery('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={cn(
            'rounded-full border bg-background/90 px-3 shadow-sm backdrop-blur',
            'h-8',
            glassItemBorderClasses,
            className
          )}
          aria-label={`${items.length} map overlay${items.length === 1 ? '' : 's'} visible. Open to manage.`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            {items.length} on map
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn('w-80 p-0', glassItemBorderClasses)}
      >
        <div className="border-b px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Map overlays</p>
            <Badge variant="outline" className="h-5 px-2 text-[10px]">
              {items.length} visible
            </Badge>
          </div>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search overlays"
              aria-label="Search map overlays"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto px-2 py-2">
          {filteredItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No overlays match your search.
            </p>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map((item) => (
                <li
                  key={`${item.source}-${item.id}`}
                  className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {item.typeLabel}
                      </Badge>
                      {item.status === 'loading' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading
                        </span>
                      ) : null}
                      {item.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          Unavailable
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium">{item.label}</p>
                    {item.groupLabel ? (
                      <p className="text-[10px] text-muted-foreground">{item.groupLabel}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Remove ${item.label} from map`}
                    onClick={() => onRemoveItem(item)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-3 py-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-full text-xs"
            onClick={() => {
              onClearAll()
              setOpen(false)
              setSearchQuery('')
            }}
          >
            Clear all overlays
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
