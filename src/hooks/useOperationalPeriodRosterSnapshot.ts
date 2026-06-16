import { useEffect, useState } from 'react'
import { fetchOperationalPeriodRosterSnapshot } from '@/lib/operational-period-service'
import type { OperationalPeriodRosterSnapshot } from '@/lib/operational-period-roster-types'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseOperationalPeriodRosterSnapshotOptions = {
  enabled: boolean
  workspaceId: string | null
  periodNumber: number | null
}

export function useOperationalPeriodRosterSnapshot({
  enabled,
  workspaceId,
  periodNumber,
}: UseOperationalPeriodRosterSnapshotOptions) {
  const [snapshot, setSnapshot] = useState<OperationalPeriodRosterSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!enabled || !workspaceId || periodNumber === null || !isSupabaseConfigured) {
        setSnapshot(null)
        setError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const nextSnapshot = await fetchOperationalPeriodRosterSnapshot(workspaceId, periodNumber)
        if (cancelled) return
        setSnapshot(nextSnapshot)
        if (!nextSnapshot) {
          setError(`No roster snapshot for Operational Period ${periodNumber}.`)
        }
      } catch (loadError) {
        if (!cancelled) {
          setSnapshot(null)
          setError(
            loadError instanceof Error ? loadError.message : 'Could not load roster snapshot.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [enabled, periodNumber, workspaceId])

  return {
    snapshot,
    isLoading,
    error,
    hasSnapshot: snapshot !== null,
  }
}
