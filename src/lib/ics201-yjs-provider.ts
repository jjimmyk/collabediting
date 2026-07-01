import * as Y from 'yjs'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Ics201SectionId } from '@/features/ics201/types'
import { decodeBytea, encodeBytea, ICS201_YJS_REMOTE_ORIGIN } from '@/lib/ics201-crdt-utils'
import { isIcs201Il4StrictMode } from '@/lib/ics201-sync-transport'
import { getSupabaseClient } from '@/lib/supabase'

export type Ics201YjsProvider = {
  destroy: () => void
  persistNow: () => Promise<void>
}

const DEFAULT_BROADCAST_FLUSH_MS = 50
const DEFAULT_PERSIST_DEBOUNCE_MS = 1500

export function mergeYjsBroadcastUpdates(updates: Uint8Array[]): Uint8Array | null {
  if (updates.length === 0) return null
  if (updates.length === 1) return updates[0]
  return Y.mergeUpdates(updates)
}

export function applyRemoteYjsState(doc: Y.Doc, remoteState: Uint8Array): void {
  if (remoteState.length === 0) return

  const remoteDoc = new Y.Doc()
  try {
    Y.applyUpdate(remoteDoc, remoteState)
    const diff = Y.encodeStateAsUpdate(remoteDoc, Y.encodeStateVector(doc))
    if (diff.length > 0) {
      Y.applyUpdate(doc, diff, ICS201_YJS_REMOTE_ORIGIN)
    }
  } finally {
    remoteDoc.destroy()
  }
}

export function createIcs201YjsProvider(options: {
  doc: Y.Doc
  documentId: string
  sectionId: Ics201SectionId
  onPersist: (state: Uint8Array) => Promise<void>
  debounceMs?: number
  broadcastFlushMs?: number
}): Ics201YjsProvider {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      destroy: () => undefined,
      persistNow: async () => undefined,
    }
  }

  let persistTimer: number | null = null
  let broadcastTimer: number | null = null
  let postgresApplyTimer: number | null = null
  let pendingBroadcastUpdates: Uint8Array[] = []
  let pendingPostgresState: Uint8Array | null = null
  let isSubscribed = false
  let lastAppliedPostgresAt = ''
  const channelName = `ics201-yjs:${options.documentId}:${options.sectionId}`
  const broadcastFlushMs = options.broadcastFlushMs ?? DEFAULT_BROADCAST_FLUSH_MS
  const persistDebounceMs = options.debounceMs ?? DEFAULT_PERSIST_DEBOUNCE_MS

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
    }, persistDebounceMs)
  }

  const broadcastUpdate = (update: Uint8Array, channel: RealtimeChannel) => {
    if (isIcs201Il4StrictMode() || !isSubscribed || update.length === 0) return
    void channel.send({
      type: 'broadcast',
      event: 'yjs-update',
      payload: { update: encodeBytea(update) },
    })
  }

  const flushBroadcast = (channel: RealtimeChannel) => {
    broadcastTimer = null
    const merged = mergeYjsBroadcastUpdates(pendingBroadcastUpdates)
    pendingBroadcastUpdates = []
    if (merged) {
      broadcastUpdate(merged, channel)
    }
  }

  const queueBroadcast = (update: Uint8Array, channel: RealtimeChannel) => {
    if (isIcs201Il4StrictMode() || update.length === 0) return
    pendingBroadcastUpdates.push(update)
    if (broadcastTimer === null) {
      broadcastTimer = window.setTimeout(() => flushBroadcast(channel), broadcastFlushMs)
    }
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

  const schedulePostgresStateApply = () => {
    if (postgresApplyTimer !== null) {
      window.clearTimeout(postgresApplyTimer)
    }
    postgresApplyTimer = window.setTimeout(() => {
      postgresApplyTimer = null
      const state = pendingPostgresState
      pendingPostgresState = null
      if (!state) return
      applyRemoteYjsState(options.doc, state)
    }, 500)
  }

  const handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === ICS201_YJS_REMOTE_ORIGIN) return
    schedulePersist()
    if (channelRef) {
      queueBroadcast(update, channelRef)
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

  const postgresChannel = supabase
    .channel(`ics201-yjs-persist:${options.documentId}:${options.sectionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ics201_section_crdt',
        filter: `document_id=eq.${options.documentId}`,
      },
      (payload) => {
        const row = payload.new as {
          section_id?: string
          state?: string
          updated_at?: string
        }
        if (row.section_id !== options.sectionId || !row.state) return
        if (row.updated_at && row.updated_at <= lastAppliedPostgresAt) return
        if (row.updated_at) {
          lastAppliedPostgresAt = row.updated_at
        }
        pendingPostgresState = decodeBytea(row.state)
        schedulePostgresStateApply()
      }
    )
    .subscribe()

  return {
    destroy: () => {
      if (persistTimer !== null) {
        window.clearTimeout(persistTimer)
        persistTimer = null
      }
      if (broadcastTimer !== null) {
        window.clearTimeout(broadcastTimer)
        broadcastTimer = null
      }
      if (postgresApplyTimer !== null) {
        window.clearTimeout(postgresApplyTimer)
        postgresApplyTimer = null
      }
      pendingBroadcastUpdates = []
      pendingPostgresState = null
      options.doc.off('update', handleLocalUpdate)
      isSubscribed = false
      void supabase.removeChannel(channelRef)
      void supabase.removeChannel(postgresChannel)
    },
    persistNow: async () => {
      if (persistTimer !== null) {
        window.clearTimeout(persistTimer)
        persistTimer = null
      }
      if (broadcastTimer !== null && channelRef) {
        window.clearTimeout(broadcastTimer)
        broadcastTimer = null
        flushBroadcast(channelRef)
      }
      await persistState()
    },
  }
}
