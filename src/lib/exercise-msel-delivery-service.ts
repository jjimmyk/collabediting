import { getSupabaseClient } from '@/lib/supabase'
import type { MselInjectDelivery } from '@/features/exercise-msel/types'
import { mapDeliveryRow } from '@/features/exercise-msel/delivery-utils'

export type SendMselInjectParams = {
  accessToken: string
  workspaceId: string
  injectId: number
  recipientEmails: string[]
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'
}

export async function sendMselInjectViaApi(
  params: SendMselInjectParams
): Promise<MselInjectDelivery[]> {
  const response = await fetch('/api/send-msel-inject', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      injectId: params.injectId,
      recipientEmails: params.recipientEmails,
      severity: params.severity ?? 'Medium',
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    deliveries?: MselInjectDelivery[]
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not send MSEL inject.')
  }

  return (payload.deliveries ?? []).map((delivery) => mapDeliveryRow(delivery as unknown as Record<string, unknown>))
}

export async function fetchMselInjectDeliveriesForWorkspace(
  workspaceId: string
): Promise<MselInjectDelivery[]> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('exercise_msel_inject_deliveries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => mapDeliveryRow(row as Record<string, unknown>))
}

export function subscribeToMselInjectDeliveries(
  workspaceId: string,
  onDelivery: (delivery: MselInjectDelivery) => void
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return () => undefined
  }

  const channel = supabase
    .channel(`exercise-msel-deliveries:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'exercise_msel_inject_deliveries',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        onDelivery(mapDeliveryRow(payload.new as Record<string, unknown>))
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
