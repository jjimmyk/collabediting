import { useCallback, useEffect, useRef } from 'react'
import {
  createIcs201DraftLiveChannel,
  type Ics201DraftFieldPatch,
} from '@/lib/ics201-draft-live-sync'

type UseIcs201DraftLiveSyncOptions = {
  enabled: boolean
  documentId: string | null
  selfUserId: string | null
  onRemotePatch: (patch: Ics201DraftFieldPatch) => void
}

export function useIcs201DraftLiveSync({
  enabled,
  documentId,
  selfUserId,
  onRemotePatch,
}: UseIcs201DraftLiveSyncOptions) {
  const channelRef = useRef<ReturnType<typeof createIcs201DraftLiveChannel> | null>(null)
  const onRemotePatchRef = useRef(onRemotePatch)

  useEffect(() => {
    onRemotePatchRef.current = onRemotePatch
  }, [onRemotePatch])

  useEffect(() => {
    if (!enabled || !documentId || !selfUserId) {
      channelRef.current?.destroy()
      channelRef.current = null
      return undefined
    }

    const channel = createIcs201DraftLiveChannel({
      documentId,
      selfUserId,
      onRemotePatch: (patch) => {
        onRemotePatchRef.current(patch)
      },
    })
    channelRef.current = channel

    return () => {
      channel.destroy()
      channelRef.current = null
    }
  }, [documentId, enabled, selfUserId])

  const publishFieldPatch = useCallback((fieldKey: string, value: string) => {
    channelRef.current?.publish(fieldKey, value)
  }, [])

  return { publishFieldPatch }
}
