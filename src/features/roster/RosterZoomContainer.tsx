import { type ReactNode, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { stepRosterZoom } from '@/features/roster/roster-zoom'

type RosterZoomContainerProps = {
  zoom: number
  onZoomChange?: (zoom: number) => void
  children: ReactNode
  className?: string
}

export function RosterZoomContainer({
  zoom,
  onZoomChange,
  children,
  className,
}: RosterZoomContainerProps) {
  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!onZoomChange || !(event.ctrlKey || event.metaKey)) return

      event.preventDefault()
      onZoomChange(stepRosterZoom(zoom, event.deltaY < 0 ? 'in' : 'out'))
    },
    [onZoomChange, zoom]
  )

  return (
    <div
      className={cn('min-w-0 w-full max-w-full overflow-auto scroll-smooth', className)}
      onWheel={handleWheel}
    >
      <div style={{ zoom }} className="min-w-0 w-max min-w-full">
        {children}
      </div>
    </div>
  )
}
