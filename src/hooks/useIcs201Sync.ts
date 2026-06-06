import { useCallback, useEffect, useRef, useState } from 'react'
import { createInitialIcs201Form } from '@/features/ics201/constants'
import type {
  Ics201FormState,
  Ics201SectionId,
  Ics201StructureMode,
  Ics201Version,
  Ics201VersionSignature,
} from '@/features/ics201/types'
import {
  cloneIcs201FormState,
  ics201AuthorColorFromId,
  isIcs201EditingAnySection,
} from '@/features/ics201/utils'
import {
  fetchOrCreateIcs201Document,
  persistIcs201Version,
  subscribeToIcs201Changes,
} from '@/lib/ics201-service'

type UseIcs201SyncOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  profileEmail: string | null
  structureMode: Ics201StructureMode
  editingFlags: {
    reportInfo: boolean
    incidentBriefing: boolean
    mapSketch: boolean
    currentSituation: boolean
    objectives: boolean
    actions: boolean
    orgChart: boolean
    resources: boolean
    safetyAnalysis: boolean
  }
  onLoaded: (payload: {
    documentId: string
    form: Ics201FormState
    versions: Ics201Version[]
    structureMode: Ics201StructureMode
  }) => void
  onRemoteFormUpdated: (form: Ics201FormState) => void
  onRemoteVersionInserted: (version: Ics201Version) => void
}

export function useIcs201Sync({
  enabled,
  workspaceId,
  userId,
  profileEmail,
  structureMode,
  editingFlags,
  onLoaded,
  onRemoteFormUpdated,
  onRemoteVersionInserted,
}: UseIcs201SyncOptions) {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const editingFlagsRef = useRef(editingFlags)
  const userIdRef = useRef(userId)

  useEffect(() => {
    editingFlagsRef.current = editingFlags
  }, [editingFlags])

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const authorEmail = profileEmail?.toLowerCase() ?? null
  const authorName = authorEmail ?? 'You'
  const authorColor = userId ? ics201AuthorColorFromId(userId) : '#16a34a'

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      if (!enabled || !workspaceId) {
        setDocumentId(null)
        setSyncError(null)
        return
      }

      setLoading(true)
      setSyncError(null)

      try {
        const bundle = await fetchOrCreateIcs201Document(workspaceId)
        if (cancelled || !bundle) return

        setDocumentId(bundle.document.id)
        onLoaded({
          documentId: bundle.document.id,
          form: bundle.document.form_data,
          versions: bundle.versions,
          structureMode: bundle.document.structure_mode,
        })
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Failed to load ICS-201')
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
  }, [enabled, workspaceId, onLoaded])

  useEffect(() => {
    if (!enabled || !documentId) return undefined

    return subscribeToIcs201Changes(documentId, {
      onDocumentUpdated: (document) => {
        if (isIcs201EditingAnySection(editingFlagsRef.current)) return
        onRemoteFormUpdated(cloneIcs201FormState(document.form_data))
      },
      onVersionInserted: (version) => {
        onRemoteVersionInserted(version)
        if (
          !isIcs201EditingAnySection(editingFlagsRef.current) &&
          version.authorId !== userIdRef.current
        ) {
          onRemoteFormUpdated(cloneIcs201FormState(version.snapshot))
        }
      },
    })
  }, [documentId, enabled, onRemoteFormUpdated, onRemoteVersionInserted])

  const appendVersion = useCallback(
    async (
      snapshot: Ics201FormState,
      options?: {
        signatures?: Ics201VersionSignature[]
        sectionId?: Ics201SectionId
        authorNameOverride?: string
        authorColorOverride?: string
      }
    ): Promise<Ics201Version | null> => {
      if (!enabled || !documentId) {
        return null
      }

      setIsSaving(true)
      try {
        return await persistIcs201Version({
          documentId,
          snapshot,
          authorId: userId,
          authorName: options?.authorNameOverride ?? authorName,
          authorColor: options?.authorColorOverride ?? authorColor,
          signatures: options?.signatures ?? [],
          sectionId: options?.sectionId,
          structureMode,
        })
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Failed to save ICS-201')
        return null
      } finally {
        setIsSaving(false)
      }
    },
    [authorColor, authorName, documentId, enabled, structureMode, userId]
  )

  const resetToLocalDefaults = useCallback(() => {
    setDocumentId(null)
    setSyncError(null)
    onLoaded({
      documentId: '',
      form: createInitialIcs201Form(),
      versions: [],
      structureMode: 'flexible',
    })
  }, [onLoaded])

  return {
    documentId,
    loading,
    syncError,
    isSaving,
    authorName,
    authorEmail,
    authorColor,
    appendVersion,
    resetToLocalDefaults,
  }
}
