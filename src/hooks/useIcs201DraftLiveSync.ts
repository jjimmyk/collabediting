import { useCallback, useEffect, useRef } from 'react'
import type { Ics201SectionEditingFlags } from '@/hooks/useIcs201AllSectionCursors'
import {
  createIcs201DraftLiveChannel,
  isEditingIcs201Section,
  type Ics201DraftFieldPatch,
} from '@/lib/ics201-draft-live-sync'

type UseIcs201DraftLiveSyncOptions = {
  enabled: boolean
  documentId: string | null
  selfUserId: string | null
  editingFlags: Ics201SectionEditingFlags
  onRemotePatch: (patch: Ics201DraftFieldPatch) => void
}

export function useIcs201DraftLiveSync({
  enabled,
  documentId,
  selfUserId,
  editingFlags,
  onRemotePatch,
}: UseIcs201DraftLiveSyncOptions) {
  const channelRef = useRef<ReturnType<typeof createIcs201DraftLiveChannel> | null>(null)
  const editingFlagsRef = useRef(editingFlags)
  const onRemotePatchRef = useRef(onRemotePatch)

  useEffect(() => {
    editingFlagsRef.current = editingFlags
  }, [editingFlags])

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
        if (isEditingIcs201Section(editingFlagsRef.current, patch.sectionId)) return
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
