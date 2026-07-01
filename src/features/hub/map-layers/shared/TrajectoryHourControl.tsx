import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

type TrajectoryHourControlProps = {
  id: string
  hourIndex: number
  onHourIndexChange: (hourIndex: number) => void
  stepCount: number
  formatLabel: (hourIndex: number) => string
  ariaLabel?: string
  label?: string
  children?: ReactNode
}

export function TrajectoryHourControl({
  id,
  hourIndex,
  onHourIndexChange,
  stepCount,
  formatLabel,
  ariaLabel = 'Trajectory hour',
  label = 'Trajectory hour',
  children,
}: TrajectoryHourControlProps) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">{formatLabel(hourIndex)}</span>
      </div>
      <Slider
        id={id}
        min={0}
        max={stepCount - 1}
        step={1}
        value={[hourIndex]}
        onValueChange={(value) => {
          const next = value[0]
          if (typeof next === 'number') {
            onHourIndexChange(next)
          }
        }}
        aria-label={ariaLabel}
      />
      <p className="text-[11px] text-muted-foreground">
        Hour {hourIndex + 1} of {stepCount}
      </p>
      {children}
    </div>
  )
}
