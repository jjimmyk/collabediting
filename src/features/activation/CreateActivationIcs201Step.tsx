import { useEffect, useRef, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { ICS201_OBJECTIVE_KIND_OPTIONS } from '@/features/ics201/constants'
import type { Ics201FormState, Ics201ObjectiveKind, Ics201ObjectiveRow } from '@/features/ics201/types'
import { cloneIcs201FormState } from '@/features/ics201/utils'
import {
  buildActivationIcs201Prefill,
  type ActivationIcs201DraftState,
  type ActivationIcs201InitialReportInput,
} from '@/lib/activation-ics201-prefill'
import type { CreateActivationKind } from '@/lib/create-activation-navigation'
import { CREATE_ACTIVATION_PORTAL_Z_CLASS } from '@/lib/create-activation-navigation'
import { cn } from '@/lib/utils'

export type CreateActivationIcs201StepPrefillInput = {
  kind: CreateActivationKind
  name: string
  region: string
  lead: string
  geometrySummary?: string
  locationLabel?: string
  startTimeIso?: string
  initialReport: ActivationIcs201InitialReportInput
  exerciseObjectives?: Array<{ name: string }>
}

type CreateActivationIcs201StepProps = {
  value: ActivationIcs201DraftState
  onChange: (next: ActivationIcs201DraftState) => void
  prefillInput: CreateActivationIcs201StepPrefillInput
  defaultSignName?: string
}

function updateForm(
  value: ActivationIcs201DraftState,
  onChange: (next: ActivationIcs201DraftState) => void,
  patch: Partial<Ics201FormState>
) {
  onChange({
    ...value,
    touched: true,
    form: cloneIcs201FormState({ ...value.form, ...patch }),
  })
}

function updateObjectives(
  value: ActivationIcs201DraftState,
  onChange: (next: ActivationIcs201DraftState) => void,
  objectives: Ics201ObjectiveRow[]
) {
  onChange({
    ...value,
    touched: true,
    form: cloneIcs201FormState({ ...value.form, objectives }),
  })
}

export function CreateActivationIcs201Step({
  value,
  onChange,
  prefillInput,
  defaultSignName = 'You',
}: CreateActivationIcs201StepProps) {
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)
  const [signNameInput, setSignNameInput] = useState(defaultSignName)
  const [signRoleInput, setSignRoleInput] = useState('Incident Commander')

  const prefillSnapshotRef = useRef('')

  useEffect(() => {
    if (value.touched) {
      return
    }
    const nextForm = buildActivationIcs201Prefill(prefillInput)
    const nextSnapshot = JSON.stringify(nextForm)
    if (prefillSnapshotRef.current === nextSnapshot) {
      return
    }
    prefillSnapshotRef.current = nextSnapshot
    onChange({
      form: nextForm,
      signIntent: value.signIntent,
      touched: false,
    })
  }, [prefillInput, onChange, value.signIntent, value.touched])

  const form = value.form

  const addObjectiveRow = () => {
    const nextId =
      form.objectives.length > 0 ? Math.max(...form.objectives.map((row) => row.id)) + 1 : 1
    updateObjectives(value, onChange, [
      ...form.objectives,
      { id: nextId, kind: 'O', objective: '' },
    ])
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-medium">ICS-201 Incident Briefing</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Optionally draft the ICS-201 that will be created with this workspace. You can complete and
          edit the full form after activation.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/10 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Report Identification
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="activation-ics201-incident-name">Incident / exercise name</Label>
            <Input
              id="activation-ics201-incident-name"
              value={form.incidentName}
              onChange={(event) => updateForm(value, onChange, { incidentName: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activation-ics201-incident-number">Incident number</Label>
            <Input
              id="activation-ics201-incident-number"
              value={form.incidentNumber}
              onChange={(event) =>
                updateForm(value, onChange, { incidentNumber: event.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activation-ics201-jurisdiction">Jurisdiction / agency</Label>
            <Input
              id="activation-ics201-jurisdiction"
              value={form.jurisdiction}
              onChange={(event) => updateForm(value, onChange, { jurisdiction: event.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="activation-ics201-location">Location</Label>
            <Input
              id="activation-ics201-location"
              value={form.incidentLocation}
              onChange={(event) =>
                updateForm(value, onChange, { incidentLocation: event.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activation-ics201-date-initiated">Date initiated</Label>
            <Input
              id="activation-ics201-date-initiated"
              type="date"
              value={form.dateInitiated}
              onChange={(event) => updateForm(value, onChange, { dateInitiated: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="activation-ics201-time-initiated">Time initiated</Label>
            <Input
              id="activation-ics201-time-initiated"
              type="time"
              value={form.timeInitiated}
              onChange={(event) => updateForm(value, onChange, { timeInitiated: event.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="activation-ics201-prepared-by">Prepared by</Label>
            <Input
              id="activation-ics201-prepared-by"
              value={form.preparedBy}
              onChange={(event) => updateForm(value, onChange, { preparedBy: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="activation-ics201-current-situation">Current situation</Label>
        <Textarea
          id="activation-ics201-current-situation"
          rows={5}
          value={form.currentSituationSummary}
          onChange={(event) =>
            updateForm(value, onChange, { currentSituationSummary: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>Objectives</Label>
          <Button type="button" size="sm" variant="outline" onClick={addObjectiveRow}>
            <Plus className="mr-1 h-4 w-4" />
            Add objective
          </Button>
        </div>
        {form.objectives.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
            No objectives yet.
          </div>
        ) : (
          <div className="space-y-2">
            {form.objectives.map((row, index) => (
              <div key={row.id} className="flex flex-wrap items-start gap-2 rounded-md border p-2">
                <NativeSelect
                  className="w-28 shrink-0"
                  value={row.kind}
                  aria-label={`Objective ${index + 1} kind`}
                  onChange={(event) => {
                    const nextKind = event.target.value as Ics201ObjectiveKind
                    updateObjectives(
                      value,
                      onChange,
                      form.objectives.map((entry) =>
                        entry.id === row.id ? { ...entry, kind: nextKind } : entry
                      )
                    )
                  }}
                >
                  {ICS201_OBJECTIVE_KIND_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value || 'blank'} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  className="min-w-0 flex-1"
                  value={row.objective}
                  aria-label={`Objective ${index + 1}`}
                  onChange={(event) => {
                    updateObjectives(
                      value,
                      onChange,
                      form.objectives.map((entry) =>
                        entry.id === row.id ? { ...entry, objective: event.target.value } : entry
                      )
                    )
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove objective ${index + 1}`}
                  onClick={() => {
                    updateObjectives(
                      value,
                      onChange,
                      form.objectives.filter((entry) => entry.id !== row.id)
                    )
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {value.signIntent ? (
          <>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300'
              )}
            >
              <Check className="h-3.5 w-3.5" />
              Signed by {value.signIntent.name} ({value.signIntent.role})
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange({ ...value, signIntent: null })}
            >
              Clear signature
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => {
              setSignNameInput(defaultSignName)
              setIsSignDialogOpen(true)
            }}
          >
            <Check className="mr-1 h-4 w-4" />
            Sign ICS-201 (optional)
          </Button>
        )}
      </div>

      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className={cn('!w-[24rem] !max-w-[24rem] sm:!max-w-[24rem]', CREATE_ACTIVATION_PORTAL_Z_CLASS)}>
          <div className="flex items-center gap-2 px-1 pb-1 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Confirm your signature
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            Type your name to sign this ICS-201 draft. A signed version will be created when the
            workspace is activated.
          </p>
          <div className="space-y-3 px-1 pt-2">
            <div className="space-y-1">
              <Label htmlFor="activation-ics201-sign-name">Your name</Label>
              <Input
                id="activation-ics201-sign-name"
                autoFocus
                value={signNameInput}
                onChange={(event) => setSignNameInput(event.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="activation-ics201-sign-role">Role / position</Label>
              <Input
                id="activation-ics201-sign-role"
                value={signRoleInput}
                onChange={(event) => setSignRoleInput(event.target.value)}
                placeholder="Incident Commander"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-1 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setIsSignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={signNameInput.trim().length === 0 || signRoleInput.trim().length === 0}
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                const name = signNameInput.trim()
                const role = signRoleInput.trim()
                if (!name || !role) {
                  return
                }
                onChange({
                  ...value,
                  touched: true,
                  signIntent: { name, role },
                })
                setIsSignDialogOpen(false)
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
