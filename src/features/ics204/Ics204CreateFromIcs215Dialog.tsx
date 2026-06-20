import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Ics215AssigneeWithWorkOption } from '@/features/ics204/create-from-ics215'
import { cn } from '@/lib/utils'

type Ics204CreateFromIcs215DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: Ics215AssigneeWithWorkOption[]
  hasUnsavedIcs215Edits?: boolean
  onSelect: (assignee: string) => void
}

export function Ics204CreateFromIcs215Dialog({
  open,
  onOpenChange,
  options,
  hasUnsavedIcs215Edits = false,
  onSelect,
}: Ics204CreateFromIcs215DialogProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.preview.toLowerCase().includes(normalizedQuery)
    )
  }, [normalizedQuery, options])

  const selectableCount = options.filter((option) => !option.disabled).length

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuery('')
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create ICS-204 from ICS-215</DialogTitle>
          <DialogDescription>
            Select a roster position with work assignments on the latest ICS-215. A new draft
            ICS-204 will be created for that unit.
            {hasUnsavedIcs215Edits ? (
              <span className="mt-2 block text-amber-700 dark:text-amber-300">
                Uses current ICS-215 edits, including any unsaved work-assignment changes.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {options.length > 5 ? (
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search positions…"
            className="h-8 text-xs"
          />
        ) : null}

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {options.length === 0
                ? 'No eligible positions with ICS-215 work assignments.'
                : 'No positions match your search.'}
            </p>
          ) : (
            <TooltipProvider delayDuration={150}>
              {filteredOptions.map((option) => {
                const button = (
                  <button
                    key={option.assignee}
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left transition-colors',
                      option.disabled
                        ? 'cursor-not-allowed border-dashed opacity-60'
                        : 'hover:border-primary hover:bg-muted/40'
                    )}
                    onClick={() => {
                      if (option.disabled) return
                      onSelect(option.assignee)
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{option.preview}</p>
                      </div>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {option.rowCount} {option.rowCount === 1 ? 'row' : 'rows'}
                      </span>
                    </div>
                  </button>
                )

                if (!option.disabled || !option.disabledReason) return button

                return (
                  <Tooltip key={option.assignee}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>{option.disabledReason}</TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectableCount} of {options.length} position
            {options.length === 1 ? '' : 's'} available
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
