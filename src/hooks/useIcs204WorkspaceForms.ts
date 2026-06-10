import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import type { Ics204FormState, Ics204Version } from '@/features/ics204/types'
import {
  cloneIcs204FormState,
  createEmptyIcs204Form,
  createLocalIcs204DocumentId,
  ics204AuthorColor,
} from '@/features/ics204/utils'
import {
  appendIcs204Version,
  bundlesToClientState,
  createIcs204Document,
  deleteIcs204Document,
  fetchIcs204DocumentsForWorkspace,
  saveIcs204Draft,
  saveIcs204SignedReview,
} from '@/lib/ics204-service'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseIcs204WorkspaceFormsOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  onLoaded: (payload: {
    forms: Ics204FormState[]
    versionsById: Record<string, Ics204Version[]>
  }) => void
}

export function useIcs204WorkspaceForms({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  onLoaded,
}: UseIcs204WorkspaceFormsOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const onLoadedRef = useRef(onLoaded)

  useEffect(() => {
    onLoadedRef.current = onLoaded
  }, [onLoaded])

  const authorName = profileEmail ?? 'You'
  const authorColor = ics204AuthorColor(userId)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId || !isSupabaseConfigured) {
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const bundles = await fetchIcs204DocumentsForWorkspace(workspaceId)
        if (cancelled) return
        onLoadedRef.current(bundlesToClientState(bundles))
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load ICS-204 forms')
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
  }, [enabled, workspaceId])

  const createForm = useCallback(
    async (
      partial?: Partial<Ics204FormState>
    ): Promise<{ form: Ics204FormState; versions: Ics204Version[] } | null> => {
      if (!enabled || !workspaceId) {
        const localId = createLocalIcs204DocumentId()
        const form = { ...createEmptyIcs204Form(localId, partial?.assignedUnit), ...partial, id: localId }
        const initialVersion: Ics204Version = {
          id: `local-v-${localId}`,
          createdAt: Date.now(),
          authorName,
          authorColor,
          snapshot: cloneIcs204FormState(form),
          signatures: [],
        }
        return { form, versions: [initialVersion] }
      }

      setIsSaving(true)
      try {
        const bundle = await createIcs204Document(workspaceId, {
          form: partial,
          authorId: userId,
          authorName,
          authorColor,
        })
        if (!bundle) return null
        return {
          form: cloneIcs204FormState(bundle.document.form_data),
          versions: bundle.versions,
        }
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : 'Failed to create ICS-204')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, enabled, userId, workspaceId]
  )

  const deleteForm = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return true
      }

      setIsSaving(true)
      try {
        await deleteIcs204Document(documentId)
        return true
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete ICS-204')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [enabled, workspaceId]
  )

  const saveDraft = useCallback(
    async (
      documentId: string,
      form: Ics204FormState,
      latestVersion: Ics204Version | null
    ): Promise<Ics204Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs204Draft({
          documentId,
          snapshot: form,
          latestVersion,
          authorId: userId,
          authorName,
          authorColor,
          signatures: latestVersion?.signatures ?? [],
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-204')
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
      form: Ics204FormState,
      signatures: Ics201VersionSignature[] = []
    ): Promise<Ics204Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await appendIcs204Version({
          documentId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (appendError) {
        setError(appendError instanceof Error ? appendError.message : 'Failed to save ICS-204 version')
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
      form: Ics204FormState,
      versionId: string,
      signatures: Ics201VersionSignature[]
    ): Promise<Ics204Version | null> => {
      if (!enabled || !workspaceId || documentId.startsWith('local-')) {
        return null
      }

      setIsSaving(true)
      try {
        return await saveIcs204SignedReview({
          documentId,
          versionId,
          snapshot: form,
          authorId: userId,
          authorName,
          authorColor,
          signatures,
        })
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Failed to save ICS-204 signature')
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
    createForm,
    deleteForm,
    saveDraft,
    appendVersion,
    saveSignedReview,
  }
}
