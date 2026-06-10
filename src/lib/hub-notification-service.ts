import {
  dedupeHubNotificationRecipients,
  HUB_NOTIFICATION_RECIPIENTS,
  type HubNotificationRecipient,
} from '@/data/hub-notification-recipients'
import {
  formatIcs233NotificationTimestamp,
  stableNotificationIdFromUuid,
} from '@/lib/ics233-notification-service'
import { getSupabaseClient } from '@/lib/supabase'

export type HubUserNotificationRow = {
  id: string
  recipient_email: string
  title: string
  summary: string
  severity: string
  created_by_email: string | null
  created_at: string
}

export type PersistHubUserNotificationInput = {
  recipientEmail: string
  title: string
  summary: string
  severity?: string
  createdByEmail?: string | null
}

function mapHubUserNotificationRow(row: HubUserNotificationRow): HubUserNotificationRow {
  return {
    ...row,
    recipient_email: row.recipient_email.toLowerCase(),
  }
}

export { formatIcs233NotificationTimestamp as formatHubNotificationTimestamp, stableNotificationIdFromUuid }

export async function fetchHubNotificationRecipients(
  currentUserEmail: string | null,
  isOrgAdmin: boolean
): Promise<HubNotificationRecipient[]> {
  const normalizedCurrentEmail = currentUserEmail?.trim().toLowerCase() ?? null
  const supabase = getSupabaseClient()

  if (!supabase) {
    return HUB_NOTIFICATION_RECIPIENTS.filter(
      (recipient) => recipient.email.toLowerCase() !== normalizedCurrentEmail
    )
  }

  if (isOrgAdmin) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      .order('full_name')

    if (!error && data && data.length > 0) {
      return dedupeHubNotificationRecipients(
        data
          .map((profile) => ({
            id: profile.email,
            name: profile.full_name?.trim() || profile.email.split('@')[0],
            email: profile.email,
          }))
          .filter((recipient) => recipient.email.toLowerCase() !== normalizedCurrentEmail)
      )
    }
  }

  return HUB_NOTIFICATION_RECIPIENTS.filter(
    (recipient) => recipient.email.toLowerCase() !== normalizedCurrentEmail
  )
}

export async function persistHubUserNotifications(
  notifications: PersistHubUserNotificationInput[]
): Promise<HubUserNotificationRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase || notifications.length === 0) {
    return []
  }

  const rows = notifications.map((notification) => ({
    recipient_email: notification.recipientEmail.trim().toLowerCase(),
    title: notification.title.trim(),
    summary: notification.summary.trim(),
    severity: notification.severity ?? 'Medium',
    created_by_email: notification.createdByEmail?.trim().toLowerCase() ?? null,
  }))

  const { data, error } = await supabase.from('hub_user_notifications').insert(rows).select('*')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as HubUserNotificationRow[]).map(mapHubUserNotificationRow)
}

export async function fetchRecentHubUserNotifications(
  recipientEmail: string,
  limit = 50
): Promise<HubUserNotificationRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const { data, error } = await supabase
    .from('hub_user_notifications')
    .select('*')
    .eq('recipient_email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as HubUserNotificationRow[]).map(mapHubUserNotificationRow)
}

export function subscribeToHubUserNotifications(
  recipientEmail: string,
  onNotification: (notification: HubUserNotificationRow) => void
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return () => undefined
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const channel = supabase
    .channel(`hub-notifications:${normalizedEmail}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'hub_user_notifications',
        filter: `recipient_email=eq.${normalizedEmail}`,
      },
      (payload) => {
        onNotification(mapHubUserNotificationRow(payload.new as HubUserNotificationRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
