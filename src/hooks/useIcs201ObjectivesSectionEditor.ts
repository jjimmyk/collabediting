import { useCallback, useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import type { Ics201ObjectiveKind, Ics201ObjectiveRow, Ics201SectionId } from '@/features/ics201/types'
import { normalizeIcs201ObjectiveKind } from '@/features/ics201/utils'
import { fetchSectionCrdtState, persistSectionCrdtState } from '@/lib/ics201-crdt-service'
import { clipObjectiveRows } from '@/lib/ics201-crdt-utils'
import { createIcs201YjsProvider, type Ics201YjsProvider } from '@/lib/ics201-yjs-provider'

type UseIcs201ObjectivesSectionEditorOptions = {
  enabled: boolean
  active: boolean
  documentId: string | null
  sectionId: Ics201SectionId
  seedValue: Ics201ObjectiveRow[]
  maxLength?: number
}

function nextObjectiveRowId(rows: Ics201ObjectiveRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

function rowFromYMap(ymap: Y.Map<unknown>): Ics201ObjectiveRow {
  return {
    id: typeof ymap.get('id') === 'number' ? (ymap.get('id') as number) : 1,
    kind: normalizeIcs201ObjectiveKind(ymap.get('kind')),
    objective: String(ymap.get('objective') ?? ''),
  }
}

function objectivesFromYArray(yarray: Y.Array<unknown>): Ics201ObjectiveRow[] {
  const items = yarray.toArray()
  if (items.length === 0) {
    return []
  }
  if (typeof items[0] === 'string') {
    return items.map((entry, index) => ({
      id: index + 1,
      kind: 'O',
      objective: typeof entry === 'string' ? entry : String(entry),
    }))
  }
  return items.map((item, index) => {
    if (item instanceof Y.Map) {
      return rowFromYMap(item)
    }
    const row = item as Partial<Ics201ObjectiveRow>
    return {
      id: typeof row.id === 'number' ? row.id : index + 1,
      kind: normalizeIcs201ObjectiveKind(row.kind),
      objective: String(row.objective ?? ''),
    }
  })
}

function createYMapRow(row: Ics201ObjectiveRow): Y.Map<unknown> {
  const ymap = new Y.Map<unknown>()
  ymap.set('id', row.id)
  ymap.set('kind', row.kind)
  ymap.set('objective', row.objective)
  return ymap
}

function replaceYArrayRows(yarray: Y.Array<unknown>, rows: Ics201ObjectiveRow[]) {
  yarray.delete(0, yarray.length)
  if (rows.length > 0) {
    yarray.insert(0, rows.map((row) => createYMapRow(row)))
  }
}

function migrateLegacyStringArrayIfNeeded(ydoc: Y.Doc, yarray: Y.Array<unknown>) {
  const items = yarray.toArray()
  if (items.length === 0 || typeof items[0] !== 'string') {
    return
  }
  const rows = items.map((entry, index) => ({
    id: index + 1,
    kind: 'O' as Ics201ObjectiveKind,
    objective: typeof entry === 'string' ? entry : String(entry),
  }))
  ydoc.transact(() => {
    replaceYArrayRows(yarray, rows)
  })
}

function defaultObjectiveRows(seedValue: Ics201ObjectiveRow[]): Ics201ObjectiveRow[] {
  const clipped = clipObjectiveRows(seedValue)
  if (clipped.length > 0) {
    return clipped
  }
  return [{ id: 1, kind: 'O', objective: '' }]
}

export function useIcs201ObjectivesSectionEditor({
  enabled,
  active,
  documentId,
  sectionId,
  seedValue,
  maxLength,
}: UseIcs201ObjectivesSectionEditorOptions) {
  const [objectives, setObjectives] = useState<Ics201ObjectiveRow[]>(seedValue)
  const ydocRef = useRef<Y.Doc | null>(null)
  const yarrayRef = useRef<Y.Array<unknown> | null>(null)
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
      const yarray = ydoc.getArray<unknown>('objectives')
      ydocRef.current = ydoc
      yarrayRef.current = yarray

      try {
        const stored = await fetchSectionCrdtState(activeDocumentId, sectionId)
        if (cancelled) return

        if (stored && stored.length > 0) {
          Y.applyUpdate(ydoc, stored)
          migrateLegacyStringArrayIfNeeded(ydoc, yarray)
        } else {
          replaceYArrayRows(yarray, defaultObjectiveRows(clipObjectiveRows(seedValue, maxLength)))
        }
      } catch {
        replaceYArrayRows(yarray, defaultObjectiveRows(clipObjectiveRows(seedValue, maxLength)))
      }

      const syncFromY = () => {
        if (suppressObserverRef.current) return
        const next = clipObjectiveRows(objectivesFromYArray(yarray), maxLength)
        setObjectives(next.length > 0 ? next : [{ id: 1, kind: 'O', objective: '' }])
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

  const updateObjectiveRow = useCallback(
    (rowId: number, patch: Partial<Pick<Ics201ObjectiveRow, 'kind' | 'objective'>>) => {
      const yarray = yarrayRef.current
      const ydoc = ydocRef.current
      if (yarray && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          const current = objectivesFromYArray(yarray)
          const index = current.findIndex((row) => row.id === rowId)
          if (index === -1) return
          const row = current[index]
          let nextObjective = patch.objective ?? row.objective
          if (patch.objective !== undefined && maxLength !== undefined) {
            const otherTotal = current.reduce(
              (sum, entry) => (entry.id === rowId ? sum : sum + entry.objective.length),
              0
            )
            nextObjective = patch.objective.slice(0, Math.max(0, maxLength - otherTotal))
          }
          const nextRow: Ics201ObjectiveRow = {
            ...row,
            kind: patch.kind ?? row.kind,
            objective: nextObjective,
          }
          yarray.delete(index, 1)
          yarray.insert(index, [createYMapRow(nextRow)])
        })
        suppressObserverRef.current = false
        setObjectives((previous) => {
          const index = previous.findIndex((row) => row.id === rowId)
          if (index === -1) return previous
          const row = previous[index]
          let nextObjective = patch.objective ?? row.objective
          if (patch.objective !== undefined && maxLength !== undefined) {
            const otherTotal = previous.reduce(
              (sum, entry) => (entry.id === rowId ? sum : sum + entry.objective.length),
              0
            )
            nextObjective = patch.objective.slice(0, Math.max(0, maxLength - otherTotal))
          }
          return previous.map((entry) =>
            entry.id === rowId
              ? { ...entry, kind: patch.kind ?? entry.kind, objective: nextObjective }
              : entry
          )
        })
        return
      }

      setObjectives((previous) => {
        const index = previous.findIndex((row) => row.id === rowId)
        if (index === -1) return previous
        const row = previous[index]
        let nextObjective = patch.objective ?? row.objective
        if (patch.objective !== undefined && maxLength !== undefined) {
          const otherTotal = previous.reduce(
            (sum, entry) => (entry.id === rowId ? sum : sum + entry.objective.length),
            0
          )
          nextObjective = patch.objective.slice(0, Math.max(0, maxLength - otherTotal))
        }
        return previous.map((entry) =>
          entry.id === rowId
            ? { ...entry, kind: patch.kind ?? entry.kind, objective: nextObjective }
            : entry
        )
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
        const current = objectivesFromYArray(yarray)
        const nextRow: Ics201ObjectiveRow = {
          id: nextObjectiveRowId(current),
          kind: 'O',
          objective: '',
        }
        yarray.push([createYMapRow(nextRow)])
      })
      suppressObserverRef.current = false
      setObjectives((previous) => [
        ...previous,
        { id: nextObjectiveRowId(previous), kind: 'O', objective: '' },
      ])
      return
    }
    setObjectives((previous) => [
      ...previous,
      { id: nextObjectiveRowId(previous), kind: 'O', objective: '' },
    ])
  }, [])

  const deleteObjective = useCallback((rowId: number) => {
    const yarray = yarrayRef.current
    const ydoc = ydocRef.current
    if (yarray && ydoc) {
      suppressObserverRef.current = true
      ydoc.transact(() => {
        const current = objectivesFromYArray(yarray)
        const index = current.findIndex((row) => row.id === rowId)
        if (index === -1) return
        yarray.delete(index, 1)
      })
      suppressObserverRef.current = false
      setObjectives((previous) => previous.filter((row) => row.id !== rowId))
      return
    }
    setObjectives((previous) => previous.filter((row) => row.id !== rowId))
  }, [])

  const replaceObjectives = useCallback(
    (nextObjectives: Ics201ObjectiveRow[]) => {
      const normalized = defaultObjectiveRows(clipObjectiveRows(nextObjectives, maxLength))
      const yarray = yarrayRef.current
      const ydoc = ydocRef.current
      if (yarray && ydoc) {
        suppressObserverRef.current = true
        ydoc.transact(() => {
          replaceYArrayRows(yarray, normalized)
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
    updateObjectiveRow,
    addObjective,
    deleteObjective,
    replaceObjectives,
    persistNow,
    isCollaborative,
  }
}
