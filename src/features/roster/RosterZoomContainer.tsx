import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { scrollToHorizontalCenter, stepRosterZoom } from '@/features/roster/roster-zoom'

type RosterZoomContainerProps = {
  zoom: number
  onZoomChange?: (zoom: number) => void
  centerScroll?: boolean
  recenterToken?: number
  children: ReactNode
  className?: string
}

export function RosterZoomContainer({
  zoom,
  onZoomChange,
  centerScroll = false,
  recenterToken = 0,
  children,
  className,
}: RosterZoomContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!centerScroll) return

    const container = scrollRef.current
    if (!container) return

    const center = () => scrollToHorizontalCenter(container)
    center()

    const frame = requestAnimationFrame(center)
    return () => cancelAnimationFrame(frame)
  }, [centerScroll, recenterToken])

  useLayoutEffect(() => {
    if (!onZoomChange) return

    const container = scrollRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return

      event.preventDefault()
      onZoomChange(stepRosterZoom(zoom, event.deltaY < 0 ? 'in' : 'out'))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [onZoomChange, zoom])

  return (
    <div
      ref={scrollRef}
      className={cn('min-w-0 w-full max-w-full overflow-auto scroll-smooth', className)}
    >
      <div className="flex min-w-full justify-center">
        <div style={{ zoom }} className="w-max">
          {children}
        </div>
      </div>
    </div>
  )
}
