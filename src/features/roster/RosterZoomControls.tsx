import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_ROSTER_ZOOM,
  formatRosterZoomLabel,
  rosterZoomAtMax,
  rosterZoomAtMin,
  stepRosterZoom,
} from '@/features/roster/roster-zoom'

type RosterZoomControlsProps = {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function RosterZoomControls({ zoom, onZoomChange }: RosterZoomControlsProps) {
  const atMin = rosterZoomAtMin(zoom)
  const atMax = rosterZoomAtMax(zoom)
  const label = formatRosterZoomLabel(zoom)

  return (
    <div
      className="flex items-center rounded-md border"
      role="group"
      aria-label="Roster zoom"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-none rounded-l-md px-2"
        disabled={atMin}
        aria-label="Zoom out"
        onClick={() => onZoomChange(stepRosterZoom(zoom, 'out'))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <button
        type="button"
        className="h-8 min-w-[3.25rem] border-x px-2 text-xs tabular-nums text-muted-foreground hover:text-foreground"
        aria-label={`Zoom level ${label}. Double-click to reset.`}
        aria-valuenow={Math.round(zoom * 100)}
        aria-valuemin={50}
        aria-valuemax={200}
        onClick={() => onZoomChange(DEFAULT_ROSTER_ZOOM)}
        onDoubleClick={() => onZoomChange(DEFAULT_ROSTER_ZOOM)}
      >
        {label}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-none rounded-r-md px-2"
        disabled={atMax}
        aria-label="Zoom in"
        onClick={() => onZoomChange(stepRosterZoom(zoom, 'in'))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
