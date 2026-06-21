import { SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  ROSTER_DISPLAY_FILTER_LABELS,
  summarizeActiveDisplayFilters,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'
import { cn } from '@/lib/utils'

type RosterDisplayFiltersMenuProps = {
  filters: RosterDisplayFilters
  onChange: (filters: RosterDisplayFilters) => void
}

const FILTER_OPTIONS = (
  Object.keys(ROSTER_DISPLAY_FILTER_LABELS) as (keyof RosterDisplayFilters)[]
).map((key) => ({
  key,
  label: ROSTER_DISPLAY_FILTER_LABELS[key],
}))

export function RosterDisplayFiltersMenu({ filters, onChange }: RosterDisplayFiltersMenuProps) {
  const summary = summarizeActiveDisplayFilters(filters)
  const filterStatusLabel = `${summary.activeCount} of ${summary.totalCount} display filters active`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={summary.isDefault ? 'outline' : 'secondary'}
          size="sm"
          className="gap-1.5 text-xs"
          aria-label={summary.isDefault ? 'Roster display filters' : filterStatusLabel}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Display
          {!summary.isDefault ? (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal">
              {summary.activeCount}/{summary.totalCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Roster display</p>
          <p className="text-xs text-muted-foreground">
            Scheduled assignees are next operational period ICS position assignments.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <Badge
              key={key}
              variant={filters[key] ? 'default' : 'outline'}
              className={cn(
                'text-[10px] font-normal',
                !filters[key] && 'text-muted-foreground line-through'
              )}
            >
              {label}
            </Badge>
          ))}
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
        {!summary.isDefault ? (
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
