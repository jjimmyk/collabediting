import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_ROSTER_ZOOM,
  parseRosterZoomPercent,
  rosterZoomAtMax,
  rosterZoomAtMin,
  ROSTER_ZOOM_MAX,
  ROSTER_ZOOM_MIN,
  stepRosterZoom,
} from '@/features/roster/roster-zoom'

type RosterZoomControlsProps = {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export function RosterZoomControls({ zoom, onZoomChange }: RosterZoomControlsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const atMin = rosterZoomAtMin(zoom)
  const atMax = rosterZoomAtMax(zoom)
  const percentValue = Math.round(zoom * 100)

  const commitDraft = () => {
    const parsed = parseRosterZoomPercent(draft)
    if (parsed !== null) {
      onZoomChange(parsed)
    }
    setIsEditing(false)
  }

  const resetZoom = () => {
    onZoomChange(DEFAULT_ROSTER_ZOOM)
    setIsEditing(false)
  }

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
        aria-label="Zoom out by 5 percent"
        onClick={() => onZoomChange(stepRosterZoom(zoom, 'out'))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <div className="flex h-8 min-w-[3.75rem] items-center justify-center border-x px-1">
        <input
          type="text"
          inputMode="numeric"
          value={isEditing ? draft : String(percentValue)}
          aria-label="Zoom percent"
          aria-valuenow={percentValue}
          aria-valuemin={ROSTER_ZOOM_MIN * 100}
          aria-valuemax={ROSTER_ZOOM_MAX * 100}
          title="Enter a zoom percent (50–200). Double-click to reset to 100%."
          className="w-9 bg-transparent text-center text-xs tabular-nums text-muted-foreground outline-none hover:text-foreground focus:text-foreground"
          onFocus={() => {
            setIsEditing(true)
            setDraft(String(percentValue))
          }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setIsEditing(false)
            }
          }}
          onDoubleClick={resetZoom}
        />
        <span className="text-xs tabular-nums text-muted-foreground">%</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-none rounded-r-md px-2"
        disabled={atMax}
        aria-label="Zoom in by 5 percent"
        onClick={() => onZoomChange(stepRosterZoom(zoom, 'in'))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
