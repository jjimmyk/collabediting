import { forwardRef, type ReactNode, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { scrollToHorizontalCenter, stepRosterZoom } from '@/features/roster/roster-zoom'

type RosterZoomContainerProps = {
  zoom: number
  onZoomChange?: (zoom: number) => void
  centerScroll?: boolean
  recenterToken?: number
  initialScrollLeft?: number
  initialScrollTop?: number
  children: ReactNode
  className?: string
}

export const RosterZoomContainer = forwardRef<HTMLDivElement, RosterZoomContainerProps>(
  function RosterZoomContainer(
    {
      zoom,
      onZoomChange,
      centerScroll = false,
      recenterToken = 0,
      initialScrollLeft,
      initialScrollTop,
      children,
      className,
    },
    ref
  ) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
      const container = scrollRef.current
      if (!container) return

      if (initialScrollLeft !== undefined) {
        container.scrollLeft = initialScrollLeft
      }
      if (initialScrollTop !== undefined) {
        container.scrollTop = initialScrollTop
      }
    }, [initialScrollLeft, initialScrollTop, zoom])

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
        ref={(node) => {
          scrollRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
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
)
