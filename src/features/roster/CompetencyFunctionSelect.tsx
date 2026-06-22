import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ADD_NEW_VALUE = '__add_new__'
const CLEAR_VALUE = '__clear__'

type CompetencyFunctionSelectProps = {
  value: string | null
  options: string[]
  disabled?: boolean
  compact?: boolean
  isUpdating?: boolean
  onChange: (value: string | null) => void
}

export function CompetencyFunctionSelect({
  value,
  options,
  disabled = false,
  compact = false,
  isUpdating = false,
  onChange,
}: CompetencyFunctionSelectProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const sortedOptions = useMemo(() => {
    const merged = new Set<string>()
    for (const option of options) {
      const trimmed = option.trim()
      if (trimmed.length > 0) merged.add(trimmed)
    }
    if (value?.trim()) merged.add(value.trim())
    return [...merged].sort((a, b) => a.localeCompare(b))
  }, [options, value])

  const selectValue = value?.trim() ? value.trim() : CLEAR_VALUE

  if (isAdding) {
    return (
      <div className={compact ? 'flex min-w-[10rem] items-center gap-1.5' : 'space-y-1.5'}>
        {!compact ? (
          <Label className="text-[10px] text-muted-foreground">Competency/Function</Label>
        ) : null}
        <Input
          value={draft}
          disabled={disabled || isUpdating}
          placeholder="Enter competency/function"
          className={compact ? 'h-7 text-[11px]' : 'h-8 text-xs'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              const trimmed = draft.trim()
              if (trimmed.length > 0) {
                onChange(trimmed)
                setIsAdding(false)
                setDraft('')
              }
            }
            if (event.key === 'Escape') {
              setIsAdding(false)
              setDraft('')
            }
          }}
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'}
            disabled={disabled || isUpdating || draft.trim().length === 0}
            onClick={() => {
              const trimmed = draft.trim()
              if (trimmed.length === 0) return
              onChange(trimmed)
              setIsAdding(false)
              setDraft('')
            }}
          >
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'}
            disabled={disabled || isUpdating}
            onClick={() => {
              setIsAdding(false)
              setDraft('')
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'min-w-[10rem]' : 'space-y-1.5'}>
      {!compact ? (
        <Label className="text-[10px] text-muted-foreground">Competency/Function</Label>
      ) : null}
      <Select
        value={selectValue}
        disabled={disabled || isUpdating}
        onValueChange={(next) => {
          if (next === ADD_NEW_VALUE) {
            setDraft(value?.trim() ?? '')
            setIsAdding(true)
            return
          }
          if (next === CLEAR_VALUE) {
            onChange(null)
            return
          }
          onChange(next)
        }}
      >
        <SelectTrigger className={compact ? 'h-7 text-[11px]' : 'h-8 text-xs'}>
          <SelectValue placeholder="Select competency/function" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR_VALUE}>None</SelectItem>
          {sortedOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          <SelectItem value={ADD_NEW_VALUE} className="font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add New
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
