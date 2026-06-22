import { useState } from 'react'
import { Clock3, Lock, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  formatOperationalPeriodLabel,
  formatOperationalPeriodStarterLabel,
  formatWorkingOperationalPeriodLabel,
} from '@/lib/operational-period-utils'
import type { OpAdvanceLifecycleSummary } from '@/lib/operational-period-roster-types'
import type { WorkspaceOperationalPeriod } from '@/lib/operational-period-types'

type OperationalPeriodSettingsSectionProps = {
  canEdit: boolean
  isSupabaseEnabled: boolean
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  periods: WorkspaceOperationalPeriod[]
  isLoadingPeriods?: boolean
  isStarting?: boolean
  startError?: string | null
  lifecycleSummary?: OpAdvanceLifecycleSummary | null
  onStartOperationalPeriod: () => Promise<{ ok: boolean; message?: string }>
}

export function OperationalPeriodSettingsSection({
  canEdit,
  isSupabaseEnabled,
  startedOperationalPeriodCount,
  workingOperationalPeriodNumber,
  periods,
  isLoadingPeriods = false,
  isStarting = false,
  startError = null,
  lifecycleSummary = null,
  onStartOperationalPeriod,
}: OperationalPeriodSettingsSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const nextPeriodNumber = startedOperationalPeriodCount + 1

  const handleConfirmStart = async () => {
    const result = await onStartOperationalPeriod()
    if (result.ok) {
      setConfirmOpen(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 border-t pt-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Operational Periods</h3>
        <p className="text-xs text-muted-foreground">
          Starting an operational period freezes all workspace ICS forms as a read-only snapshot,
          stamps operational period dates on eligible forms, and clones them into the next working
          period.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline">
          {formatWorkingOperationalPeriodLabel(workingOperationalPeriodNumber)} (editable)
        </Badge>
        {startedOperationalPeriodCount > 0 ? (
          <Badge variant="secondary">
            Latest started: {formatOperationalPeriodLabel(startedOperationalPeriodCount)}
          </Badge>
        ) : (
          <Badge variant="outline">No operational periods started yet</Badge>
        )}
      </div>

      {!isSupabaseEnabled ? (
        <p className="text-xs text-muted-foreground">
          Operational period tracking requires Supabase persistence.
        </p>
      ) : (
        <>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!canEdit || isStarting}
            data-uscg-tutorial="start-operational-period"
          >
            {isStarting
              ? 'Starting…'
              : `Start ${formatOperationalPeriodLabel(nextPeriodNumber)}`}
          </Button>
          {startError ? <p className="text-xs text-destructive">{startError}</p> : null}
        </>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Audit log
        </p>
        {isLoadingPeriods ? (
          <p className="text-xs text-muted-foreground">Loading operational periods…</p>
        ) : periods.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No operational periods have been started for this workspace yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...periods].reverse().map((period) => (
              <li
                key={period.id}
                className="rounded-md border px-3 py-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {formatOperationalPeriodLabel(period.periodNumber)} started
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(period.startedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1 text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  Started by {formatOperationalPeriodStarterLabel(period)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start {formatOperationalPeriodLabel(nextPeriodNumber)}?</DialogTitle>
            <DialogDescription>
              This will snapshot all workspace forms for{' '}
              {formatOperationalPeriodLabel(nextPeriodNumber)}, capture the current roster, apply any
              retire/create position labels, apply default 12-hour operational period timestamps to
              eligible forms, and begin{' '}
              {formatWorkingOperationalPeriodLabel(nextPeriodNumber + 1)} as the editable working
              set. Started periods cannot be edited.
            </DialogDescription>
          </DialogHeader>
          {lifecycleSummary ? (
            <div className="space-y-2 rounded-md border bg-muted/20 px-3 py-2 text-xs">
              <p className="font-medium">Roster position changes</p>
              {lifecycleSummary.retiring.length > 0 ? (
                <p>
                  <span className="font-medium">Retire:</span>{' '}
                  {lifecycleSummary.retiring.join(', ')}
                </p>
              ) : null}
              {lifecycleSummary.creating.length > 0 ? (
                <p>
                  <span className="font-medium">Create:</span>{' '}
                  {lifecycleSummary.creating.join(', ')}
                </p>
              ) : null}
              {lifecycleSummary.memberSchedules?.assign.length ? (
                <div className="space-y-1">
                  <p className="font-medium">Member assign schedules</p>
                  {lifecycleSummary.memberSchedules.assign.map((row) => (
                    <p key={`assign-${row.positionName}`}>
                      <span className="font-medium">{row.positionName}:</span> {row.emails.join(', ')}
                    </p>
                  ))}
                </div>
              ) : null}
              {lifecycleSummary.memberSchedules?.unassign.length ? (
                <div className="space-y-1">
                  <p className="font-medium">Member unassign schedules</p>
                  {lifecycleSummary.memberSchedules.unassign.map((row) => (
                    <p key={`unassign-${row.positionName}`}>
                      <span className="font-medium">{row.positionName}:</span> {row.emails.join(', ')}
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="text-muted-foreground">
                {lifecycleSummary.persistingCount} position
                {lifecycleSummary.persistingCount === 1 ? '' : 's'} will persist unchanged.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleConfirmStart()} disabled={isStarting}>
              {isStarting ? 'Starting…' : `Start ${formatOperationalPeriodLabel(nextPeriodNumber)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
