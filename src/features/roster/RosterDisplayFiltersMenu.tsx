import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'

type RosterDisplayFiltersMenuProps = {
  filters: RosterDisplayFilters
  onChange: (filters: RosterDisplayFilters) => void
}

const FILTER_OPTIONS: Array<{
  key: keyof RosterDisplayFilters
  label: string
}> = [
  { key: 'showPositionsWithCurrentAssignees', label: 'Show Positions With Current Assignees' },
  { key: 'showPositionsWithoutCurrentAssignees', label: 'Show Positions Without Current Assignees' },
  { key: 'showPositionsWithScheduledAssignees', label: 'Show Positions With Scheduled Assignees' },
  {
    key: 'showPositionsWithoutScheduledAssignees',
    label: 'Show Positions Without Scheduled Assignees',
  },
  { key: 'showCurrentSingleResources', label: 'Show Current Single Resources' },
  { key: 'showScheduledSingleResources', label: 'Show Scheduled Single Resources' },
]

function filtersAreDefault(filters: RosterDisplayFilters): boolean {
  return FILTER_OPTIONS.every(({ key }) => filters[key] === DEFAULT_ROSTER_DISPLAY_FILTERS[key])
}

export function RosterDisplayFiltersMenu({ filters, onChange }: RosterDisplayFiltersMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={filtersAreDefault(filters) ? 'outline' : 'secondary'}
          size="sm"
          className="gap-1.5 text-xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Roster display</p>
          <p className="text-xs text-muted-foreground">
            Scheduled assignees are next operational period ICS position assignments.
          </p>
        </div>
        <div className="space-y-2">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-2">
              <Checkbox
                id={`roster-display-${key}`}
                checked={filters[key]}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    [key]: checked === true,
                  })
                }
              />
              <Label htmlFor={`roster-display-${key}`} className="text-xs font-normal leading-snug">
                {label}
              </Label>
            </div>
          ))}
        </div>
        {!filtersAreDefault(filters) ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => onChange(DEFAULT_ROSTER_DISPLAY_FILTERS)}
          >
            Reset to show all
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
