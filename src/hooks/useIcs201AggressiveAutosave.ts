import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201FormState, Ics201SectionId } from '@/features/ics201/types'
import { Ics201AutosaveScheduler } from '@/lib/ics201-autosave-scheduler'
import { hashIcs201FormState } from '@/lib/ics201-content-hash'
import { appendIcs201EditAudit } from '@/lib/ics201-edit-audit'
import type { Ics201SaveStatus } from '@/features/ics201/Ics201SaveStatusIndicator'

type UseIcs201AggressiveAutosaveOptions = {
  enabled: boolean
  documentId: string | null
  userId: string | null
  canEdit: boolean
  getLiveSnapshot: () => Ics201FormState
  getLastEditedSection: () => Ics201SectionId | null
  onPatchForm: (snapshot: Ics201FormState) => Promise<void>
  onCheckpointVersion: (snapshot: Ics201FormState, sectionId: Ics201SectionId | null) => Promise<void>
  persistCollaborative?: () => Promise<void>
  isLatestSigned: boolean
  onEnsureUnsignedBaseline?: () => Promise<void>
}

export function useIcs201AggressiveAutosave({
  enabled,
  documentId,
  userId,
  canEdit,
  getLiveSnapshot,
  getLastEditedSection,
  onPatchForm,
  onCheckpointVersion,
  persistCollaborative,
  isLatestSigned,
  onEnsureUnsignedBaseline,
}: UseIcs201AggressiveAutosaveOptions) {
  const [status, setStatus] = useState<Ics201SaveStatus>('idle')
  const lastSavedHashRef = useRef<string | null>(null)
  const lastCheckpointHashRef = useRef<string | null>(null)
  const schedulerRef = useRef<Ics201AutosaveScheduler | null>(null)
  const getLiveSnapshotRef = useRef(getLiveSnapshot)
  const getLastEditedSectionRef = useRef(getLastEditedSection)

  useEffect(() => {
    getLiveSnapshotRef.current = getLiveSnapshot
  }, [getLiveSnapshot])

  useEffect(() => {
    getLastEditedSectionRef.current = getLastEditedSection
  }, [getLastEditedSection])

  const runTier1 = useCallback(async () => {
    if (!enabled || !canEdit || !documentId) return
    const snapshot = getLiveSnapshotRef.current()
    const contentHash = await hashIcs201FormState(snapshot)
    if (contentHash === lastSavedHashRef.current) return

    if (isLatestSigned && onEnsureUnsignedBaseline) {
      await onEnsureUnsignedBaseline()
    }

    setStatus('saving')
    try {
      if (persistCollaborative) {
        await persistCollaborative()
      }
      await onPatchForm(snapshot)
      await appendIcs201EditAudit({
        documentId,
        userId,
        sectionId: getLastEditedSectionRef.current(),
        eventType: 'form_patch',
        contentHash,
      })
      lastSavedHashRef.current = contentHash
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [
    canEdit,
    documentId,
    enabled,
    isLatestSigned,
    onEnsureUnsignedBaseline,
    onPatchForm,
    persistCollaborative,
    userId,
  ])

  const runTier2Checkpoint = useCallback(async () => {
    if (!enabled || !canEdit || !documentId) return
    const snapshot = getLiveSnapshotRef.current()
    const contentHash = await hashIcs201FormState(snapshot)
    if (contentHash === lastCheckpointHashRef.current) return

    if (isLatestSigned && onEnsureUnsignedBaseline) {
      await onEnsureUnsignedBaseline()
    }

    setStatus('saving')
    try {
      if (persistCollaborative) {
        await persistCollaborative()
      }
      await onCheckpointVersion(snapshot, getLastEditedSectionRef.current())
      await appendIcs201EditAudit({
        documentId,
        userId,
        sectionId: getLastEditedSectionRef.current(),
        eventType: 'checkpoint_version',
        contentHash,
      })
      lastSavedHashRef.current = contentHash
      lastCheckpointHashRef.current = contentHash
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [
    canEdit,
    documentId,
    enabled,
    isLatestSigned,
    onCheckpointVersion,
    onEnsureUnsignedBaseline,
    persistCollaborative,
    userId,
  ])

  useEffect(() => {
    if (!enabled || !canEdit) {
      schedulerRef.current?.destroy()
      schedulerRef.current = null
      setStatus('idle')
      return undefined
    }

    const scheduler = new Ics201AutosaveScheduler({
      onTier1: runTier1,
      onTier2Checkpoint: runTier2Checkpoint,
    })
    schedulerRef.current = scheduler

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void scheduler.flushNow()
      }
    }
    const handleBeforeUnload = () => {
      void scheduler.flushNow()
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      scheduler.destroy()
      schedulerRef.current = null
    }
  }, [canEdit, enabled, runTier1, runTier2Checkpoint])

  const markDirty = useCallback(() => {
    schedulerRef.current?.markDirty()
  }, [])

  const flushNow = useCallback(async () => {
    await schedulerRef.current?.flushNow()
  }, [])

  const onSectionBlur = useCallback(() => {
    schedulerRef.current?.onSectionBlur()
  }, [])

  return { status, markDirty, flushNow, onSectionBlur }
}
