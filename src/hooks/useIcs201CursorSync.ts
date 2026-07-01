import { useEffect, useRef, useState } from 'react'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import {
  createIcs201CursorChannel,
  ICS201_CURSOR_STALE_MS,
  pruneStaleIcs201Cursors,
} from '@/lib/ics201-cursor-sync'
import type { Ics201SectionId } from '@/features/ics201/types'

type UseIcs201CursorSyncOptions = {
  enabled: boolean
  documentId: string | null
  sectionId: Ics201SectionId
  selfUserId: string | null
  selfColor: string
  selfInitials: string
}

export function useIcs201CursorSync({
  enabled,
  documentId,
  sectionId,
  selfUserId,
  selfColor,
  selfInitials,
}: UseIcs201CursorSyncOptions) {
  const [remoteCursors, setRemoteCursors] = useState<Ics201CursorState[]>([])
  const channelRef = useRef<ReturnType<typeof createIcs201CursorChannel> | null>(null)

  useEffect(() => {
    if (!enabled || !documentId || !selfUserId) {
      channelRef.current?.destroy()
      channelRef.current = null
      setRemoteCursors([])
      return undefined
    }

    const channel = createIcs201CursorChannel({
      documentId,
      sectionId,
      selfUserId,
      onRemoteCursor: (cursor) => {
        setRemoteCursors((previous) => {
          const map = new Map(previous.map((entry) => [entry.userId, entry]))
          map.set(cursor.userId, cursor)
          return Array.from(pruneStaleIcs201Cursors(map).values())
        })
      },
      onRemoteCursorClear: (userId) => {
        setRemoteCursors((previous) => previous.filter((entry) => entry.userId !== userId))
      },
    })
    channelRef.current = channel

    const staleTimer = window.setInterval(() => {
      setRemoteCursors((previous) => {
        const map = new Map(previous.map((entry) => [entry.userId, entry]))
        const pruned = pruneStaleIcs201Cursors(map)
        if (pruned.size === previous.length) return previous
        return Array.from(pruned.values())
      })
    }, ICS201_CURSOR_STALE_MS)

    return () => {
      window.clearInterval(staleTimer)
      channel.destroy()
      channelRef.current = null
      setRemoteCursors([])
    }
  }, [documentId, enabled, sectionId, selfUserId])

  const publishCursor = (fieldKey: string, anchor: number, head: number) => {
    if (!selfUserId) return
    channelRef.current?.publish({
      userId: selfUserId,
      userColor: selfColor,
      userInitials: selfInitials,
      sectionId,
      fieldKey,
      anchor,
      head,
    })
  }

  const clearCursor = () => {
    channelRef.current?.clear()
  }

  return { remoteCursors, publishCursor, clearCursor }
}
