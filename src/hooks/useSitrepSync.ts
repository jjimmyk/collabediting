import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cloneSitrepFormState,
  isSitrepEditingAnySection,
  sitrepAuthorColorFromId,
} from '@/features/sitrep/utils'
import type {
  SitrepFormState,
  SitrepScopeRef,
  SitrepSection,
  SitrepVersion,
  SitrepVersionSignature,
} from '@/features/sitrep/types'
import {
  fetchOrCreateSitrepDocumentForScope,
  persistSitrepVersion,
  subscribeToSitrepChanges,
} from '@/lib/sitrep-service'

type UseSitrepSyncOptions = {
  enabled: boolean
  scopeRef: SitrepScopeRef | null
  userId: string | null
  profileEmail: string | null
  initialForm: SitrepFormState
  sectionEdits: Partial<Record<SitrepSection, string | null>>
  onLoaded: (payload: {
    documentId: string | null
    form: SitrepFormState
    versions: SitrepVersion[]
  }) => void
  onRemoteFormUpdated: (form: SitrepFormState) => void
  onRemoteVersionInserted: (version: SitrepVersion) => void
  reloadKey?: number
}

export function useSitrepSync({
  enabled,
  scopeRef,
  userId,
  profileEmail,
  initialForm,
  sectionEdits,
  onLoaded,
  onRemoteFormUpdated,
  onRemoteVersionInserted,
  reloadKey = 0,
}: UseSitrepSyncOptions) {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const sectionEditsRef = useRef(sectionEdits)
  const userIdRef = useRef(userId)

  useEffect(() => {
    sectionEditsRef.current = sectionEdits
  }, [sectionEdits])

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const authorEmail = profileEmail?.toLowerCase() ?? null
  const authorName = authorEmail ?? 'You'
  const authorColor = userId ? sitrepAuthorColorFromId(userId) : '#16a34a'

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      if (!enabled || !scopeRef) {
        setDocumentId(null)
        setSyncError(null)
        onLoaded({
          documentId: null,
          form: cloneSitrepFormState(initialForm),
          versions: [],
        })
        return
      }

      setLoading(true)
      setSyncError(null)

      try {
        const bundle = await fetchOrCreateSitrepDocumentForScope(
          scopeRef,
          cloneSitrepFormState(initialForm)
        )
        if (cancelled || !bundle) {
          if (!cancelled && !bundle) {
            onLoaded({
              documentId: null,
              form: cloneSitrepFormState(initialForm),
              versions: [],
            })
          }
          return
        }

        setDocumentId(bundle.document.id)
        onLoaded({
          documentId: bundle.document.id,
          form: bundle.document.form_data,
          versions: bundle.versions,
        })
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Failed to load SITREP')
          onLoaded({
            documentId: null,
            form: cloneSitrepFormState(initialForm),
            versions: [],
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDocument()

    return () => {
      cancelled = true
    }
  }, [enabled, scopeRef, initialForm, onLoaded, reloadKey])

  useEffect(() => {
    if (!enabled || !documentId) return undefined

    return subscribeToSitrepChanges(documentId, {
      onDocumentUpdated: (document) => {
        if (isSitrepEditingAnySection(sectionEditsRef.current)) return
        onRemoteFormUpdated(cloneSitrepFormState(document.form_data))
      },
      onVersionInserted: (version) => {
        onRemoteVersionInserted(version)
        if (
          !isSitrepEditingAnySection(sectionEditsRef.current) &&
          version.authorId !== userIdRef.current
        ) {
          onRemoteFormUpdated(cloneSitrepFormState(version.snapshot))
        }
      },
    })
  }, [documentId, enabled, onRemoteFormUpdated, onRemoteVersionInserted])

  const appendVersion = useCallback(
    async (
      snapshot: SitrepFormState,
      options?: {
        signatures?: SitrepVersionSignature[]
        sectionId?: SitrepSection
        authorNameOverride?: string
        authorColorOverride?: string
        authorRole?: string
        creatorName?: string
        creatorColor?: string
        creatorRole?: string
        creatorCreatedAt?: number
        submittedForReviewTo?: Array<{ name: string; role: string }>
        submittedForReviewAt?: number
        aiGeneratedSections?: SitrepSection[]
      }
    ): Promise<SitrepVersion | null> => {
      if (!enabled || !documentId) {
        return null
      }

      setIsSaving(true)
      try {
        return await persistSitrepVersion({
          documentId,
          snapshot,
          authorId: userId,
          authorName: options?.authorNameOverride ?? authorName,
          authorColor: options?.authorColorOverride ?? authorColor,
          authorRole: options?.authorRole,
          signatures: options?.signatures ?? [],
          sectionId: options?.sectionId,
          creatorName: options?.creatorName,
          creatorColor: options?.creatorColor,
          creatorRole: options?.creatorRole,
          creatorCreatedAt: options?.creatorCreatedAt,
          submittedForReviewTo: options?.submittedForReviewTo,
          submittedForReviewAt: options?.submittedForReviewAt,
          aiGeneratedSections: options?.aiGeneratedSections,
        })
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Failed to save SITREP')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, documentId, enabled, userId]
  )

  return {
    documentId,
    loading,
    syncError,
    isSaving,
    authorName,
    authorEmail,
    authorColor,
    appendVersion,
  }
}
