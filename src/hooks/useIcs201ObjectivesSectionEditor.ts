import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import type { Ics201SectionId } from '@/features/ics201/types'
import { fetchSectionCrdtState, persistSectionCrdtState } from '@/lib/ics201-crdt-service'
import { clipObjectives } from '@/lib/ics201-crdt-utils'
import { createIcs201YjsProvider, type Ics201YjsProvider } from '@/lib/ics201-yjs-provider'

type UseIcs201ObjectivesSectionEditorOptions = {
  enabled: boolean
  active: boolean
  documentId: string | null
  sectionId: Ics201SectionId
  seedValue: string[]
  maxLength?: number
}

function objectivesFromYArray(yarray: Y.Array<string>): string[] {
  return yarray.toArray().map((entry) => (typeof entry === 'string' ? entry : String(entry)))
}

function replaceYArray(yarray: Y.Array<string>, items: string[]) {
  yarray.delete(0, yarray.length)
  if (items.length > 0) {
    yarray.insert(0, items)
  }
}

export function useIcs201ObjectivesSectionEditor({
  enabled,
  active,
  documentId,
  sectionId,
  seedValue,
  maxLength,
}: UseIcs201ObjectivesSectionEditorOptions) {
  const [objectives, setObjectives] = useState<string[]>(seedValue)
  const ydocRef = useRef<Y.Doc | null>(null)
  const yarrayRef = useRef<Y.Array<string> | null>(null)
  const providerRef = useRef<Ics201YjsProvider | null>(null)
  const suppressObserverRef = useRef(false)
  const isCollaborative = enabled && active && documentId !== null

  useEffect(() => {
    if (!active) {
      setObjectives(seedValue)
    }
  }, [active, seedValue])

  useEffect(() => {
    if (!enabled || !active || !documentId) {
      providerRef.current?.destroy()
      providerRef.current = null
      ydocRef.current = null
      yarrayRef.current = null
      return undefined
    }

    const activeDocumentId = documentId
    let cancelled = false

    async function connect() {
      const ydoc = new Y.Doc()
      const yarray = ydoc.getArray<string>('objectives')
      ydocRef.current = ydoc
      yarrayRef.current = yarray

      try {
        const stored = await fetchSectionCrdtState(activeDocumentId, sectionId)
        if (cancelled) return

        if (stored && stored.length > 0) {
          Y.applyUpdate(ydoc, stored)
        } else {
          const initial = clipObjectives(seedValue, maxLength)
          replaceYArray(yarray, initial.length > 0 ? initial : [''])
        }
      } catch {
        const initial = clipObjectives(seedValue, maxLength)
        replaceYArray(yarray, initial.length > 0 ? initial : [''])
      }

      const syncFromY = () => {
        if (suppressObserverRef.current) return
        const next = clipObjectives(objectivesFromYArray(yarray), maxLength)
        setObjectives(next.length > 0 ? next : [''])
      }

      yarray.observe(syncFromY)
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
      yarrayRef.current = null
    }
  }, [active, documentId, enabled, maxLength, sectionId, seedValue])

  const updateObjective = useCallback(
    (index: number, nextValue: string) => {
      const yarray = yarrayRef.current
      const ydoc = ydocRef.current
      if (yarray && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          const current = objectivesFromYArray(yarray)
          const otherTotal = current.reduce(
            (sum, entry, entryIndex) => (entryIndex === index ? sum : sum + entry.length),
            0
          )
          const clipped =
            maxLength === undefined
              ? nextValue
              : nextValue.slice(0, Math.max(0, maxLength - otherTotal))
          if (index >= current.length) {
            yarray.push([clipped])
          } else {
            yarray.delete(index, 1)
            yarray.insert(index, [clipped])
          }
        })
        suppressObserverRef.current = false
        setObjectives((previous) => {
          const otherTotal = previous.reduce(
            (sum, entry, entryIndex) => (entryIndex === index ? sum : sum + entry.length),
            0
          )
          const clipped =
            maxLength === undefined
              ? nextValue
              : nextValue.slice(0, Math.max(0, maxLength - otherTotal))
          return previous.map((entry, entryIndex) => (entryIndex === index ? clipped : entry))
        })
        return
      }

      setObjectives((previous) => {
        const otherTotal = previous.reduce(
          (sum, entry, entryIndex) => (entryIndex === index ? sum : sum + entry.length),
          0
        )
        const clipped =
          maxLength === undefined
            ? nextValue
            : nextValue.slice(0, Math.max(0, maxLength - otherTotal))
        return previous.map((entry, entryIndex) => (entryIndex === index ? clipped : entry))
      })
    },
    [maxLength]
  )

  const addObjective = useCallback(() => {
    const yarray = yarrayRef.current
    const ydoc = ydocRef.current
    if (yarray && ydoc) {
      suppressObserverRef.current = true
      ydoc.transact(() => {
        yarray.push([''])
      })
      suppressObserverRef.current = false
      setObjectives((previous) => [...previous, ''])
      return
    }
    setObjectives((previous) => [...previous, ''])
  }, [])

  const replaceObjectives = useCallback(
    (nextObjectives: string[]) => {
      const clipped = clipObjectives(nextObjectives, maxLength)
      const normalized = clipped.length > 0 ? clipped : ['']
      const yarray = yarrayRef.current
      const ydoc = ydocRef.current
      if (yarray && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          replaceYArray(yarray, normalized)
        })
        suppressObserverRef.current = false
      }
      setObjectives(normalized)
    },
    [maxLength]
  )

  const persistNow = useCallback(async () => {
    await providerRef.current?.persistNow()
  }, [])

  return {
    objectives,
    updateObjective,
    addObjective,
    replaceObjectives,
    persistNow,
    isCollaborative,
  }
}
