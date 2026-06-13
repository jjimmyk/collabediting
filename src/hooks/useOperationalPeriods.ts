import { useCallback, useEffect, useState } from 'react'
import {
  fetchOperationalPeriodSnapshotBundle,
  fetchWorkspaceOperationalPeriods,
  startOperationalPeriod,
} from '@/lib/operational-period-service'
import type {
  OperationalPeriodSnapshotBundle,
  WorkspaceOperationalPeriod,
} from '@/lib/operational-period-types'
import { isSupabaseConfigured } from '@/lib/supabase'

type UseOperationalPeriodsOptions = {
  enabled: boolean
  workspaceId: string | null
  getAccessToken?: () => Promise<string | null>
  startedOperationalPeriodCount: number
  workingOperationalPeriodNumber: number
  onCountersUpdated?: (payload: {
    startedOperationalPeriodCount: number
    workingOperationalPeriodNumber: number
  }) => void
  onFormsReload?: () => void
}

export function useOperationalPeriods({
  enabled,
  workspaceId,
  getAccessToken,
  startedOperationalPeriodCount,
  workingOperationalPeriodNumber,
  onCountersUpdated,
  onFormsReload,
}: UseOperationalPeriodsOptions) {
  const [periods, setPeriods] = useState<WorkspaceOperationalPeriod[]>([])
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [formsView, setFormsView] = useState<'working' | number>('working')
  const [historicalBundle, setHistoricalBundle] = useState<OperationalPeriodSnapshotBundle | null>(
    null
  )
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [historicalError, setHistoricalError] = useState<string | null>(null)

  const reloadPeriods = useCallback(async () => {
    if (!enabled || !workspaceId || !isSupabaseConfigured) {
      setPeriods([])
      return
    }

    setIsLoadingPeriods(true)
    try {
      const nextPeriods = await fetchWorkspaceOperationalPeriods(workspaceId)
      setPeriods(nextPeriods)
    } catch (error) {
      setPeriods([])
      console.error(error)
    } finally {
      setIsLoadingPeriods(false)
    }
  }, [enabled, workspaceId])

  useEffect(() => {
    void reloadPeriods()
  }, [reloadPeriods, startedOperationalPeriodCount])

  useEffect(() => {
    setFormsView('working')
    setHistoricalBundle(null)
    setHistoricalError(null)
  }, [workspaceId])

  useEffect(() => {
    let cancelled = false

    async function loadHistorical() {
      if (formsView === 'working' || !enabled || !workspaceId || !isSupabaseConfigured) {
        setHistoricalBundle(null)
        setHistoricalError(null)
        return
      }

      setIsLoadingHistorical(true)
      setHistoricalError(null)

      try {
        const bundle = await fetchOperationalPeriodSnapshotBundle(workspaceId, formsView)
        if (cancelled) return
        if (!bundle) {
          setHistoricalBundle(null)
          setHistoricalError(`Operational Period ${formsView} snapshots were not found.`)
          return
        }
        setHistoricalBundle(bundle)
      } catch (error) {
        if (!cancelled) {
          setHistoricalBundle(null)
          setHistoricalError(
            error instanceof Error ? error.message : 'Could not load operational period snapshots.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistorical(false)
        }
      }
    }

    void loadHistorical()

    return () => {
      cancelled = true
    }
  }, [enabled, formsView, workspaceId])

  const handleStartOperationalPeriod = useCallback(async () => {
    const accessToken = getAccessToken ? await getAccessToken() : null
    if (!workspaceId || !accessToken) {
      setStartError('Sign in to start an operational period.')
      return { ok: false as const, message: 'Sign in to start an operational period.' }
    }

    setIsStarting(true)
    setStartError(null)

    try {
      const result = await startOperationalPeriod({
        accessToken,
        workspaceId,
      })

      if (!result.ok) {
        setStartError(result.message)
        return result
      }

      onCountersUpdated?.({
        startedOperationalPeriodCount: result.result.startedOperationalPeriodCount,
        workingOperationalPeriodNumber: result.result.workingOperationalPeriodNumber,
      })
      onFormsReload?.()
      await reloadPeriods()
      setFormsView('working')
      setHistoricalBundle(null)
      return result
    } finally {
      setIsStarting(false)
    }
  }, [getAccessToken, onCountersUpdated, onFormsReload, reloadPeriods, workspaceId])

  return {
    periods,
    isLoadingPeriods,
    isStarting,
    startError,
    startedOperationalPeriodCount,
    workingOperationalPeriodNumber,
    formsView,
    setFormsView,
    historicalBundle,
    isLoadingHistorical,
    historicalError,
    isViewingHistorical: formsView !== 'working',
    handleStartOperationalPeriod,
    reloadPeriods,
  }
}
