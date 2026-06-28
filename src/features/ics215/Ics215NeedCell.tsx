import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  canOpenNeedAssetRequest,
  isNeedLinkedToAssetRequest,
  resolveNeedDisplayValue,
} from '@/features/ics215/ics215-need-asset-request-link'
import type { Ics215ResourceValue } from '@/features/ics215/types'
import { cn } from '@/lib/utils'

type Ics215NeedCellProps = {
  value: Ics215ResourceValue
  editing: boolean
  canLinkAssetRequests?: boolean
  disabled?: boolean
  columnLabel: string
  onOpenAssetRequest: () => void
}

export function NeedAssetRequestSparkleButton({
  columnLabel,
  disabled,
  linked,
  onOpenAssetRequest,
}: {
  columnLabel: string
  disabled?: boolean
  linked?: boolean
  onOpenAssetRequest: () => void
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || columnLabel.trim().length < 2}
            aria-label={
              linked
                ? `View or edit asset request linked to Need for ${columnLabel}`
                : `Create asset request for Need on ${columnLabel}`
            }
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onOpenAssetRequest()
            }}
          >
            <FilePlus className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {linked
            ? `View or edit asset request linked to Need for “${columnLabel.trim() || 'resource'}”.`
            : `Create asset request for Need on “${columnLabel.trim() || 'resource'}”.`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function Ics215NeedCell({
  value,
  editing,
  canLinkAssetRequests = false,
  disabled = false,
  columnLabel,
  onOpenAssetRequest,
}: Ics215NeedCellProps) {
  const linked = isNeedLinkedToAssetRequest(value)
  const displayValue = resolveNeedDisplayValue(value)
  const canOpen = canOpenNeedAssetRequest(value)
  const showSparkle = canLinkAssetRequests && (linked || canOpen)

  if (!editing) {
    if (linked && displayValue.length > 0) {
      return (
        <div className="flex items-center gap-0.5">
          {showSparkle ? (
            <NeedAssetRequestSparkleButton
              columnLabel={columnLabel}
              disabled={disabled}
              linked
              onOpenAssetRequest={onOpenAssetRequest}
            />
          ) : null}
          <button
            type="button"
            className={cn(
              'min-w-0 flex-1 rounded px-1 py-1 text-left text-[11px] leading-tight underline decoration-dotted underline-offset-2',
              'hover:bg-muted/40'
            )}
            title={`${displayValue} linked — click to view request`}
            onClick={onOpenAssetRequest}
          >
            {displayValue}
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-0.5">
        {showSparkle ? (
          <NeedAssetRequestSparkleButton
            columnLabel={columnLabel}
            disabled={disabled || !canOpen}
            onOpenAssetRequest={onOpenAssetRequest}
          />
        ) : null}
        <span className="block min-w-0 flex-1 px-1 py-1 text-[11px] leading-tight text-muted-foreground">
          {displayValue.length > 0 ? displayValue : '—'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {showSparkle ? (
        <NeedAssetRequestSparkleButton
          columnLabel={columnLabel}
          disabled={disabled || (!linked && !canOpen)}
          linked={linked}
          onOpenAssetRequest={onOpenAssetRequest}
        />
      ) : null}
      <span
        title={linked ? 'Linked asset request' : 'Need (Required − Have)'}
        className={cn(
          'flex h-7 min-w-0 flex-1 items-center rounded border px-1 text-[11px]',
          linked
            ? 'border-primary/40 bg-primary/5 text-foreground'
            : 'border-transparent bg-muted/20 text-muted-foreground'
        )}
      >
        {displayValue.length > 0 ? displayValue : '—'}
      </span>
    </div>
  )
}
