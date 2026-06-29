export type ActivationNotificationChannel =
  | 'pratus'
  | 'teams'
  | 'email'
  | 'sms'
  | 'call'

export type ActivationNotificationTarget =
  | { kind: 'member'; memberId: string; email: string; label: string }
  | { kind: 'position'; positionName: string }

export type ActivationCustomMessageRow = {
  id: number
  target: ActivationNotificationTarget | null
  message: string
}

export type ActivationNotificationSettings = {
  channels: ActivationNotificationChannel[]
  includeInitialReport: boolean
  customMessages: ActivationCustomMessageRow[]
}

export const ACTIVATION_NOTIFICATION_CHANNEL_OPTIONS: Array<{
  value: ActivationNotificationChannel
  label: string
}> = [
  { value: 'pratus', label: 'PRATUS' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'call', label: 'Call' },
]

export function createDefaultActivationNotificationSettings(): ActivationNotificationSettings {
  return {
    channels: ['pratus'],
    includeInitialReport: true,
    customMessages: [],
  }
}

export function formatActivationNotificationChannelLabel(
  channel: ActivationNotificationChannel
): string {
  return (
    ACTIVATION_NOTIFICATION_CHANNEL_OPTIONS.find((option) => option.value === channel)?.label ??
    channel
  )
}
