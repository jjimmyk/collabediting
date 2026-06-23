import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Ics215WorkAssignmentsLayoutMode } from '@/features/ics215/types'

type Ics215WorkAssignmentsLayoutToggleProps = {
  value: Ics215WorkAssignmentsLayoutMode
  onChange: (mode: Ics215WorkAssignmentsLayoutMode) => void
  disabled?: boolean
}

export function Ics215WorkAssignmentsLayoutToggle({
  value,
  onChange,
  disabled = false,
}: Ics215WorkAssignmentsLayoutToggleProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next === 'spreadsheet' || next === 'legacy') {
            onChange(next)
          }
        }}
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-label="Work assignments table layout"
      >
        <ToggleGroupItem value="spreadsheet" className="px-2.5 text-[11px]">
          Spreadsheet Layout
        </ToggleGroupItem>
        <ToggleGroupItem value="legacy" className="px-2.5 text-[11px]">
          Legacy ICS Layout
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-[10px] text-muted-foreground">
        Export uses legacy ICS layout.
      </p>
    </div>
  )
}
