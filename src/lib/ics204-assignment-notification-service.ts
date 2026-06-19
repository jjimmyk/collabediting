import { getSupabaseClient } from '@/lib/supabase'

export type Ics204AssignmentNotificationRow = {
  id: string
  workspace_id: string
  recipient_email: string
  title: string
  summary: string
  severity: string
  document_id: string | null
  created_by_email: string | null
  created_at: string
}

export type PersistIcs204AssignmentNotificationInput = {
  recipientEmail: string
  title: string
  summary: string
  severity?: string
  documentId?: string
  createdByEmail?: string | null
}

function mapIcs204AssignmentNotificationRow(
  row: Ics204AssignmentNotificationRow
): Ics204AssignmentNotificationRow {
  return {
    ...row,
    recipient_email: row.recipient_email.toLowerCase(),
  }
}

export function formatIcs204NotificationTimestamp(createdAt: string): string {
  return createdAt.slice(0, 16).replace('T', ' ')
}

export async function persistIcs204AssignmentNotifications(
  workspaceId: string,
  notifications: PersistIcs204AssignmentNotificationInput[]
): Promise<Ics204AssignmentNotificationRow[]> {
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
    document_id: notification.documentId ?? null,
    created_by_email: notification.createdByEmail?.trim().toLowerCase() ?? null,
  }))

  const { data, error } = await supabase
    .from('ics204_assignment_notifications')
    .insert(rows)
    .select('*')

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics204AssignmentNotificationRow[]).map(mapIcs204AssignmentNotificationRow)
}

export async function fetchRecentIcs204AssignmentNotifications(
  recipientEmail: string,
  limit = 50
): Promise<Ics204AssignmentNotificationRow[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const { data, error } = await supabase
    .from('ics204_assignment_notifications')
    .select('*')
    .eq('recipient_email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as Ics204AssignmentNotificationRow[]).map(mapIcs204AssignmentNotificationRow)
}

export function subscribeToIcs204AssignmentNotifications(
  recipientEmail: string,
  onNotification: (notification: Ics204AssignmentNotificationRow) => void
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return () => undefined
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase()
  const channel = supabase
    .channel(`ics204-notifications:${normalizedEmail}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ics204_assignment_notifications',
        filter: `recipient_email=eq.${normalizedEmail}`,
      },
      (payload) => {
        onNotification(mapIcs204AssignmentNotificationRow(payload.new as Ics204AssignmentNotificationRow))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
