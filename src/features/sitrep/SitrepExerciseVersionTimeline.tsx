import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SitrepTimelineMarker } from '@/features/sitrep/sitrep-version-timeline'
import {
  buildSitrepVersionTimelineMarkers,
  formatSitrepTimelineTimestamp,
} from '@/features/sitrep/sitrep-version-timeline'
import type { SitrepVersion } from '@/features/sitrep/types'
import { cn } from '@/lib/utils'

type SitrepExerciseVersionTimelineProps = {
  versions: SitrepVersion[]
  activeVersionId: string | null
  className?: string
  onSelectVersion: (version: SitrepVersion) => void
}

function markerAriaLabel(marker: SitrepTimelineMarker): string {
  const status = marker.isSigned ? 'signed' : 'draft'
  return `View ${status} SITREP from ${formatSitrepTimelineTimestamp(marker.createdAt)} by ${marker.authorName}`
}

export function SitrepExerciseVersionTimeline({
  versions,
  activeVersionId,
  className,
  onSelectVersion,
}: SitrepExerciseVersionTimelineProps) {
  const timeline = useMemo(() => buildSitrepVersionTimelineMarkers(versions), [versions])

  if (timeline.markers.length === 0) {
    return null
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'mx-auto w-full max-w-2xl rounded-xl border bg-background/90 px-4 py-3 shadow-lg backdrop-blur',
          className
        )}
        role="group"
        aria-label="SITREP version timeline"
      >
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <span>{formatSitrepTimelineTimestamp(timeline.rangeStart)}</span>
          <span className="font-medium uppercase tracking-wide">Saved SITREP versions</span>
          <span>{formatSitrepTimelineTimestamp(timeline.rangeEnd)}</span>
        </div>

        <div className="relative h-8">
          <div
            aria-hidden="true"
            className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-muted"
          />
          {timeline.markers.map((marker) => {
            const isActive = marker.versionId === activeVersionId
            return (
              <Tooltip key={marker.versionId}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      'size-3.5 bg-background',
                      marker.isSigned
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-amber-500 bg-amber-400',
                      isActive && 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                    style={{ left: `${marker.offsetPercent}%` }}
                    aria-label={markerAriaLabel(marker)}
                    aria-pressed={isActive}
                    onClick={() => onSelectVersion(marker.version)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {marker.label === 'latest' ? 'Latest' : marker.label.toUpperCase()} ·{' '}
                      {formatSitrepTimelineTimestamp(marker.createdAt)}
                    </p>
                    <p className="text-background/80">{marker.authorName}</p>
                    <Badge
                      variant="outline"
                      className="h-5 border-background/30 bg-background/10 px-1.5 text-[10px] text-background"
                    >
                      {marker.isSigned ? 'Signed' : 'Draft'}
                    </Badge>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
