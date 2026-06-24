import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { isHaveLinkedToAssets } from '@/features/ics215/ics215-have-asset-link'
import type { Ics215ResourceValue } from '@/features/ics215/types'
import { cn } from '@/lib/utils'

type Ics215HaveCellProps = {
  value: Ics215ResourceValue
  editing: boolean
  canLinkAssets?: boolean
  disabled?: boolean
  columnLabel: string
  onManualChange: (have: string) => void
  onOpenLinkDialog: () => void
}

export function HaveLinkSparkleButton({
  columnLabel,
  disabled,
  onOpenLinkDialog,
}: {
  columnLabel: string
  disabled?: boolean
  onOpenLinkDialog: () => void
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
            aria-label={`Link assets to Have for ${columnLabel}`}
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation()
              onOpenLinkDialog()
            }}
          >
            <Sparkles className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Link workspace assets to Have for “{columnLabel.trim() || 'resource'}”.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function Ics215HaveCell({
  value,
  editing,
  canLinkAssets = false,
  disabled = false,
  columnLabel,
  onManualChange,
  onOpenLinkDialog,
}: Ics215HaveCellProps) {
  const linked = isHaveLinkedToAssets(value)
  const displayValue = value.have.trim()
  const showLinkSparkle = editing || canLinkAssets

  if (!editing) {
    if (linked && displayValue.length > 0) {
      return (
        <div className="flex items-center gap-0.5">
          {showLinkSparkle ? (
            <HaveLinkSparkleButton
              columnLabel={columnLabel}
              disabled={disabled}
              onOpenLinkDialog={onOpenLinkDialog}
            />
          ) : null}
          <button
            type="button"
            className={cn(
              'min-w-0 flex-1 rounded px-1 py-1 text-left text-[11px] leading-tight underline decoration-dotted underline-offset-2',
              'hover:bg-muted/40'
            )}
            title={`${displayValue} assets linked — click to review`}
            onClick={onOpenLinkDialog}
          >
            {displayValue}
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-0.5">
        {showLinkSparkle ? (
          <HaveLinkSparkleButton
            columnLabel={columnLabel}
            disabled={disabled}
            onOpenLinkDialog={onOpenLinkDialog}
          />
        ) : null}
        <span className="block min-w-0 flex-1 px-1 py-1 text-[11px] leading-tight">
          {displayValue.length > 0 ? displayValue : '—'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      <HaveLinkSparkleButton
        columnLabel={columnLabel}
        disabled={disabled}
        onOpenLinkDialog={onOpenLinkDialog}
      />
      <input
        value={value.have}
        onChange={(event) => onManualChange(event.target.value)}
        onClick={(event) => {
          if (linked) {
            event.stopPropagation()
            onOpenLinkDialog()
          }
        }}
        placeholder="H"
        title={linked ? 'Linked assets — click to review' : 'Have'}
        className={cn(
          'h-7 min-w-0 flex-1 rounded border bg-transparent px-1 text-[11px] outline-none',
          linked && 'border-primary/40 bg-primary/5'
        )}
      />
    </div>
  )
}

export function useHaveLinkSelection(
  suggestedKeys: string[],
  initialSelectedKeys: string[]
): [Set<string>, (key: string) => void, (keys: string[]) => void] {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set(initialSelectedKeys))

  useEffect(() => {
    setSelectedKeys(new Set(initialSelectedKeys))
  }, [initialSelectedKeys.join('|')])

  const toggleKey = (key: string) => {
    setSelectedKeys((previous) => {
      const next = new Set(previous)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const setKeys = (keys: string[]) => {
    setSelectedKeys(new Set(keys))
  }

  return [selectedKeys, toggleKey, setKeys]
}

export function mergeSuggestedSelection(
  suggestedKeys: string[],
  initialSelectedKeys: string[],
  mode: 'create' | 'review'
): string[] {
  if (mode === 'review') {
    return initialSelectedKeys
  }
  if (initialSelectedKeys.length > 0) {
    return initialSelectedKeys
  }
  return suggestedKeys
}
