import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ActivationAorOptionList } from '@/features/activation/ActivationAorOptionList'
import {
  buildHubAorProfileOptions,
  filterHubAorProfileOptions,
  resolveHubAorProfileNodeLabel,
} from '@/features/hub/aor/hub-aor-profile-options'
import type { WorkspaceLocationMethod } from '@/features/workspace-settings/types'
import { CREATE_ACTIVATION_PORTAL_Z_CLASS } from '@/lib/create-activation-navigation'
import { cn } from '@/lib/utils'

type ActivationLocationFieldsProps = {
  locationMethod: string
  onLocationMethodChange: (method: WorkspaceLocationMethod) => void
  address: string
  onAddressChange: (address: string) => void
  aorNodeId: string | null
  onAorNodeIdChange: (nodeId: string | null) => void
  geometrySummary: string
  onRestartDraw?: () => void
}

export function ActivationLocationFields({
  locationMethod,
  onLocationMethodChange,
  address,
  onAddressChange,
  aorNodeId,
  onAorNodeIdChange,
  geometrySummary,
  onRestartDraw,
}: ActivationLocationFieldsProps) {
  const [aorSearchQuery, setAorSearchQuery] = useState('')
  const [isAorPickerOpen, setIsAorPickerOpen] = useState(false)
  const aorOptions = useMemo(() => buildHubAorProfileOptions(), [])
  const filteredAorOptions = useMemo(
    () => filterHubAorProfileOptions(aorOptions, aorSearchQuery),
    [aorOptions, aorSearchQuery]
  )
  const selectedAorLabel = resolveHubAorProfileNodeLabel(aorNodeId)

  return (
    <div className="grid gap-2">
      <Label htmlFor="incident-location">Location</Label>
      <NativeSelect
        id="incident-location"
        value={locationMethod}
        onChange={(event) =>
          onLocationMethodChange(event.target.value as WorkspaceLocationMethod)
        }
        className="w-full"
      >
        <NativeSelectOption value="">Select location method</NativeSelectOption>
        <NativeSelectOption value="draw-point">Draw Point</NativeSelectOption>
        <NativeSelectOption value="draw-polygon">Draw Polygon</NativeSelectOption>
        <NativeSelectOption value="enter-address">Enter Address</NativeSelectOption>
        <NativeSelectOption value="select-aor">Select AOR</NativeSelectOption>
      </NativeSelect>

      {locationMethod === 'enter-address' && (
        <Input
          value={address}
          onChange={(event) => onAddressChange(event.target.value)}
          placeholder="Street address, city, state"
        />
      )}

      {locationMethod === 'select-aor' && (
        <div className="space-y-2 rounded-md border bg-muted/10 p-2">
          <div className="flex items-center gap-2">
            <Popover
              open={isAorPickerOpen}
              onOpenChange={(open) => {
                setIsAorPickerOpen(open)
                if (!open) {
                  setAorSearchQuery('')
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-0 flex-1 justify-between font-normal"
                >
                  <span className="truncate text-left">
                    {selectedAorLabel ?? 'Select AOR…'}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className={cn('w-[var(--radix-popover-trigger-width)] p-2', CREATE_ACTIVATION_PORTAL_Z_CLASS)}
              >
                <Input
                  value={aorSearchQuery}
                  placeholder="Search Areas of Responsibility"
                  className="mb-2 h-8 text-xs"
                  onChange={(event) => setAorSearchQuery(event.target.value)}
                />
                <div className="max-h-48 overflow-y-auto">
                  <ActivationAorOptionList
                    options={filteredAorOptions}
                    selectedIds={aorNodeId ? [aorNodeId] : []}
                    onToggle={(nodeId) => {
                      onAorNodeIdChange(nodeId)
                      setIsAorPickerOpen(false)
                      setAorSearchQuery('')
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
            {aorNodeId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 shrink-0 px-2 text-xs"
                onClick={() => onAorNodeIdChange(null)}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {geometrySummary &&
        (locationMethod === 'draw-point' || locationMethod === 'draw-polygon') && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{geometrySummary}</p>
            {onRestartDraw ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onRestartDraw}
              >
                Edit location
              </Button>
            ) : null}
          </div>
        )}

      {geometrySummary && locationMethod === 'select-aor' && (
        <p className="text-xs text-muted-foreground">{geometrySummary}</p>
      )}
    </div>
  )
}
