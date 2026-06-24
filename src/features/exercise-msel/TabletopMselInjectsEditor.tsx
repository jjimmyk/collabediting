import { MapPin, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FunctionalMselInjectsEditor, type FunctionalMselInjectsEditorProps } from './FunctionalMselInjectsEditor'
import type { MselInject } from './types'

type TabletopMselInjectsEditorProps = Omit<
  FunctionalMselInjectsEditorProps,
  'renderExtraActions' | 'renderInjectSummarySuffix'
> & {
  activePlacementInjectId: number | null
  onStartPlacement: (injectId: number) => void
  onFocusOnMap: (inject: MselInject) => void
  deliveryCountByInjectId: Record<number, number>
  onSendInject: (inject: MselInject) => void
}

export function TabletopMselInjectsEditor({
  activePlacementInjectId,
  onStartPlacement,
  onFocusOnMap,
  deliveryCountByInjectId,
  onSendInject,
  ...props
}: TabletopMselInjectsEditorProps) {
  return (
    <>
      {activePlacementInjectId != null && (
        <div
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:border-violet-800/60 dark:bg-violet-500/10 dark:text-violet-100"
          data-testid="msel-map-placement-banner"
        >
          Click the map to place Inject {activePlacementInjectId}.
        </div>
      )}
      <FunctionalMselInjectsEditor
        {...props}
        renderInjectSummarySuffix={(inject) => {
          const sentCount = deliveryCountByInjectId[inject.id] ?? 0
          return (
            <>
              {inject.mapLocation ? (
                <span>
                  {' '}
                  · {inject.mapLocation[1].toFixed(4)}, {inject.mapLocation[0].toFixed(4)}
                </span>
              ) : null}
              {sentCount > 0 ? (
                <span>{` · Sent ×${sentCount}`}</span>
              ) : null}
            </>
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
            <Button
              type="button"
              variant={inject.mapLocation ? 'secondary' : 'outline'}
              size="icon"
              aria-label={
                inject.mapLocation
                  ? `Focus inject ${inject.id} on map`
                  : `Place inject ${inject.id} on map`
              }
              data-testid={`msel-inject-map-button-${inject.id}`}
              className={cn(
                activePlacementInjectId === inject.id && 'ring-2 ring-violet-500 ring-offset-2'
              )}
              onClick={() => {
                if (inject.mapLocation) {
                  onFocusOnMap(inject)
                  return
                }
                onStartPlacement(inject.id)
              }}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </>
        )}
      />
    </>
  )
}
