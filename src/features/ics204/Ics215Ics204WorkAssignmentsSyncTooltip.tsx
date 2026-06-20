import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Ics215Ics204WorkSyncTooltipState } from '@/features/ics204/sync-ics215-work-assignments'
import { cn } from '@/lib/utils'

type Ics215Ics204WorkAssignmentsSyncTooltipProps = {
  context: 'ics215' | 'ics204'
  state: Ics215Ics204WorkSyncTooltipState
  className?: string
}

function buildTooltipMessage(
  context: 'ics215' | 'ics204',
  state: Ics215Ics204WorkSyncTooltipState
): string {
  const linkedUnits =
    state.linkedUnitLabels.length > 0 ? state.linkedUnitLabels.join(', ') : null

  if (context === 'ics215') {
    if (state.linked && linkedUnits) {
      return `Saving syncs work assignments to linked ICS-204 lists for: ${linkedUnits}.`
    }
    return 'Saving updates ICS-215 only. Create ICS-204 from ICS-215 to link assignment lists.'
  }

  if (state.linked) {
    return 'Synced with ICS-215. Saving updates this unit’s rows on the operational planning worksheet.'
  }

  return 'Not linked to ICS-215. Assign a unit with work on ICS-215, or use Create from ICS-215.'
}

export function Ics215Ics204WorkAssignmentsSyncTooltip({
  context,
  state,
  className,
}: Ics215Ics204WorkAssignmentsSyncTooltipProps) {
  const message = buildTooltipMessage(context, state)

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
              className
            )}
            aria-label="Work assignment sync information"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{message}</p>
          {state.peerHasUnsavedEdits && state.peerUnsavedMessage ? (
            <p className="mt-2 text-amber-700 dark:text-amber-300">{state.peerUnsavedMessage}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
