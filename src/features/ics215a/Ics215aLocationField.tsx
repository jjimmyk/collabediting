import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics202FieldLabel,
  Ics202ReadOnlyField,
} from '@/features/ics202/Ics202SectionToolbar'
import {
  formatIcs215aLocationSummary,
  hasIcs215aLocationGeometry,
} from '@/features/ics215a/location-utils'
import type {
  Ics215aLocationMethod,
  Ics215aSafetyAnalysisLocation,
} from '@/features/ics215a/types'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

type Ics215aLocationFieldProps = {
  value: Ics215aSafetyAnalysisLocation
  onChange: (value: Ics215aSafetyAnalysisLocation) => void
  canEdit: boolean
  onZoomToMap?: () => void
  canZoom?: boolean
  isZoomTarget?: boolean
  isDrawingOnMap?: boolean
  onStartMapDraw?: (mode: 'point' | 'polygon') => void
}

export function Ics215aLocationField({
  value,
  onChange,
  canEdit,
  onZoomToMap,
  canZoom = false,
  isZoomTarget = false,
  isDrawingOnMap = false,
  onStartMapDraw,
}: Ics215aLocationFieldProps) {
  const patch = (patchValue: Partial<Ics215aSafetyAnalysisLocation>) => {
    onChange({ ...value, ...patchValue })
  }

  const isMapDrawMethod =
    value.method === 'draw-point' || value.method === 'draw-polygon'
  const zoomEnabled = canZoom && hasIcs215aLocationGeometry(value)

  return (
    <div className="space-y-1 xl:col-span-full">
      <Ics202FieldLabel>Location</Ics202FieldLabel>
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-8 w-8 shrink-0',
            isZoomTarget && 'border-primary text-primary'
          )}
          aria-label="Zoom to location on map"
          title={
            zoomEnabled
              ? 'Zoom to location on map'
              : 'Add coordinates or draw on map to zoom'
          }
          disabled={!zoomEnabled}
          onClick={() => onZoomToMap?.()}
        >
          <MapPin className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1 space-y-2">
          {canEdit ? (
            <>
              <NativeSelect
                value={value.method}
                onChange={(event) =>
                  patch({
                    method: event.target.value as Ics215aLocationMethod,
                  })
                }
                className="h-8 w-full text-xs"
              >
                <NativeSelectOption value="">Select location method</NativeSelectOption>
                <NativeSelectOption value="enter-address">Enter address</NativeSelectOption>
                <NativeSelectOption value="enter-coordinates">
                  Enter coordinates (point)
                </NativeSelectOption>
                <NativeSelectOption value="enter-polygon-coordinates">
                  Enter polygon coordinates
                </NativeSelectOption>
                <NativeSelectOption value="draw-point">Draw point on map</NativeSelectOption>
                <NativeSelectOption value="draw-polygon">Draw polygon on map</NativeSelectOption>
              </NativeSelect>

              {value.method === 'enter-address' && (
                <Input
                  value={value.address ?? ''}
                  onChange={(event) => patch({ address: event.target.value })}
                  placeholder="Street address, city, state"
                  className="h-8 text-xs"
                />
              )}

              {value.method === 'enter-coordinates' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={value.latitude ?? ''}
                    onChange={(event) => patch({ latitude: event.target.value })}
                    placeholder="Latitude"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={value.longitude ?? ''}
                    onChange={(event) => patch({ longitude: event.target.value })}
                    placeholder="Longitude"
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {value.method === 'enter-polygon-coordinates' && (
                <Textarea
                  value={value.polygonCoordinatesText ?? ''}
                  onChange={(event) =>
                    patch({ polygonCoordinatesText: event.target.value })
                  }
                  placeholder={'One vertex per line: lng, lat\n-95.3698, 29.7604\n...'}
                  className="min-h-20 text-xs font-mono"
                />
              )}

              {isMapDrawMethod && (
                <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  {isDrawingOnMap ? (
                    value.method === 'draw-point' ? (
                      <span>Click on the main map to place a point.</span>
                    ) : (
                      <span>
                        Click on the main map to start a polygon and double-click to finish.
                      </span>
                    )
                  ) : (
                    <span>Select a draw method to update location on the main map.</span>
                  )}
                  {onStartMapDraw && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="ml-1 h-auto p-0 text-xs"
                      onClick={() =>
                        onStartMapDraw(value.method === 'draw-polygon' ? 'polygon' : 'point')
                      }
                    >
                      {value.geometrySummary ? 'Edit on map' : 'Draw on map'}
                    </Button>
                  )}
                </div>
              )}

              {value.geometrySummary && isMapDrawMethod && (
                <p className="text-xs text-muted-foreground">{value.geometrySummary}</p>
              )}
            </>
          ) : (
            <Ics202ReadOnlyField value={formatIcs215aLocationSummary(value)} />
          )}
        </div>
      </div>
    </div>
  )
}
