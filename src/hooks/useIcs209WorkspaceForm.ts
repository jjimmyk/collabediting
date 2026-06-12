import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics209FormState, Ics209Version } from '@/features/ics209/types'
import {
  cloneIcs209FormState,
  createEmptyIcs209Form,
  createLocalIcs209DocumentId,
  ics209AuthorColor,
} from '@/features/ics209/utils'
import {
  appendIcs209Version,
  fetchOrCreateIcs209Document,
  bundleToClientState,
  saveIcs209Draft,
  saveIcs209SignedReview,
} from '@/lib/ics209-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs209WorkspaceFormOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  workspaceDefaults?: Partial<Ics209FormState>
  onLoaded: (payload: { form: Ics209FormState; versions: Ics209Version[] }) => void
}

export function useIcs209WorkspaceForm({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  workspaceDefaults,
  onLoaded,
}: UseIcs209WorkspaceFormOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics209AuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId) {
        setError(null)
        return
      }

      if (!isSupabaseConfigured) {
        const localId = createLocalIcs209DocumentId()
        const form = createEmptyIcs209Form(localId, workspaceDefaults)
        const initialVersion: Ics209Version = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs209FormState(form),
          signatures: [],
        }
        onLoadedRef.current({ form, versions: [initialVersion] })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundle = await fetchOrCreateIcs209Document(workspaceId, {
          form: workspaceDefaults,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (cancelled || !bundle) return
        onLoadedRef.current(bundleToClientState(bundle))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load ICS-209 form')
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
      form: Ics209FormState,
      latestVersion: Ics209Version | null
    ): Promise<Ics209Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs209Draft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-209')
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
      form: Ics209FormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics209Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs209Version({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(
          appendError instanceof Error ? appendError.message : 'Failed to save ICS-209 version'
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
      form: Ics209FormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics209Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs209SignedReview({
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
          saveError instanceof Error ? saveError.message : 'Failed to save ICS-209 signature'
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
