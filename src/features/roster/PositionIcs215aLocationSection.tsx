import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  formatIcs215aLocationSummary,
  hasIcs215aLocationGeometry,
} from '@/features/ics215a/location-utils'
import type { Ics215aLocationByPositionEntry } from '@/features/ics215a/types'

type PositionIcs215aLocationSectionProps = {
  entries: Ics215aLocationByPositionEntry[]
  onFocusRow?: (rowId: number) => void
  variant?: 'panel' | 'table' | 'compact'
}

export function PositionIcs215aLocationSection({
  entries,
  onFocusRow,
  variant = 'panel',
}: PositionIcs215aLocationSectionProps) {
  if (entries.length === 0) {
    return null
  }

  if (variant === 'compact') {
    return (
      <div className="text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">ICS-215A location: </span>
        {entries.map((entry, index) => (
          <span key={entry.rowId}>
            {index > 0 ? '; ' : ''}
            {entry.summary}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/20 px-2.5 py-2">
      <p className="text-xs font-medium text-muted-foreground">ICS-215A Safety Analysis location</p>
      <ul className="space-y-1.5">
        {entries.map((entry) => {
          const canZoom = hasIcs215aLocationGeometry(entry.location)
          return (
            <li
              key={entry.rowId}
              className="flex items-start gap-2 text-xs"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label="Zoom to ICS-215A location on map"
                title={
                  canZoom
                    ? 'Zoom to location on map'
                    : 'Add coordinates or draw on map to zoom'
                }
                disabled={!canZoom || !onFocusRow}
                onClick={() => onFocusRow?.(entry.rowId)}
              >
                <MapPin className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-0 pt-1 text-muted-foreground">
                {formatIcs215aLocationSummary(entry.location) || entry.summary}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
