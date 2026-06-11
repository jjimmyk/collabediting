import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics206FormState, Ics206Version } from '@/features/ics206/types'
import {
  cloneIcs206FormState,
  createEmptyIcs206Form,
  createLocalIcs206DocumentId,
  ics206AuthorColor,
} from '@/features/ics206/utils'
import {
  appendIcs206Version,
  fetchOrCreateIcs206Document,
  bundleToClientState,
  saveIcs206Draft,
  saveIcs206SignedReview,
} from '@/lib/ics206-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs206WorkspaceFormOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  workspaceDefaults?: Partial<Ics206FormState>
  onLoaded: (payload: { form: Ics206FormState; versions: Ics206Version[] }) => void
}

export function useIcs206WorkspaceForm({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  workspaceDefaults,
  onLoaded,
}: UseIcs206WorkspaceFormOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics206AuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId) {
        setError(null)
        return
      }

      if (!isSupabaseConfigured) {
        const localId = createLocalIcs206DocumentId()
        const form = createEmptyIcs206Form(localId, workspaceDefaults)
        const initialVersion: Ics206Version = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs206FormState(form),
          signatures: [],
        }
        onLoadedRef.current({ form, versions: [initialVersion] })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundle = await fetchOrCreateIcs206Document(workspaceId, {
          form: workspaceDefaults,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (cancelled || !bundle) return
        onLoadedRef.current(bundleToClientState(bundle))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load ICS-206 form')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [authorColor, authorName, enabled, userId, workspaceDefaults, workspaceId])

  const saveDraft = useCallback(
    async (
      documentId: string,
      form: Ics206FormState,
      latestVersion: Ics206Version | null
    ): Promise<Ics206Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs206Draft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-206')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, enabled, userId, workspaceId]
  )

  const appendVersion = useCallback(
    async (
      documentId: string,
      form: Ics206FormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics206Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs206Version({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(
          appendError instanceof Error ? appendError.message : 'Failed to save ICS-206 version'
        )
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, enabled, userId, workspaceId]
  )

  const saveSignedReview = useCallback(
    async (
      documentId: string,
      form: Ics206FormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics206Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs206SignedReview({
          documentId,
          versionId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : 'Failed to save ICS-206 signature'
        )
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, enabled, userId, workspaceId]
  )

  return {
    loading,
    error,
    isSaving,
    saveDraft,
    appendVersion,
    saveSignedReview,
  }
}
