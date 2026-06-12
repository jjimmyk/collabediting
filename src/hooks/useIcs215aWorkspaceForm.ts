import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics215aFormState, Ics215aVersion } from '@/features/ics215a/types'
import {
  cloneIcs215aFormState,
  createEmptyIcs215aForm,
  createLocalIcs215aDocumentId,
  ics215aAuthorColor,
} from '@/features/ics215a/utils'
import {
  appendIcs215aVersion,
  fetchOrCreateIcs215aDocument,
  bundleToClientState,
  saveIcs215aDraft,
  saveIcs215aSignedReview,
} from '@/lib/ics215a-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs215aWorkspaceFormOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  workspaceDefaults?: Partial<Ics215aFormState>
  onLoaded: (payload: { form: Ics215aFormState; versions: Ics215aVersion[] }) => void
}

export function useIcs215aWorkspaceForm({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  workspaceDefaults,
  onLoaded,
}: UseIcs215aWorkspaceFormOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics215aAuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId) {
        setError(null)
        return
      }

      if (!isSupabaseConfigured) {
        const localId = createLocalIcs215aDocumentId()
        const form = createEmptyIcs215aForm(localId, workspaceDefaults)
        const initialVersion: Ics215aVersion = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs215aFormState(form),
          signatures: [],
        }
        onLoadedRef.current({ form, versions: [initialVersion] })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundle = await fetchOrCreateIcs215aDocument(workspaceId, {
          form: workspaceDefaults,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (cancelled || !bundle) return
        onLoadedRef.current(bundleToClientState(bundle))
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load ICS-215A form'
          )
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
      form: Ics215aFormState,
      latestVersion: Ics215aVersion | null
    ): Promise<Ics215aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs215aDraft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-215A')
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
      form: Ics215aFormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics215aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs215aVersion({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(
          appendError instanceof Error ? appendError.message : 'Failed to save ICS-215A version'
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
      form: Ics215aFormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics215aVersion | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs215aSignedReview({
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
          saveError instanceof Error ? saveError.message : 'Failed to save ICS-215A signature'
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
