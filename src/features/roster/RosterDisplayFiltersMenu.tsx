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
  ROSTER_ORG_CHART_SECTION_FILTER_KEYS,
  ROSTER_ORG_CHART_SECTION_LABELS,
  type RosterOrgChartSectionKey,
} from '@/features/roster/roster-org-chart-sections'
import {
  DEFAULT_ROSTER_DISPLAY_FILTERS,
  ROSTER_DISPLAY_FILTER_LABELS,
  summarizeActiveDisplayFilters,
  type RosterDisplayFilters,
} from '@/features/roster/roster-display-filters'

type RosterDisplayFiltersMenuProps = {
  filters: RosterDisplayFilters
  onChange: (filters: RosterDisplayFilters) => void
}

const ASSIGNEE_FILTER_OPTIONS = (
  Object.keys(ROSTER_DISPLAY_FILTER_LABELS) as (keyof typeof ROSTER_DISPLAY_FILTER_LABELS)[]
).map((key) => ({
  key,
  label: ROSTER_DISPLAY_FILTER_LABELS[key],
}))

const SECTION_FILTER_OPTIONS = (
  Object.keys(ROSTER_ORG_CHART_SECTION_LABELS) as RosterOrgChartSectionKey[]
).map((section) => ({
  key: ROSTER_ORG_CHART_SECTION_FILTER_KEYS[section],
  label: ROSTER_ORG_CHART_SECTION_LABELS[section],
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
      <PopoverContent align="end" className="max-h-[min(32rem,calc(100vh-8rem))] w-80 space-y-3 overflow-y-auto p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Roster display</p>
          <p className="text-xs text-muted-foreground">
            Scheduled assignees are next operational period ICS position assignments.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Assignees & single resources
          </p>
          {ASSIGNEE_FILTER_OPTIONS.map(({ key, label }) => (
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
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Org chart sections
          </p>
          {SECTION_FILTER_OPTIONS.map(({ key, label }) => (
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
