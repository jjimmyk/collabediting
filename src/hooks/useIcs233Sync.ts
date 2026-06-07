import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ics233TaskRow } from '@/lib/ics233-workflow'
import {
  fetchOrCreateIcs233Document,
  persistIcs233Rows,
  subscribeToIcs233Changes,
} from '@/lib/ics233-service'

type UseIcs233SyncOptions = {
  enabled: boolean
  workspaceId: string | null
  userId: string | null
  isEditing: boolean
  onLoaded: (payload: { documentId: string; rows: Ics233TaskRow[] }) => void
  onRemoteRowsUpdated: (rows: Ics233TaskRow[]) => void
}

export function useIcs233Sync({
  enabled,
  workspaceId,
  userId,
  isEditing,
  onLoaded,
  onRemoteRowsUpdated,
}: UseIcs233SyncOptions) {
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const userIdRef = useRef(userId)
  const isEditingRef = useRef(isEditing)

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

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
        const document = await fetchOrCreateIcs233Document(workspaceId)
        if (cancelled || !document) {
          return
        }

        setDocumentId(document.id)
        onLoaded({
          documentId: document.id,
          rows: document.rows_data,
        })
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Failed to load ICS-233')
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
  }, [enabled, onLoaded, workspaceId])

  useEffect(() => {
    if (!enabled || !documentId) {
      return undefined
    }

    return subscribeToIcs233Changes(documentId, {
      onDocumentUpdated: (document) => {
        if (document.updated_by === userIdRef.current) {
          return
        }
        if (isEditingRef.current) {
          return
        }
        onRemoteRowsUpdated(document.rows_data)
      },
    })
  }, [documentId, enabled, onRemoteRowsUpdated])

  const saveRows = useCallback(
    async (rows: Ics233TaskRow[]): Promise<void> => {
      if (!enabled || !documentId) {
        return
      }

      setIsSaving(true)
      try {
        await persistIcs233Rows(documentId, rows, userId)
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Failed to save ICS-233')
      } finally {
        setIsSaving(false)
      }
    },
    [documentId, enabled, userId]
  )

  const resetToLocalDefaults = useCallback(() => {
    setDocumentId(null)
    setSyncError(null)
    onLoaded({
      documentId: '',
      rows: [],
    })
  }, [onLoaded])

  return {
    documentId,
    loading,
    syncError,
    isSaving,
    saveRows,
    resetToLocalDefaults,
  }
}
