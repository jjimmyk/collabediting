import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Ics201SyncTransport } from '@/lib/ics201-sync-transport'
import { isIcs201Il4StrictMode } from '@/lib/ics201-sync-transport'
import { getSupabaseClient } from '@/lib/supabase'

export function createSupabaseIcs201Transport(): Ics201SyncTransport | null {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  return {
    subscribeBroadcast(channelName, handlers) {
      if (isIcs201Il4StrictMode()) {
        return {
          send: () => undefined,
          unsubscribe: () => undefined,
        }
      }

      const channel = supabase.channel(channelName)
      Object.entries(handlers).forEach(([event, handler]) => {
        channel.on('broadcast', { event }, ({ payload }) => {
          if (!payload || typeof payload !== 'object') return
          handler(event, payload as Record<string, unknown>)
        })
      })

      void channel.subscribe()

      return {
        send(event, payload) {
          void channel.send({ type: 'broadcast', event, payload })
        },
        unsubscribe() {
          void supabase.removeChannel(channel)
        },
      }
    },

    subscribePostgresChanges({ channelName, table, filter, event = 'UPDATE', handler }) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            handler({
              new: (payload.new ?? {}) as Record<string, unknown>,
              old: (payload.old ?? {}) as Record<string, unknown>,
            })
          }
        )
        .subscribe()

      return {
        unsubscribe() {
          void supabase.removeChannel(channel as RealtimeChannel)
        },
      }
    },
  }
}

let sharedTransport: Ics201SyncTransport | null | undefined

export function getIcs201SyncTransport(): Ics201SyncTransport | null {
  if (sharedTransport === undefined) {
    sharedTransport = createSupabaseIcs201Transport()
  }
  return sharedTransport
}
