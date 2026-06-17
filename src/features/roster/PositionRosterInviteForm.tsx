import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  PositionRosterInviteSubmitResult,
  RosterInviteAssignmentMode,
} from '@/features/roster/position-roster-messages'

function isValidRosterEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

type PositionRosterInviteFormProps = {
  position: string
  mode: RosterInviteAssignmentMode
  isSupabaseEnabled: boolean
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (params: {
    email: string
    password: string
    position: string
    mode: RosterInviteAssignmentMode
  }) => Promise<PositionRosterInviteSubmitResult>
}

export function PositionRosterInviteForm({
  position,
  mode,
  isSupabaseEnabled,
  isSubmitting,
  onCancel,
  onSubmit,
}: PositionRosterInviteFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)

  const canSubmit =
    isValidRosterEmail(email) && (password.length === 0 || password.length >= 8) && !isSubmitting

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setPasswordVisible(false)
  }

  const handleSubmit = async () => {
    const result = await onSubmit({
      email: email.trim().toLowerCase(),
      password,
      position,
      mode,
    })
    if (result === 'success') {
      resetForm()
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-dashed bg-background/80 p-2.5">
      <p className="text-[11px] text-muted-foreground">
        {mode === 'schedule_on_op_advance'
          ? `Send a workspace invitation. ${position} will be scheduled on the next operational period after they join.`
          : `Add a team member to ${position}. Leave password blank to email an invitation.`}
      </p>
      <div className="grid gap-2">
        <Label htmlFor={`inline-invite-email-${position}-${mode}`} className="text-xs">
          Email
        </Label>
        <Input
          id={`inline-invite-email-${position}-${mode}`}
          type="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@agency.gov"
          className="h-8 text-xs"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && password.length === 0 && canSubmit) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
        />
      </div>
      {isSupabaseEnabled ? (
        <div className="grid gap-2">
          <Label htmlFor={`inline-invite-password-${position}-${mode}`} className="text-xs">
            Password (optional)
          </Label>
          <div className="relative">
            <Input
              id={`inline-invite-password-${position}-${mode}`}
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Set a sign-in password"
              autoComplete="new-password"
              className="h-8 pr-9 text-xs"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSubmit) {
                  event.preventDefault()
                  void handleSubmit()
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-8 w-8 text-muted-foreground"
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              onClick={() => setPasswordVisible((previous) => !previous)}
            >
              {passwordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            If set, an account is created immediately and no invite email is sent. Minimum 8
            characters.
          </p>
        </div>
      ) : null}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-xs"
          disabled={isSubmitting}
          onClick={() => {
            resetForm()
            onCancel()
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 flex-1 text-xs"
          disabled={!canSubmit}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {isSubmitting
            ? password.length > 0
              ? 'Adding…'
              : 'Sending…'
            : isSupabaseEnabled
              ? password.length > 0
                ? 'Add member'
                : 'Send invite'
              : 'Add to roster'}
        </Button>
      </div>
    </div>
  )
}
