import { useMemo } from 'react'
import type { Ics234ObjectiveRow } from '@/features/ics234/types'
import type { Ics234TacticRef } from '@/features/ics215/types'
import {
  flattenIcs234Tactics,
  ics234TacticRefKey,
  parseIcs234TacticRefKey,
  resolveIcs234TacticLabel,
} from '@/features/ics215/resolve-ics234-tactic'
import { cn } from '@/lib/utils'

type Ics215TacticCellProps = {
  tacticRef: Ics234TacticRef | null | undefined
  objectives: Ics234ObjectiveRow[]
  editing: boolean
  className?: string
  onChange: (ref: Ics234TacticRef | null) => void
}

export function Ics215TacticCell({
  tacticRef,
  objectives,
  editing,
  className,
  onChange,
}: Ics215TacticCellProps) {
  const options = useMemo(() => flattenIcs234Tactics(objectives), [objectives])
  const { label, stale } = resolveIcs234TacticLabel(objectives, tacticRef)
  const currentKey = tacticRef ? ics234TacticRefKey(tacticRef) : ''

  if (!editing) {
    if (!tacticRef) {
      return <span className={cn('text-xs text-muted-foreground', className)}>—</span>
    }
    return (
      <p
        className={cn(
          'whitespace-pre-wrap text-xs leading-relaxed',
          stale && 'italic text-muted-foreground',
          className
        )}
      >
        {label}
      </p>
    )
  }

  return (
    <select
      value={currentKey}
      onChange={(event) => {
        const nextKey = event.target.value
        if (!nextKey) {
          onChange(null)
          return
        }
        onChange(parseIcs234TacticRefKey(nextKey))
      }}
      className={cn(
        'h-8 w-full min-w-[6rem] rounded-md border bg-transparent px-1 text-xs outline-none',
        className
      )}
      aria-label="Link work assignment to ICS-234 tactic"
    >
      <option value="">None</option>
      {options.map((option) => (
        <option key={ics234TacticRefKey(option.ref)} value={ics234TacticRefKey(option.ref)}>
          {option.breadcrumb} — {option.label}
        </option>
      ))}
    </select>
  )
}
