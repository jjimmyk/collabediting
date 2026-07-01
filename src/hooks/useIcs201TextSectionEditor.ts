import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import type { Ics201SectionId } from '@/features/ics201/types'
import { fetchSectionCrdtState, persistSectionCrdtState } from '@/lib/ics201-crdt-service'
import { applyTextDiff, clipText } from '@/lib/ics201-crdt-utils'
import { createIcs201YjsProvider, type Ics201YjsProvider } from '@/lib/ics201-yjs-provider'

type UseIcs201TextSectionEditorOptions = {
  enabled: boolean
  active: boolean
  /** Keep Yjs connected while viewing so passive readers see live edits. */
  stayConnected?: boolean
  documentId: string | null
  sectionId: Ics201SectionId
  seedValue: string
  maxLength?: number
  /** Debounced publish of live text into ics201_documents.form_data (no version row). */
  onFormPublish?: (value: string) => Promise<void>
  formPublishDebounceMs?: number
  onSelectionChange?: (selection: { anchor: number; head: number }) => void
  persistDebounceMs?: number
}

export function useIcs201TextSectionEditor({
  enabled,
  active,
  stayConnected = false,
  documentId,
  sectionId,
  seedValue,
  maxLength,
  onFormPublish,
  formPublishDebounceMs = 1500,
  onSelectionChange,
  persistDebounceMs,
}: UseIcs201TextSectionEditorOptions) {
  const [value, setValue] = useState(seedValue)
  const ydocRef = useRef<Y.Doc | null>(null)
  const ytextRef = useRef<Y.Text | null>(null)
  const providerRef = useRef<Ics201YjsProvider | null>(null)
  const suppressObserverRef = useRef(false)
  const formPublishTimerRef = useRef<number | null>(null)
  const onFormPublishRef = useRef(onFormPublish)
  const shouldConnect = enabled && documentId !== null && (active || stayConnected)
  const isLiveConnected = shouldConnect

  useEffect(() => {
    onFormPublishRef.current = onFormPublish
  }, [onFormPublish])

  useEffect(() => {
    if (!shouldConnect) {
      setValue(seedValue)
    }
  }, [seedValue, shouldConnect])

  useEffect(() => {
    if (!shouldConnect || !documentId) {
      providerRef.current?.destroy()
      providerRef.current = null
      ydocRef.current = null
      ytextRef.current = null
      return undefined
    }

    const activeDocumentId = documentId
    let cancelled = false

    const scheduleFormPublish = (nextValue: string) => {
      const publish = onFormPublishRef.current
      if (!publish) return
      if (formPublishTimerRef.current !== null) {
        window.clearTimeout(formPublishTimerRef.current)
      }
      formPublishTimerRef.current = window.setTimeout(() => {
        formPublishTimerRef.current = null
        void publish(nextValue)
      }, formPublishDebounceMs)
    }

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
        const next = clipText(ytext.toString(), maxLength)
        setValue(next)
        scheduleFormPublish(next)
      }

      ytext.observe(syncFromY)
      syncFromY()

      providerRef.current = createIcs201YjsProvider({
        doc: ydoc,
        documentId: activeDocumentId,
        sectionId,
        debounceMs: persistDebounceMs,
        onPersist: (state) => persistSectionCrdtState(activeDocumentId, sectionId, state),
      })
    }

    void connect()

    return () => {
      cancelled = true
      if (formPublishTimerRef.current !== null) {
        window.clearTimeout(formPublishTimerRef.current)
        formPublishTimerRef.current = null
      }
      void providerRef.current?.persistNow()
      providerRef.current?.destroy()
      providerRef.current = null
      ydocRef.current = null
      ytextRef.current = null
    }
  }, [documentId, formPublishDebounceMs, maxLength, persistDebounceMs, sectionId, seedValue, shouldConnect])

  const setValueFromInput = useCallback(
    (next: string) => {
      if (!active) return
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
    [active, maxLength]
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
    if (formPublishTimerRef.current !== null) {
      window.clearTimeout(formPublishTimerRef.current)
      formPublishTimerRef.current = null
    }
    await providerRef.current?.persistNow()
    const latest = clipText(ytextRef.current?.toString() ?? value, maxLength)
    if (onFormPublishRef.current) {
      await onFormPublishRef.current(latest)
    }
  }, [maxLength, value])

  const reportSelection = useCallback(
    (element: HTMLTextAreaElement | null) => {
      if (!element || !onSelectionChange) return
      onSelectionChange({
        anchor: element.selectionStart ?? 0,
        head: element.selectionEnd ?? 0,
      })
    },
    [onSelectionChange]
  )

  return {
    value,
    setValue: setValueFromInput,
    replaceValue,
    persistNow,
    reportSelection,
    isCollaborative: isLiveConnected && active,
    isLiveConnected,
  }
}
