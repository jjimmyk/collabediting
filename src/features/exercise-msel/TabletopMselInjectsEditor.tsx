import { MapPin, Send, Shapes, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FunctionalMselInjectsEditor, type FunctionalMselInjectsEditorProps } from './FunctionalMselInjectsEditor'
import {
  getInjectMapFeatures,
  getMapFeatureLabel,
  hasInjectMapGeometry,
} from './msel-geometry-utils'
import type { MselInject, MselMapPlacementMode } from './types'

type TabletopMselInjectsEditorProps = Omit<
  FunctionalMselInjectsEditorProps,
  'renderExtraActions' | 'renderInjectSummarySuffix' | 'renderExpandedSection'
> & {
  activePlacementInjectId: number | null
  activePlacementMode: MselMapPlacementMode | null
  onStartPlacement: (injectId: number, mode: MselMapPlacementMode) => void
  onFocusOnMap: (inject: MselInject) => void
  onRemoveMapFeature: (injectId: number, featureId: string) => void
  onClearMapFeatures: (injectId: number) => void
  deliveryCountByInjectId: Record<number, number>
  onSendInject: (inject: MselInject) => void
}

export function TabletopMselInjectsEditor({
  activePlacementInjectId,
  activePlacementMode,
  onStartPlacement,
  onFocusOnMap,
  onRemoveMapFeature,
  onClearMapFeatures,
  deliveryCountByInjectId,
  onSendInject,
  onInjectsChange,
  ...props
}: TabletopMselInjectsEditorProps) {
  const placementLabel =
    activePlacementMode === 'polygon'
      ? 'Click the map to draw a polygon. Double-click to finish.'
      : 'Click the map to place a point for this inject.'

  return (
    <>
      {activePlacementInjectId != null && (
        <div
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:border-violet-800/60 dark:bg-violet-500/10 dark:text-violet-100"
          data-testid="msel-map-placement-banner"
        >
          {placementLabel} (Inject {activePlacementInjectId})
        </div>
      )}
      <FunctionalMselInjectsEditor
        {...props}
        onInjectsChange={onInjectsChange}
        renderInjectSummarySuffix={(inject) => {
          const sentCount = deliveryCountByInjectId[inject.id] ?? 0
          const featureCount = getInjectMapFeatures(inject).length
          return (
            <>
              {featureCount > 0 ? <span>{` · ${featureCount} map shape${featureCount === 1 ? '' : 's'}`}</span> : null}
              {sentCount > 0 ? <span>{` · Sent ×${sentCount}`}</span> : null}
            </>
          )
        }}
        renderExpandedSection={(inject) => {
          const features = getInjectMapFeatures(inject)
          return (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-medium">Map shapes</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onStartPlacement(inject.id, 'point')}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Add point
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => onStartPlacement(inject.id, 'polygon')}
                  >
                    <Shapes className="h-3.5 w-3.5" />
                    Draw area
                  </Button>
                  {features.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-xs text-destructive"
                      onClick={() => onClearMapFeatures(inject.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
              {features.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No map shapes yet. Add a point or draw an area on the map.
                </p>
              ) : (
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li
                      key={feature.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs"
                    >
                      <span className="truncate">{getMapFeatureLabel(feature, index)}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive"
                        onClick={() => onRemoveMapFeature(inject.id, feature.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        }}
        renderExtraActions={(inject) => (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Send inject ${inject.id}`}
              data-testid={`msel-inject-send-button-${inject.id}`}
              onClick={() => onSendInject(inject)}
            >
              <Send className="h-4 w-4" />
            </Button>
            {(deliveryCountByInjectId[inject.id] ?? 0) > 0 && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Sent ×{deliveryCountByInjectId[inject.id]}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={hasInjectMapGeometry(inject) ? 'secondary' : 'outline'}
                  size="icon"
                  aria-label={`Map actions for inject ${inject.id}`}
                  data-testid={`msel-inject-map-button-${inject.id}`}
                  className={cn(
                    activePlacementInjectId === inject.id &&
                      'ring-2 ring-violet-500 ring-offset-2'
                  )}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStartPlacement(inject.id, 'point')}>
                  Add map point
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartPlacement(inject.id, 'polygon')}>
                  Draw map area
                </DropdownMenuItem>
                {hasInjectMapGeometry(inject) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFocusOnMap(inject)}>
                      Zoom to shapes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onClearMapFeatures(inject.id)}
                    >
                      Clear all shapes
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      />
    </>
  )
}
