import { getSupabaseClient } from '@/lib/supabase'

export type Ics233ActionNotificationRow = {
  id: string
  workspace_id: string
  recipient_email: string
  title: string
  summary: string
  severity: string
  action_row_id: number | null
  created_by_email: string | null
  created_at: string
}

export type PersistIcs233ActionNotificationInput = {
  recipientEmail: string
  title: string
  summary: string
  severity?: string
  actionRowId?: number
  createdByEmail?: string | null
}

function mapIcs233ActionNotificationRow(row: Ics233ActionNotificationRow): Ics233ActionNotificationRow {
  return {
    ...row,
    recipient_email: row.recipient_email.toLowerCase(),
  }
}

export async function persistIcs233ActionNotifications(
  workspaceId: string,
  notifications: PersistIcs233ActionNotificationInput[]
): Promise<Ics233ActionNotificationRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase || notifications.length === 0) {
    return []
  }

  const rows = notifications.map((notification) => ({
    workspace_id: workspaceId,
    recipient_email: notification.recipientEmail.trim().toLowerCase(),
    title: notification.title,
    summary: notification.summary,
    severity: notification.severity ?? 'Medium',
    action_row_id: notification.actionRowId ?? null,
    created_by_email: notification.createdByEmail?.trim().toLowerCase() ?? null,
  }))

  const { data, error } = await supabase
    .from('ics233_action_notifications')
    .insert(rows)
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics233ActionNotificationRow[]).map(mapIcs233ActionNotificationRow)
}

export async function fetchRecentIcs233ActionNotifications(
  recipientEmail: string,
  limit = 50
): Promise<Ics233ActionNotificationRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const { data, error } = await supabase
    .from('ics233_action_notifications')
    .select('*')
    .eq('recipient_email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics233ActionNotificationRow[]).map(mapIcs233ActionNotificationRow)
}

export function subscribeToIcs233ActionNotifications(
  recipientEmail: string,
  onNotification: (notification: Ics233ActionNotificationRow) => void
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return () => undefined
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const channel = supabase
    .channel(`ics233-notifications:${normalizedEmail}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ics233_action_notifications',
        filter: `recipient_email=eq.${normalizedEmail}`,
      },
      (payload) => {
        onNotification(mapIcs233ActionNotificationRow(payload.new as Ics233ActionNotificationRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
