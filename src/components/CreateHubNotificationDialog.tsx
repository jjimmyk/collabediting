import { useEffect, useMemo, useState } from 'react'
import type { HubNotificationRecipient } from '@/data/hub-notification-recipients'
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { cn } from '@/lib/utils'

type NotificationSeverity = 'Critical' | 'High' | 'Medium' | 'Low'

type CreateHubNotificationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipients: HubNotificationRecipient[]
  loadingRecipients?: boolean
  senderLabel?: string
  onSend: (payload: {
    title: string
    summary: string
    severity: NotificationSeverity
    recipientEmails: string[]
  }) => Promise<void>
}

export function CreateHubNotificationDialog({
  open,
  onOpenChange,
  recipients,
  loadingRecipients = false,
  senderLabel,
  onSend,
}: CreateHubNotificationDialogProps) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [severity, setSeverity] = useState<NotificationSeverity>('Medium')
  const [selectedRecipientEmails, setSelectedRecipientEmails] = useState<Set<string>>(
    new Set()
  )
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sortedRecipients = useMemo(
    () =>
      [...recipients].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      ),
    [recipients]
  )

  useEffect(() => {
    if (!open) {
      setTitle('')
      setSummary('')
      setSeverity('Medium')
      setSelectedRecipientEmails(new Set())
      setIsSending(false)
      setErrorMessage(null)
    }
  }, [open])

  const toggleRecipient = (email: string) => {
    setSelectedRecipientEmails((previous) => {
      const next = new Set(previous)
      const normalizedEmail = email.toLowerCase()
      if (next.has(normalizedEmail)) {
        next.delete(normalizedEmail)
      } else {
        next.add(normalizedEmail)
      }
      return next
    })
  }

  const handleSend = async () => {
    const trimmedTitle = title.trim()
    const trimmedSummary = summary.trim()
    const recipientEmails = [...selectedRecipientEmails]

    if (!trimmedTitle) {
      setErrorMessage('Enter a notification title.')
      return
    }
    if (!trimmedSummary) {
      setErrorMessage('Enter a notification message.')
      return
    }
    if (recipientEmails.length === 0) {
      setErrorMessage('Select at least one recipient.')
      return
    }

    setErrorMessage(null)
    setIsSending(true)
    try {
      await onSend({
        title: trimmedTitle,
        summary: trimmedSummary,
        severity,
        recipientEmails,
      })
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send notification.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
          <DialogDescription>
            Send an in-app notification to one or more users
            {senderLabel ? ` from ${senderLabel}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="hub-notification-title">Title</Label>
            <Input
              id="hub-notification-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Notification title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hub-notification-summary">Message</Label>
            <textarea
              id="hub-notification-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What should recipients know?"
              rows={4}
              className="flex min-h-[96px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hub-notification-severity">Severity</Label>
            <NativeSelect
              id="hub-notification-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as NotificationSeverity)}
            >
              <NativeSelectOption value="Critical">Critical</NativeSelectOption>
              <NativeSelectOption value="High">High</NativeSelectOption>
              <NativeSelectOption value="Medium">Medium</NativeSelectOption>
              <NativeSelectOption value="Low">Low</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>
            {loadingRecipients ? (
              <p className="text-sm text-muted-foreground">Loading recipients…</p>
            ) : sortedRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other users available.</p>
            ) : (
              <div className="space-y-1.5">
                {sortedRecipients.map((recipient) => {
                  const checkboxId = `hub-notification-recipient-${recipient.id}`
                  const normalizedEmail = recipient.email.toLowerCase()
                  const isSelected = selectedRecipientEmails.has(normalizedEmail)
                  return (
                    <Item
                      key={recipient.id}
                      variant="outline"
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-muted/40',
                        isSelected && 'border-primary/40 bg-primary/5'
                      )}
                      onClick={() => toggleRecipient(recipient.email)}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={isSelected}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={() => toggleRecipient(recipient.email)}
                        className="mt-0.5"
                      />
                      <ItemContent>
                        <ItemTitle className="text-sm">{recipient.name}</ItemTitle>
                        <ItemDescription>{recipient.email}</ItemDescription>
                        {recipient.role && (
                          <p className="text-xs text-muted-foreground">{recipient.role}</p>
                        )}
                      </ItemContent>
                    </Item>
                  )
                })}
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSending} onClick={() => void handleSend()}>
            {isSending ? 'Sending…' : 'Send Notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
