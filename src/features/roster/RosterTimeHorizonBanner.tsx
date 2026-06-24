import { CalendarClock } from 'lucide-react'

export function RosterTimeHorizonBanner() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-0.5">
        <p className="font-medium">Projected roster for next operational period</p>
        <p className="text-muted-foreground">
          Includes scheduled positions, assignees, single resources, and org chart assets. Retiring
          positions and scheduled departures are excluded.
        </p>
      </div>
    </div>
  )
}
