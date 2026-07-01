import type { Ics201SectionId } from '@/features/ics201/types'
import { getIcs201SyncTransport } from '@/lib/ics201-sync-transport-supabase'

/**
 * Field key conventions (see ics201-cursor-bindings.ts):
 * content | objective:{id} | reportInfo.{field} | incidentBriefing.{field}
 * actions:{id}.{task|owner|startTime|endTime} | orgChart.{field}
 * resources:{id}.{field} | safetyAnalysis:{id}.{field}
 * mapSketch:{index}.lat|lng | map:draw (anchor=lat×1e6, head=lng×1e6)
 */

export type Ics201CursorState = {
  userId: string
  userColor: string
  userInitials: string
  sectionId: Ics201SectionId
  fieldKey: string
  anchor: number
  head: number
  updatedAt: number
}

export const ICS201_CURSOR_THROTTLE_MS = 150
export const ICS201_CURSOR_STALE_MS = 5000

export function ics201CursorChannelName(documentId: string, sectionId: Ics201SectionId) {
  return `ics201-cursor:${documentId}:${sectionId}`
}

export function createIcs201CursorChannel(options: {
  documentId: string
  sectionId: Ics201SectionId
  selfUserId: string
  onRemoteCursor: (cursor: Ics201CursorState) => void
  onRemoteCursorClear: (userId: string) => void
}) {
  const transport = getIcs201SyncTransport()
  if (!transport) {
    return {
      publish: (_cursor: Omit<Ics201CursorState, 'updatedAt'>) => undefined,
      clear: () => undefined,
      destroy: () => undefined,
    }
  }

  const channelName = ics201CursorChannelName(options.documentId, options.sectionId)
  let lastPublishAt = 0
  let pendingCursor: Omit<Ics201CursorState, 'updatedAt'> | null = null
  let publishTimer: number | null = null

  const subscription = transport.subscribeBroadcast(channelName, {
    'cursor-update': (_event, payload) => {
      const userId = String(payload.userId ?? '')
      if (!userId || userId === options.selfUserId) return
      options.onRemoteCursor({
        userId,
        userColor: String(payload.userColor ?? '#16a34a'),
        userInitials: String(payload.userInitials ?? '?'),
        sectionId: options.sectionId,
        fieldKey: String(payload.fieldKey ?? 'content'),
        anchor: Number(payload.anchor ?? 0),
        head: Number(payload.head ?? 0),
        updatedAt: Number(payload.updatedAt ?? Date.now()),
      })
    },
    'cursor-clear': (_event, payload) => {
      const userId = String(payload.userId ?? '')
      if (!userId || userId === options.selfUserId) return
      options.onRemoteCursorClear(userId)
    },
  })

  const flushPublish = () => {
    publishTimer = null
    if (!pendingCursor) return
    const cursor = pendingCursor
    pendingCursor = null
    subscription.send('cursor-update', {
      ...cursor,
      updatedAt: Date.now(),
    })
  }

  const publish = (cursor: Omit<Ics201CursorState, 'updatedAt'>) => {
    pendingCursor = cursor
    const now = Date.now()
    const elapsed = now - lastPublishAt
    if (elapsed >= ICS201_CURSOR_THROTTLE_MS) {
      lastPublishAt = now
      flushPublish()
      return
    }
    if (publishTimer === null) {
      publishTimer = window.setTimeout(() => {
        lastPublishAt = Date.now()
        flushPublish()
      }, ICS201_CURSOR_THROTTLE_MS - elapsed)
    }
  }

  const clear = () => {
    if (publishTimer !== null) {
      window.clearTimeout(publishTimer)
      publishTimer = null
    }
    pendingCursor = null
    subscription.send('cursor-clear', { userId: options.selfUserId })
  }

  return {
    publish,
    clear,
    destroy: () => {
      clear()
      subscription.unsubscribe()
    },
  }
}

export function pruneStaleIcs201Cursors(
  cursors: Map<string, Ics201CursorState>,
  now = Date.now()
): Map<string, Ics201CursorState> {
  const next = new Map<string, Ics201CursorState>()
  cursors.forEach((cursor, userId) => {
    if (now - cursor.updatedAt <= ICS201_CURSOR_STALE_MS) {
      next.set(userId, cursor)
    }
  })
  return next
}
