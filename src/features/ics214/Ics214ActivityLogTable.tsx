import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Ics214ActivityLogRow } from '@/features/ics214/types'
import {
  filterIcs214ActivityLogEntries,
  getDistinctCompletedByValues,
} from '@/features/ics214/utils'
import { cn } from '@/lib/utils'
import { Ics214FieldLabel, Ics214ReadOnlyField, Ics214ReadOnlyTextBlock } from '@/features/ics214/Ics214SectionToolbar'

type Ics214ActivityLogTableProps = {
  entries: Ics214ActivityLogRow[]
  isEditing: boolean
  showFilters: boolean
  onPatchRow?: (rowId: number, field: keyof Ics214ActivityLogRow, value: string) => void
  onDeleteRow?: (rowId: number) => void
}

export function Ics214ActivityLogTable({
  entries,
  isEditing,
  showFilters,
  onPatchRow,
  onDeleteRow,
}: Ics214ActivityLogTableProps) {
  const [completedByFilter, setCompletedByFilter] = useState('all')
  const [completedAtFilter, setCompletedAtFilter] = useState('')
  const [notableActivitiesSearch, setNotableActivitiesSearch] = useState('')

  const completedByOptions = useMemo(() => getDistinctCompletedByValues(entries), [entries])

  const filteredEntries = useMemo(
    () =>
      filterIcs214ActivityLogEntries(entries, {
        completedBy: completedByFilter,
        completedAt: completedAtFilter,
        notableActivitiesSearch,
      }),
    [completedAtFilter, completedByFilter, entries, notableActivitiesSearch]
  )

  const hasActiveFilters =
    completedByFilter !== 'all' ||
    completedAtFilter.length > 0 ||
    notableActivitiesSearch.trim().length > 0

  const clearFilters = () => {
    setCompletedByFilter('all')
    setCompletedAtFilter('')
    setNotableActivitiesSearch('')
  }

  return (
    <div className="space-y-2">
      {showFilters ? (
        <div className="rounded-md border bg-muted/20 p-2.5">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="space-y-1">
              <Ics214FieldLabel>Filter by Completed By</Ics214FieldLabel>
              <Select value={completedByFilter} onValueChange={setCompletedByFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {completedByOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Ics214FieldLabel>Filter by Completed At</Ics214FieldLabel>
              <Input
                type="date"
                value={completedAtFilter}
                onChange={(event) => setCompletedAtFilter(event.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Ics214FieldLabel>Search Notable Activities</Ics214FieldLabel>
              <Input
                value={notableActivitiesSearch}
                onChange={(event) => setNotableActivitiesSearch(event.target.value)}
                placeholder="Search activity text…"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Showing {filteredEntries.length} of {entries.length} entries
            </span>
            {hasActiveFilters ? (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,2fr)_auto] gap-2 border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Completed By</span>
          <span>Completed At</span>
          <span>Notable Activities</span>
          <span />
        </div>
        {filteredEntries.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            {entries.length === 0 ? 'No activity log entries recorded.' : 'No entries match the current filters.'}
          </p>
        ) : (
          filteredEntries.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                'grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,2fr)_auto] items-start gap-2 px-3 py-2',
                index % 2 === 1 && 'bg-muted/20'
              )}
            >
              {isEditing ? (
                <>
                  <input
                    value={row.completedBy}
                    onChange={(event) => onPatchRow?.(row.id, 'completedBy', event.target.value)}
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                    placeholder="Name or unit"
                  />
                  <input
                    type="datetime-local"
                    value={row.completedAt}
                    onChange={(event) => onPatchRow?.(row.id, 'completedAt', event.target.value)}
                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                  />
                  <Textarea
                    value={row.notableActivities}
                    onChange={(event) =>
                      onPatchRow?.(row.id, 'notableActivities', event.target.value)
                    }
                    className="min-h-8 text-xs"
                    placeholder="Describe notable activities"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete activity log row"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDeleteRow?.(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Ics214ReadOnlyField value={row.completedBy} />
                  <Ics214ReadOnlyField value={row.completedAt} />
                  <Ics214ReadOnlyTextBlock value={row.notableActivities} />
                  <span />
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
