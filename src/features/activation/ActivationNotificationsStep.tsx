import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  ACTIVATION_NOTIFICATION_CHANNEL_OPTIONS,
  type ActivationCustomMessageRow,
  type ActivationNotificationChannel,
  type ActivationNotificationSettings,
  type ActivationNotificationTarget,
} from '@/features/activation/activation-notification-types'
import {
  buildActivationMemberTargetOptions,
  buildActivationPositionOptions,
  formatInitialReportForActivationNotification,
  type ActivationInitialReportInput,
} from '@/features/activation/activation-notification-delivery'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ActivationNotificationsStepProps = {
  settings: ActivationNotificationSettings
  onChange: (settings: ActivationNotificationSettings) => void
  rosterDraft: BuildTeamRosterDraft
  activationKind: 'incident' | 'exercise'
  initialReport: ActivationInitialReportInput
}

function nextCustomMessageRowId(rows: ActivationCustomMessageRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

function targetSelectValue(target: ActivationNotificationTarget | null): string {
  if (!target) return ''
  if (target.kind === 'member') {
    return `member:${target.memberId}`
  }
  return `position:${target.positionName}`
}

function parseTargetSelectValue(
  value: string,
  memberOptions: Extract<ActivationNotificationTarget, { kind: 'member' }>[],
  positionOptions: string[]
): ActivationNotificationTarget | null {
  if (!value) return null
  if (value.startsWith('member:')) {
    const memberId = value.slice('member:'.length)
    return memberOptions.find((option) => option.memberId === memberId) ?? null
  }
  if (value.startsWith('position:')) {
    const positionName = value.slice('position:'.length)
    if (!positionOptions.includes(positionName)) return null
    return { kind: 'position', positionName }
  }
  return null
}

export function ActivationNotificationsStep({
  settings,
  onChange,
  rosterDraft,
  activationKind,
  initialReport,
}: ActivationNotificationsStepProps) {
  const memberOptions = useMemo(
    () => buildActivationMemberTargetOptions(rosterDraft),
    [rosterDraft]
  )
  const positionOptions = useMemo(
    () => buildActivationPositionOptions(rosterDraft),
    [rosterDraft]
  )
  const reportLabel =
    activationKind === 'incident' ? 'Initial Incident Report' : 'Initial Exercise Report'
  const reportPreview = formatInitialReportForActivationNotification(initialReport)

  const toggleChannel = (channel: ActivationNotificationChannel, checked: boolean) => {
    onChange({
      ...settings,
      channels: checked
        ? [...new Set([...settings.channels, channel])]
        : settings.channels.filter((entry) => entry !== channel),
    })
  }

  const updateCustomMessageRow = (
    rowId: number,
    patch: Partial<ActivationCustomMessageRow>
  ) => {
    onChange({
      ...settings,
      customMessages: settings.customMessages.map((row) =>
        row.id === rowId ? { ...row, ...patch } : row
      ),
    })
  }

  const addCustomMessageRow = () => {
    onChange({
      ...settings,
      customMessages: [
        ...settings.customMessages,
        {
          id: nextCustomMessageRowId(settings.customMessages),
          target: memberOptions[0] ?? null,
          message: '',
        },
      ],
    })
  }

  const removeCustomMessageRow = (rowId: number) => {
    onChange({
      ...settings,
      customMessages: settings.customMessages.filter((row) => row.id !== rowId),
    })
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose how the team is notified when this workspace is created. PRATUS sends in-app
          notifications immediately; other channels are saved as preferences for future delivery.
        </p>
      </div>

      <section className="space-y-3 rounded-md border p-4">
        <div>
          <h3 className="text-sm font-medium">Communication channels</h3>
          <p className="text-xs text-muted-foreground">
            Select one or more channels. At least one channel is recommended.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIVATION_NOTIFICATION_CHANNEL_OPTIONS.map((option) => {
            const checkboxId = `activation-channel-${option.value}`
            const isChecked = settings.channels.includes(option.value)
            return (
              <label
                key={option.value}
                htmlFor={checkboxId}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/40',
                  isChecked && 'border-primary/40 bg-primary/5'
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    toggleChannel(option.value, checked === true)
                  }
                />
                <span className="text-sm">{option.label}</span>
              </label>
            )
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-md border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="activation-include-report" className="text-sm font-medium">
              Include {reportLabel}
            </Label>
            <p className="text-xs text-muted-foreground">
              Attach a compact summary of the initial report to activation notifications.
            </p>
          </div>
          <Switch
            id="activation-include-report"
            checked={settings.includeInitialReport}
            onCheckedChange={(checked) =>
              onChange({ ...settings, includeInitialReport: checked })
            }
          />
        </div>
        {settings.includeInitialReport && reportPreview ? (
          <pre className="max-h-40 overflow-y-auto rounded-md border bg-muted/20 p-3 text-xs whitespace-pre-wrap">
            {reportPreview}
          </pre>
        ) : settings.includeInitialReport ? (
          <p className="text-xs text-muted-foreground">
            No initial report content yet. Complete the report step to preview content here.
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-md border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Custom messages (optional)</h3>
            <p className="text-xs text-muted-foreground">
              Send targeted PRATUS messages to specific roster members or positions.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustomMessageRow}>
            <Plus className="mr-1 h-4 w-4" />
            Add custom message
          </Button>
        </div>

        {settings.customMessages.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            No custom messages added.
          </div>
        ) : (
          <div className="space-y-3">
            {settings.customMessages.map((row) => (
              <div key={row.id} className="space-y-3 rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor={`activation-target-${row.id}`}>Recipient</Label>
                    <NativeSelect
                      id={`activation-target-${row.id}`}
                      value={targetSelectValue(row.target)}
                      onChange={(event) => {
                        updateCustomMessageRow(row.id, {
                          target: parseTargetSelectValue(
                            event.target.value,
                            memberOptions,
                            positionOptions
                          ),
                        })
                      }}
                    >
                      <NativeSelectOption value="">Select recipient</NativeSelectOption>
                      {memberOptions.length > 0 ? (
                        <optgroup label="Members">
                          {memberOptions.map((member) => (
                            <NativeSelectOption
                              key={`member-${member.memberId}`}
                              value={`member:${member.memberId}`}
                            >
                              {member.label}
                            </NativeSelectOption>
                          ))}
                        </optgroup>
                      ) : null}
                      {positionOptions.length > 0 ? (
                        <optgroup label="Positions">
                          {positionOptions.map((position) => (
                            <NativeSelectOption
                              key={`position-${position}`}
                              value={`position:${position}`}
                            >
                              {position}
                            </NativeSelectOption>
                          ))}
                        </optgroup>
                      ) : null}
                    </NativeSelect>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 shrink-0"
                    aria-label={`Remove custom message ${row.id}`}
                    onClick={() => removeCustomMessageRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`activation-message-${row.id}`}>Message</Label>
                  <Textarea
                    id={`activation-message-${row.id}`}
                    value={row.message}
                    onChange={(event) =>
                      updateCustomMessageRow(row.id, { message: event.target.value })
                    }
                    placeholder="Add a targeted note for this recipient."
                    className="min-h-24"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
