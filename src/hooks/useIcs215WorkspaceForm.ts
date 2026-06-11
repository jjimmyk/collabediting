import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics215FormState, Ics215Version } from '@/features/ics215/types'
import {
  cloneIcs215FormState,
  createEmptyIcs215Form,
  createLocalIcs215DocumentId,
  ics215AuthorColor,
} from '@/features/ics215/utils'
import {
  appendIcs215Version,
  fetchOrCreateIcs215Document,
  bundleToClientState,
  saveIcs215Draft,
  saveIcs215SignedReview,
} from '@/lib/ics215-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs215WorkspaceFormOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  workspaceDefaults?: Partial<Ics215FormState>
  onLoaded: (payload: { form: Ics215FormState; versions: Ics215Version[] }) => void
}

export function useIcs215WorkspaceForm({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  workspaceDefaults,
  onLoaded,
}: UseIcs215WorkspaceFormOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics215AuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId) {
        setError(null)
        return
      }

      if (!isSupabaseConfigured) {
        const localId = createLocalIcs215DocumentId()
        const form = createEmptyIcs215Form(localId, workspaceDefaults)
        const initialVersion: Ics215Version = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs215FormState(form),
          signatures: [],
        }
        onLoadedRef.current({ form, versions: [initialVersion] })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundle = await fetchOrCreateIcs215Document(workspaceId, {
          form: workspaceDefaults,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (cancelled || !bundle) return
        onLoadedRef.current(bundleToClientState(bundle))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load ICS-215 form')
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
      form: Ics215FormState,
      latestVersion: Ics215Version | null
    ): Promise<Ics215Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs215Draft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-215')
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
      form: Ics215FormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics215Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs215Version({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(
          appendError instanceof Error ? appendError.message : 'Failed to save ICS-215 version'
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
      form: Ics215FormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics215Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs215SignedReview({
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
          saveError instanceof Error ? saveError.message : 'Failed to save ICS-215 signature'
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
