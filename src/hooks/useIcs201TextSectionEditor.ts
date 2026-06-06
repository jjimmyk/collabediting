import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import type { Ics201SectionId } from '@/features/ics201/types'
import { fetchSectionCrdtState, persistSectionCrdtState } from '@/lib/ics201-crdt-service'
import { applyTextDiff, clipText } from '@/lib/ics201-crdt-utils'
import { createIcs201YjsProvider, type Ics201YjsProvider } from '@/lib/ics201-yjs-provider'

type UseIcs201TextSectionEditorOptions = {
  enabled: boolean
  active: boolean
  documentId: string | null
  sectionId: Ics201SectionId
  seedValue: string
  maxLength?: number
}

export function useIcs201TextSectionEditor({
  enabled,
  active,
  documentId,
  sectionId,
  seedValue,
  maxLength,
}: UseIcs201TextSectionEditorOptions) {
  const [value, setValue] = useState(seedValue)
  const ydocRef = useRef<Y.Doc | null>(null)
  const ytextRef = useRef<Y.Text | null>(null)
  const providerRef = useRef<Ics201YjsProvider | null>(null)
  const suppressObserverRef = useRef(false)
  const isCollaborative = enabled && active && documentId !== null

  useEffect(() => {
    if (!active) {
      setValue(seedValue)
    }
  }, [active, seedValue])

  useEffect(() => {
    if (!enabled || !active || !documentId) {
      providerRef.current?.destroy()
      providerRef.current = null
      ydocRef.current = null
      ytextRef.current = null
      return undefined
    }

    const activeDocumentId = documentId
    let cancelled = false

    async function connect() {
      const ydoc = new Y.Doc()
      const ytext = ydoc.getText('content')
      ydocRef.current = ydoc
      ytextRef.current = ytext

      try {
        const stored = await fetchSectionCrdtState(activeDocumentId, sectionId)
        if (cancelled) return

        if (stored && stored.length > 0) {
          Y.applyUpdate(ydoc, stored)
        } else {
          const initial = clipText(seedValue, maxLength)
          if (initial.length > 0) {
            ytext.insert(0, initial)
          }
        }
      } catch {
        const initial = clipText(seedValue, maxLength)
        if (initial.length > 0) {
          ytext.insert(0, initial)
        }
      }

      const syncFromY = () => {
        if (suppressObserverRef.current) return
        setValue(clipText(ytext.toString(), maxLength))
      }

      ytext.observe(syncFromY)
      syncFromY()

      providerRef.current = createIcs201YjsProvider({
        doc: ydoc,
        documentId: activeDocumentId,
        sectionId,
        onPersist: (state) => persistSectionCrdtState(activeDocumentId, sectionId, state),
      })
    }

    void connect()

    return () => {
      cancelled = true
      void providerRef.current?.persistNow()
      providerRef.current?.destroy()
      providerRef.current = null
      ydocRef.current = null
      ytextRef.current = null
    }
  }, [active, documentId, enabled, maxLength, sectionId, seedValue])

  const setValueFromInput = useCallback(
    (next: string) => {
      const clipped = clipText(next, maxLength)
      const ytext = ytextRef.current
      const ydoc = ydocRef.current
      if (ytext && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          applyTextDiff(ytext, ytext.toString(), clipped)
        })
        suppressObserverRef.current = false
        setValue(clipped)
        return
      }
      setValue(clipped)
    },
    [maxLength]
  )

  const replaceValue = useCallback(
    (next: string) => {
      const clipped = clipText(next, maxLength)
      const ytext = ytextRef.current
      const ydoc = ydocRef.current
      if (ytext && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          ytext.delete(0, ytext.length)
          if (clipped.length > 0) {
            ytext.insert(0, clipped)
          }
        })
        suppressObserverRef.current = false
      }
      setValue(clipped)
    },
    [maxLength]
  )

  const persistNow = useCallback(async () => {
    await providerRef.current?.persistNow()
  }, [])

  return {
    value,
    setValue: setValueFromInput,
    replaceValue,
    persistNow,
    isCollaborative,
  }
}
