import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PositionOpAdvanceLabel } from '@/lib/operational-period-roster-types'
import type { WorkspacePositionMeta } from '@/features/roster/workspace-positions'

type PositionOpAdvanceLabelSelectProps = {
  positionName: string
  meta: WorkspacePositionMeta | undefined
  value: PositionOpAdvanceLabel
  disabled?: boolean
  onChange: (label: PositionOpAdvanceLabel) => void
}

const LABEL_OPTIONS: Array<{ value: PositionOpAdvanceLabel; label: string }> = [
  { value: null, label: 'None' },
  { value: 'retire_on_op_advance', label: 'Retire next OP period' },
]

export function PositionOpAdvanceLabelSelect({
  positionName,
  meta,
  value,
  disabled = false,
  onChange,
}: PositionOpAdvanceLabelSelectProps) {
  if (!meta || meta.isArchived) {
    return null
  }

  if (meta.isPlanned) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Create on OP advance
      </p>
    )
  }

  if (meta.source === 'standard' || meta.isOnOrgChart) {
    return (
      <Select
        value={value ?? 'none'}
        disabled={disabled}
        onValueChange={(nextValue) => {
          onChange(nextValue === 'none' ? null : 'retire_on_op_advance')
        }}
      >
        <SelectTrigger
          id={`op-advance-label-${positionName}`}
          className="h-8 w-full max-w-[12rem] text-xs"
          aria-label={`Operational period label for ${positionName}`}
        >
          <SelectValue placeholder="OP advance label" />
        </SelectTrigger>
        <SelectContent>
          {LABEL_OPTIONS.map((option) => (
            <SelectItem
              key={option.value ?? 'none'}
              value={option.value ?? 'none'}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return null
}
