import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ICS_ORG_CHART_ROOT_POSITION } from '@/features/roster/ics-org-chart-structure'
import type {
  PositionRosterInviteSubmitResult,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'
import { validateMemberOrgChartReportsTo } from '@/features/roster/workspace-member-org-chart'
import { buildReportsToOptions, type WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type {
  MemberAssignmentKind,
  WorkspaceMemberPersonSource,
} from '@/lib/roster-member-assignment'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import { WORKSPACE_ROSTER_POSITIONS } from '@/lib/ics-positions'
import { cn } from '@/lib/utils'

export type AddWorkspaceMemberSubmitInput = {
  personSource: WorkspaceMemberPersonSource
  assignmentKind: MemberAssignmentKind
  email: string
  password: string
  existingUserId: string | null
  icsPositions: string[]
  orgChartReportsTo: string
  mode: RosterInviteAssignmentMode
  positionPreset: string | null
}

type AddWorkspaceMemberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceLabel: string
  isSupabaseEnabled: boolean
  catalog: WorkspacePositionCatalog
  positionPreset: string | null
  inviteAssignmentMode: RosterInviteAssignmentMode
  isSubmitting: boolean
  onSearchExistingPeople: (query: string) => Promise<OrgMemberSearchResult[]>
  onSubmit: (input: AddWorkspaceMemberSubmitInput) => Promise<PositionRosterInviteSubmitResult>
}

function isValidRosterEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function AddWorkspaceMemberDialog({
  open,
  onOpenChange,
  workspaceLabel,
  isSupabaseEnabled,
  catalog,
  positionPreset,
  inviteAssignmentMode,
  isSubmitting,
  onSearchExistingPeople,
  onSubmit,
}: AddWorkspaceMemberDialogProps) {
  const [personSource, setPersonSource] = useState<WorkspaceMemberPersonSource>('invite_new')
  const [assignmentKind, setAssignmentKind] = useState<MemberAssignmentKind>('ics_position')
  const [emailDraft, setEmailDraft] = useState('')
  const [passwordDraft, setPasswordDraft] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [existingSearchQuery, setExistingSearchQuery] = useState('')
  const [existingSearchResults, setExistingSearchResults] = useState<OrgMemberSearchResult[]>([])
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string | null>(null)
  const [isSearchingExisting, setIsSearchingExisting] = useState(false)
  const [positionsDraft, setPositionsDraft] = useState<string[]>(['Incident Commander'])
  const [orgChartReportsToDraft, setOrgChartReportsToDraft] = useState<string>(
    ICS_ORG_CHART_ROOT_POSITION
  )

  const reportsToOptions = useMemo(() => buildReportsToOptions(catalog), [catalog])
  const lockIcsPositions = Boolean(positionPreset) && assignmentKind === 'ics_position'

  const resetDraft = () => {
    setPersonSource('invite_new')
    setAssignmentKind('ics_position')
    setEmailDraft('')
    setPasswordDraft('')
    setPasswordVisible(false)
    setExistingSearchQuery('')
    setExistingSearchResults([])
    setSelectedExistingUserId(null)
    setPositionsDraft(positionPreset ? [positionPreset] : ['Incident Commander'])
    setOrgChartReportsToDraft(positionPreset ?? ICS_ORG_CHART_ROOT_POSITION)
  }

  useEffect(() => {
    if (!open) return
    resetDraft()
  }, [open, positionPreset])

  useEffect(() => {
    if (!open || personSource !== 'add_existing' || !isSupabaseEnabled) {
      setExistingSearchResults([])
      return
    }

    const query = existingSearchQuery.trim()
    if (query.length < 2) {
      setExistingSearchResults([])
      return
    }

    const timeout = window.setTimeout(() => {
      setIsSearchingExisting(true)
      void onSearchExistingPeople(query)
        .then((results) => {
          setExistingSearchResults(results)
        })
        .catch(() => {
          setExistingSearchResults([])
        })
        .finally(() => {
          setIsSearchingExisting(false)
        })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [existingSearchQuery, isSupabaseEnabled, onSearchExistingPeople, open, personSource])

  const togglePositionDraft = (position: string) => {
    setPositionsDraft((previous) => {
      if (previous.includes(position)) {
        if (previous.length === 1) return previous
        return previous.filter((entry) => entry !== position)
      }
      return [...previous, position].sort((a, b) => a.localeCompare(b))
    })
  }

  const orgChartValidationError =
    assignmentKind === 'single_resource'
      ? validateMemberOrgChartReportsTo(orgChartReportsToDraft, catalog)
      : null

  const canSubmit =
    !isSubmitting &&
    !orgChartValidationError &&
    (assignmentKind === 'ics_position' ? positionsDraft.length > 0 : Boolean(orgChartReportsToDraft)) &&
    (personSource === 'invite_new'
      ? isValidRosterEmail(emailDraft) &&
        (passwordDraft.length === 0 || passwordDraft.length >= 8)
      : isSupabaseEnabled && selectedExistingUserId !== null)

  const handleSubmit = async () => {
    const selectedExisting = existingSearchResults.find(
      (result) => result.id === selectedExistingUserId
    )
    const result = await onSubmit({
      personSource,
      assignmentKind,
      email:
        personSource === 'invite_new'
          ? emailDraft.trim().toLowerCase()
          : (selectedExisting?.email ?? '').trim().toLowerCase(),
      password: passwordDraft,
      existingUserId: selectedExistingUserId,
      icsPositions: positionsDraft,
      orgChartReportsTo: orgChartReportsToDraft,
      mode: inviteAssignmentMode,
      positionPreset,
    })
    if (result === 'success') {
      onOpenChange(false)
    }
  }

  const submitLabel =
    personSource === 'add_existing'
      ? isSubmitting
        ? 'Adding…'
        : 'Add to roster'
      : isSubmitting
        ? passwordDraft.length > 0
          ? 'Adding member…'
          : 'Sending invite…'
        : isSupabaseEnabled
          ? passwordDraft.length > 0
            ? 'Add member'
            : 'Send invite'
          : 'Add to roster'

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) resetDraft()
      }}
    >
      <DialogContent className="!w-[32rem] !max-w-[32rem] sm:!max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>
            {positionPreset
              ? inviteAssignmentMode === 'schedule_on_op_advance'
                ? `Invite user for ${positionPreset} (next OP)`
                : `Add member to ${positionPreset}`
              : 'Add roster member'}
          </DialogTitle>
          <DialogDescription>
            {positionPreset
              ? inviteAssignmentMode === 'schedule_on_op_advance'
                ? `Send a workspace invitation. ${positionPreset} will be scheduled on the next operational period after they join.`
                : `Add a team member to ${positionPreset} on ${workspaceLabel}.`
              : isSupabaseEnabled
                ? `Add someone to ${workspaceLabel}. Invite a new person or add someone who already has a Pratus account.`
                : `Invite a team member by email and assign their role for ${workspaceLabel}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label>Person</Label>
            <RadioGroup
              value={personSource}
              onValueChange={(value) =>
                setPersonSource(value === 'add_existing' ? 'add_existing' : 'invite_new')
              }
              className="grid grid-cols-2 gap-2"
            >
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                  personSource === 'invite_new' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="invite_new" />
                Invite new person
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                  personSource === 'add_existing' && 'border-primary bg-primary/5',
                  !isSupabaseEnabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <RadioGroupItem value="add_existing" disabled={!isSupabaseEnabled} />
                Add existing person
              </label>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Assignment</Label>
            <RadioGroup
              value={assignmentKind}
              onValueChange={(value) =>
                setAssignmentKind(value === 'single_resource' ? 'single_resource' : 'ics_position')
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                  assignmentKind === 'ics_position' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="ics_position" />
                Assign ICS position(s)
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm',
                  assignmentKind === 'single_resource' && 'border-primary bg-primary/5',
                  inviteAssignmentMode === 'schedule_on_op_advance' && 'cursor-not-allowed opacity-50'
                )}
              >
                <RadioGroupItem
                  value="single_resource"
                  disabled={inviteAssignmentMode === 'schedule_on_op_advance'}
                />
                Add as single resource
              </label>
            </RadioGroup>
          </div>

          {personSource === 'invite_new' ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="roster-member-email">Email</Label>
                <Input
                  id="roster-member-email"
                  type="email"
                  autoFocus
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  placeholder="name@agency.gov"
                />
              </div>
              {isSupabaseEnabled ? (
                <div className="grid gap-2">
                  <Label htmlFor="roster-member-password">Password (optional)</Label>
                  <div className="relative">
                    <Input
                      id="roster-member-password"
                      type={passwordVisible ? 'text' : 'password'}
                      value={passwordDraft}
                      onChange={(event) => setPasswordDraft(event.target.value)}
                      placeholder="Set a sign-in password"
                      autoComplete="new-password"
                      className="pr-9"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                      aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                      onClick={() => setPasswordVisible((previous) => !previous)}
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If set, an account is created immediately and no invite email is sent. Minimum 8
                    characters.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="existing-person-search">Search existing people</Label>
              <Input
                id="existing-person-search"
                value={existingSearchQuery}
                onChange={(event) => {
                  setExistingSearchQuery(event.target.value)
                  setSelectedExistingUserId(null)
                }}
                placeholder="Search by name or email"
              />
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {existingSearchQuery.trim().length < 2 ? (
                  <p className="px-1 py-2 text-[11px] text-muted-foreground">
                    Type at least 2 characters to search.
                  </p>
                ) : isSearchingExisting ? (
                  <p className="px-1 py-2 text-[11px] text-muted-foreground">Searching…</p>
                ) : existingSearchResults.length === 0 ? (
                  <p className="px-1 py-2 text-[11px] text-muted-foreground">
                    No matching people found outside this roster.
                  </p>
                ) : (
                  existingSearchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className={cn(
                        'flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted',
                        selectedExistingUserId === result.id && 'bg-primary/10 ring-1 ring-primary'
                      )}
                      onClick={() => setSelectedExistingUserId(result.id)}
                    >
                      <span className="font-medium">{result.email}</span>
                      {result.fullName ? (
                        <span className="text-[11px] text-muted-foreground">{result.fullName}</span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {assignmentKind === 'ics_position' ? (
            <div className="grid gap-2">
              <Label>ICS Positions (select at least one)</Label>
              {lockIcsPositions ? (
                <div className="rounded-md border px-3 py-2 text-sm">
                  {positionPreset}
                  {inviteAssignmentMode === 'schedule_on_op_advance' ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Scheduled for this position on the next operational period.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {WORKSPACE_ROSTER_POSITIONS.map((position) => (
                    <label
                      key={position}
                      htmlFor={`roster-add-position-${position}`}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`roster-add-position-${position}`}
                        checked={positionsDraft.includes(position)}
                        onCheckedChange={() => togglePositionDraft(position)}
                      />
                      <span>{position}</span>
                    </label>
                  ))}
                  {catalog.customPositions.map((position) => (
                    <label
                      key={position.id}
                      htmlFor={`roster-add-position-${position.id}`}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`roster-add-position-${position.id}`}
                        checked={positionsDraft.includes(position.name)}
                        onCheckedChange={() => togglePositionDraft(position.name)}
                      />
                      <span>{position.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="single-resource-reports-to">Reports to on org chart</Label>
              <Select value={orgChartReportsToDraft} onValueChange={setOrgChartReportsToDraft}>
                <SelectTrigger id="single-resource-reports-to">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {reportsToOptions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                This person will appear under the selected position on the org chart as a single
                resource, without filling an ICS position slot.
              </p>
              {orgChartValidationError ? (
                <p className="text-xs text-destructive">{orgChartValidationError}</p>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
