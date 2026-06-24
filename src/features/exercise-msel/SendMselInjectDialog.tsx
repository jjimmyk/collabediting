import { useEffect, useMemo, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import type { MselInject } from '@/features/exercise-msel/types'
import { getExerciseObjectiveLabel } from '@/features/exercise-msel/msel-utils'
import type { ExerciseMselState } from '@/features/exercise-msel/types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type NotificationSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

export type SendMselInjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  inject: MselInject | null
  objectives: ExerciseMselState['objectives']
  rosterMembers: WorkspaceRosterMember[]
  senderLabel?: string
  onSend: (payload: {
    recipientEmails: string[]
    severity: NotificationSeverity
  }) => Promise<void>
}

export function SendMselInjectDialog({
  open,
  onOpenChange,
  inject,
  objectives,
  rosterMembers,
  senderLabel,
  onSend,
}: SendMselInjectDialogProps) {
  const [severity, setSeverity] = useState<NotificationSeverity>('Medium')
  const [selectedRecipientEmails, setSelectedRecipientEmails] = useState<Set<string>>(new Set())
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const rosterRecipients = useMemo(
    () =>
      rosterMembers
        .filter((member) => member.email.trim().length > 0)
        .map((member) => ({
          email: member.email.trim().toLowerCase(),
          label: member.icsPosition
            ? `${member.email} · ${member.icsPosition}`
            : member.email,
        }))
        .sort((left, right) => left.email.localeCompare(right.email)),
    [rosterMembers]
  )

  useEffect(() => {
    if (!open) {
      setSeverity('Medium')
      setSelectedRecipientEmails(new Set())
      setIsSending(false)
      setErrorMessage(null)
    }
  }, [open])

  const toggleRecipient = (email: string) => {
    setSelectedRecipientEmails((previous) => {
      const next = new Set(previous)
      if (next.has(email)) {
        next.delete(email)
      } else {
        next.add(email)
      }
      return next
    })
  }

  const handleSend = async () => {
    if (!inject) {
      return
    }

    const recipientEmails = [...selectedRecipientEmails]
    if (recipientEmails.length === 0) {
      setErrorMessage('Select at least one roster recipient.')
      return
    }

    setErrorMessage(null)
    setIsSending(true)
    try {
      await onSend({ recipientEmails, severity })
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send inject.')
    } finally {
      setIsSending(false)
    }
  }

  const objectiveLabel = inject
    ? getExerciseObjectiveLabel(objectives, inject.objectiveId)
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send MSEL Inject</DialogTitle>
          <DialogDescription>
            Deliver this inject to selected workspace roster members via notification and Injects
            Received.
            {senderLabel ? ` Sending as ${senderLabel}.` : ''}
          </DialogDescription>
        </DialogHeader>

        {inject && (
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{inject.inject.trim() || `Inject ${inject.id}`}</ItemTitle>
              <ItemDescription>
                {inject.scheduledTime || 'No time set'} · {inject.category} · {objectiveLabel}
              </ItemDescription>
            </ItemContent>
          </Item>
        )}

        <div className="grid gap-2">
          <Label htmlFor="msel-send-severity">Severity</Label>
          <NativeSelect
            id="msel-send-severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as NotificationSeverity)}
          >
            <NativeSelectOption value="Critical">Critical</NativeSelectOption>
            <NativeSelectOption value="High">High</NativeSelectOption>
            <NativeSelectOption value="Medium">Medium</NativeSelectOption>
            <NativeSelectOption value="Low">Low</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label>Roster recipients</Label>
          {rosterRecipients.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Add members to the workspace roster to send injects.
            </div>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {rosterRecipients.map((recipient) => (
                <label
                  key={recipient.email}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedRecipientEmails.has(recipient.email)}
                    onCheckedChange={() => toggleRecipient(recipient.email)}
                    aria-label={`Select ${recipient.email}`}
                  />
                  <span className="text-sm leading-snug">{recipient.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || rosterRecipients.length === 0}
            data-testid="msel-send-inject-confirm"
          >
            {isSending ? 'Sending…' : 'Send Inject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
