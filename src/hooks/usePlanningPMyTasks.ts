import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlanningPStepId } from '@/features/planning-p/planning-p-steps'
import {
  buildAllTaskProgressByStepId,
  buildMyTaskProgressByStepId,
  getAllTasksForPhase,
  getTasksForPhaseAndPositions,
} from '@/features/planning-p/planning-p-task-utils'
import {
  fetchPlanningPTaskCompletions,
  setPlanningPTaskCompletion,
} from '@/lib/planning-p-task-service'
import { isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_STORAGE_PREFIX = 'planning-p-tasks'

type UsePlanningPMyTasksOptions = {
  enabled: boolean
  workspaceKey: string | null
  supabaseWorkspaceId: string | null
  userId: string | null
  operationalPeriodNumber: number
  positions: string[]
  readOnly?: boolean
}

function buildLocalStorageKey(
  workspaceKey: string,
  userId: string,
  operationalPeriodNumber: number
): string {
  return `${LOCAL_STORAGE_PREFIX}:${workspaceKey}:${userId}:${operationalPeriodNumber}`
}

function readLocalCompletions(
  workspaceKey: string,
  userId: string,
  operationalPeriodNumber: number
): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(
      buildLocalStorageKey(workspaceKey, userId, operationalPeriodNumber)
    )
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalCompletions(
  workspaceKey: string,
  userId: string,
  operationalPeriodNumber: number,
  completions: Record<string, boolean>
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    buildLocalStorageKey(workspaceKey, userId, operationalPeriodNumber),
    JSON.stringify(completions)
  )
}

export function usePlanningPMyTasks({
  enabled,
  workspaceKey,
  supabaseWorkspaceId,
  userId,
  operationalPeriodNumber,
  positions,
  readOnly = false,
}: UsePlanningPMyTasksOptions) {
  const [completions, setCompletions] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const canPersist =
    enabled && workspaceKey !== null && userId !== null && operationalPeriodNumber > 0

  useEffect(() => {
    if (!canPersist || !workspaceKey || !userId) {
      setCompletions({})
      return
    }

    let cancelled = false

    async function loadCompletions() {
      if (!workspaceKey || !userId) return

      setIsLoading(true)
      try {
        if (isSupabaseConfigured && supabaseWorkspaceId) {
          const remote = await fetchPlanningPTaskCompletions(
            supabaseWorkspaceId,
            userId,
            operationalPeriodNumber
          )
          if (!cancelled) {
            setCompletions(remote)
          }
          return
        }

        if (!cancelled) {
          setCompletions(readLocalCompletions(workspaceKey, userId, operationalPeriodNumber))
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setCompletions(readLocalCompletions(workspaceKey, userId, operationalPeriodNumber))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCompletions()

    return () => {
      cancelled = true
    }
  }, [canPersist, workspaceKey, supabaseWorkspaceId, userId, operationalPeriodNumber])

  const setTaskCompleted = useCallback(
    (taskId: string, completed: boolean) => {
      if (!canPersist || readOnly || !workspaceKey || !userId) return

      setCompletions((current) => {
        const next = { ...current }
        if (completed) {
          next[taskId] = true
        } else {
          delete next[taskId]
        }

        if (!isSupabaseConfigured || !supabaseWorkspaceId) {
          writeLocalCompletions(workspaceKey, userId, operationalPeriodNumber, next)
        }

        return next
      })

      if (isSupabaseConfigured && supabaseWorkspaceId) {
        void setPlanningPTaskCompletion(
          supabaseWorkspaceId,
          userId,
          operationalPeriodNumber,
          taskId,
          completed
        ).catch((error) => {
          console.error(error)
          setCompletions(readLocalCompletions(workspaceKey, userId, operationalPeriodNumber))
        })
      }
    },
    [
      canPersist,
      readOnly,
      workspaceKey,
      userId,
      supabaseWorkspaceId,
      operationalPeriodNumber,
    ]
  )

  const getMyTasksForPhase = useCallback(
    (phaseId: PlanningPStepId) => getTasksForPhaseAndPositions(phaseId, positions),
    [positions]
  )

  const getAllTasksForPhaseById = useCallback(
    (phaseId: PlanningPStepId) => getAllTasksForPhase(phaseId),
    []
  )

  const myTaskProgressByStepId = useMemo(
    () => buildMyTaskProgressByStepId(positions, completions),
    [positions, completions]
  )

  const allTaskProgressByStepId = useMemo(
    () => buildAllTaskProgressByStepId(completions),
    [completions]
  )

  return {
    completions,
    isLoading,
    setTaskCompleted,
    getMyTasksForPhase,
    getAllTasksForPhase: getAllTasksForPhaseById,
    myTaskProgressByStepId,
    allTaskProgressByStepId,
  }
}
