import * as Y from 'yjs'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Ics201SectionId } from '@/features/ics201/types'
import { decodeBytea, encodeBytea, ICS201_YJS_REMOTE_ORIGIN } from '@/lib/ics201-crdt-utils'
import { getSupabaseClient } from '@/lib/supabase'

export type Ics201YjsProvider = {
  destroy: () => void
  persistNow: () => Promise<void>
}

export function createIcs201YjsProvider(options: {
  doc: Y.Doc
  documentId: string
  sectionId: Ics201SectionId
  onPersist: (state: Uint8Array) => Promise<void>
  debounceMs?: number
}): Ics201YjsProvider {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      destroy: () => undefined,
      persistNow: async () => undefined,
    }
  }

  let persistTimer: number | null = null
  let isSubscribed = false
  const channelName = `ics201-yjs:${options.documentId}:${options.sectionId}`

  const persistState = async () => {
    await options.onPersist(Y.encodeStateAsUpdate(options.doc))
  }

  const schedulePersist = () => {
    if (persistTimer !== null) {
      window.clearTimeout(persistTimer)
    }
    persistTimer = window.setTimeout(() => {
      persistTimer = null
      void persistState()
    }, options.debounceMs ?? 3000)
  }

  const broadcastUpdate = (update: Uint8Array, channel: RealtimeChannel) => {
    if (!isSubscribed) return
    void channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { update: encodeBytea(update) },
    })
  }

  const applyRemoteUpdate = (encodedUpdate: string) => {
    try {
      const update = decodeBytea(encodedUpdate)
      if (update.length === 0) return
      Y.applyUpdate(options.doc, update, ICS201_YJS_REMOTE_ORIGIN)
    } catch {
      // Ignore malformed remote updates.
    }
  }

  const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === ICS201_YJS_REMOTE_ORIGIN) return
    schedulePersist()
    if (channelRef) {
      broadcastUpdate(update, channelRef)
    }
  }

  options.doc.on('update', handleLocalUpdate)

  const channelRef = supabase.channel(channelName)

  channelRef.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
    if (!payload || typeof payload !== 'object') return
    const update = (payload as { update?: string }).update
    if (!update) return
    applyRemoteUpdate(update)
  })

  channelRef.on('broadcast', { event: 'yjs-sync' }, ({ payload }) => {
    if (!payload || typeof payload !== 'object') return
    const update = (payload as { update?: string }).update
    if (!update) return
    applyRemoteUpdate(update)
  })

  void channelRef.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      isSubscribed = true
      void channelRef.send({
        type: 'broadcast',
        event: 'yjs-sync',
        payload: { update: encodeBytea(Y.encodeStateAsUpdate(options.doc)) },
      })
    }
    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      isSubscribed = false
    }
  })

  return {
    destroy: () => {
      if (persistTimer !== null) {
        window.clearTimeout(persistTimer)
        persistTimer = null
      }
      options.doc.off('update', handleLocalUpdate)
      isSubscribed = false
      void supabase.removeChannel(channelRef)
    },
    persistNow: async () => {
      if (persistTimer !== null) {
        window.clearTimeout(persistTimer)
        persistTimer = null
      }
      await persistState()
    },
  }
}
