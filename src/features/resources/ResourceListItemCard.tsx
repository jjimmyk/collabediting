import { useState } from 'react'
import { ChevronDown, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  formatResourceCostPerUnit,
  formatResourceCostUnitType,
  getResourceIncidentAssignmentLabel,
} from '@/features/resources/utils'
import { cn } from '@/lib/utils'

type ResourceListItemCardProps = {
  resource: ResourceListItemData
  glassItemBorderClasses: string
  selected?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onHeaderClick?: () => void
  onFocusMap?: () => void
  showMapAction?: boolean
}

export function ResourceListItemCard({
  resource,
  glassItemBorderClasses,
  selected = false,
  open,
  defaultOpen = false,
  onOpenChange,
  onHeaderClick,
  onFocusMap,
  showMapAction = true,
}: ResourceListItemCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const assignmentLabel = getResourceIncidentAssignmentLabel(resource)

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <Item
      variant="outline"
      className={cn(
        'flex-col items-stretch p-0',
        glassItemBorderClasses,
        selected && 'ring-2 ring-primary/60 bg-primary/5'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5',
            onHeaderClick && 'cursor-pointer'
          )}
          onClick={onHeaderClick}
        >
          <ItemContent>
            <ItemTitle>{resource.name}</ItemTitle>
            {assignmentLabel ? <ItemDescription>{assignmentLabel}</ItemDescription> : null}
          </ItemContent>
          <ItemActions>
            {showMapAction && onFocusMap ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom map to asset"
                onClick={(event) => {
                  event.stopPropagation()
                  onFocusMap()
                }}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            ) : null}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle asset details"
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
        </div>
        <CollapsibleContent>
          <div className="border-t px-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p>
                <span className="font-medium">Current Location:</span> {resource.currentLocation}
              </p>
              <p>
                <span className="font-medium">Datetime Ordered:</span> {resource.datetimeOrdered}
              </p>
              <p>
                <span className="font-medium">OPCON:</span> {resource.opcon}
              </p>
              <p>
                <span className="font-medium">TACON:</span> {resource.tacon}
              </p>
              <p>
                <span className="font-medium">Point of Contact:</span> {resource.pointOfContact}
              </p>
              <p>
                <span className="font-medium">Owning Organization:</span>{' '}
                {resource.owningOrganization}
              </p>
              <p>
                <span className="font-medium">Quantity:</span> {resource.quantity}
              </p>
              <p>
                <span className="font-medium">Unit:</span> {resource.unit}
              </p>
              <p>
                <span className="font-medium">Cost Unit Type:</span>{' '}
                {formatResourceCostUnitType(resource.costUnitType)}
              </p>
              <p>
                <span className="font-medium">Cost per Unit:</span>{' '}
                {formatResourceCostPerUnit(resource.costPerUnit)}
              </p>
              <p>
                <span className="font-medium">Hull/Tail Number:</span> {resource.hullTailNumber}
              </p>
              <p>
                <span className="font-medium">Symbology:</span> {resource.symbology}
              </p>
              <p>
                <span className="font-medium">Lat:</span> {resource.latitude}
              </p>
              <p>
                <span className="font-medium">Long:</span> {resource.longitude}
              </p>
              <p className="col-span-2">
                <span className="font-medium">Capabilities:</span> {resource.capabilities}
              </p>
              <p>
                <span className="font-medium">Current Op Period:</span> {resource.currentOpPeriod}
              </p>
              <p>
                <span className="font-medium">Next Op Period:</span> {resource.nextOpPeriod}
              </p>
              <p>
                <span className="font-medium">Current Op Period Assignment:</span>{' '}
                {resource.currentOpPeriodAssignment}
              </p>
              <p>
                <span className="font-medium">Next Op Period Assignment:</span>{' '}
                {resource.nextOpPeriodAssignment}
              </p>
              <p>
                <span className="font-medium">Check-in Status:</span> {resource.checkInStatus}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Item>
  )
}
