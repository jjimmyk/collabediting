import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics205aFormState, Ics205aVersion } from '@/features/ics205a/types'
import {
  cloneIcs205aFormState,
  createEmptyIcs205aForm,
  createLocalIcs205aDocumentId,
  ics205aAuthorColor,
} from '@/features/ics205a/utils'
import {
  appendIcs205aVersion,
  fetchOrCreateIcs205aDocument,
  bundleToClientState,
  saveIcs205aDraft,
  saveIcs205aSignedReview,
} from '@/lib/ics205a-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs205aWorkspaceFormOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  workspaceDefaults?: Partial<Ics205aFormState>
  onLoaded: (payload: { form: Ics205aFormState; versions: Ics205aVersion[] }) => void
}

export function useIcs205aWorkspaceForm({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  workspaceDefaults,
  onLoaded,
}: UseIcs205aWorkspaceFormOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics205aAuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId) {
        setError(null)
        return
      }

      if (!isSupabaseConfigured) {
        const localId = createLocalIcs205aDocumentId()
        const form = createEmptyIcs205aForm(localId, workspaceDefaults)
        const initialVersion: Ics205aVersion = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs205aFormState(form),
          signatures: [],
        }
        onLoadedRef.current({ form, versions: [initialVersion] })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundle = await fetchOrCreateIcs205aDocument(workspaceId, {
          form: workspaceDefaults,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (cancelled || !bundle) return
        onLoadedRef.current(bundleToClientState(bundle))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load ICS-205A form')
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
      form: Ics205aFormState,
      latestVersion: Ics205aVersion | null
    ): Promise<Ics205aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs205aDraft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-205A')
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
      form: Ics205aFormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics205aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs205aVersion({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(
          appendError instanceof Error ? appendError.message : 'Failed to save ICS-205A version'
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
      form: Ics205aFormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics205aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs205aSignedReview({
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
          saveError instanceof Error ? saveError.message : 'Failed to save ICS-205A signature'
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
