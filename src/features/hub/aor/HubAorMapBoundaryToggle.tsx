import { Checkbox } from '@/components/ui/checkbox'
import { getHubAorBoundaryCheckState } from './hub-aor-boundary-geometries'

type HubAorMapBoundaryToggleProps = {
  boundaryId: string
  enabledBoundaryIds: Set<string>
  ariaLabel: string
  onToggleBoundary: (boundaryId: string, checked: boolean) => void
}

export function HubAorMapBoundaryToggle({
  boundaryId,
  enabledBoundaryIds,
  ariaLabel,
  onToggleBoundary,
}: HubAorMapBoundaryToggleProps) {
  const checkState = getHubAorBoundaryCheckState(boundaryId, enabledBoundaryIds)

  return (
    <Checkbox
      checked={checkState}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={(value) => onToggleBoundary(boundaryId, value === true)}
    />
  )
}
