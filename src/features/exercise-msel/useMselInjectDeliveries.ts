import { useEffect, useRef, useState } from 'react'
import type { MselInjectDelivery } from './types'
import {
  exerciseMselDeliveriesStorageKey,
} from './msel-utils'
import {
  fetchMselInjectDeliveriesForWorkspace,
  subscribeToMselInjectDeliveries,
} from '@/lib/exercise-msel-delivery-service'
import { mapDeliveryRow } from './delivery-utils'

type UseMselInjectDeliveriesOptions = {
  enabled: boolean
  workspaceId: string | null
  workspaceKey: string | null
  isSupabaseEnabled: boolean
}

function readLocalDeliveries(workspaceKey: string): MselInjectDelivery[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(exerciseMselDeliveriesStorageKey(workspaceKey))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown[]
    return parsed.map((entry) => mapDeliveryRow(entry as Record<string, unknown>))
  } catch {
    return []
  }
}

function writeLocalDeliveries(workspaceKey: string, deliveries: MselInjectDelivery[]): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(exerciseMselDeliveriesStorageKey(workspaceKey), JSON.stringify(deliveries))
}

export function useMselInjectDeliveries(options: UseMselInjectDeliveriesOptions) {
  const [deliveries, setDeliveries] = useState<MselInjectDelivery[]>([])
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!options.enabled || !options.workspaceKey) {
      setDeliveries([])
      setHydratedKey(null)
      return
    }

    if (hydratedKey === options.workspaceKey) {
      return
    }

    if (options.isSupabaseEnabled && options.workspaceId) {
      void fetchMselInjectDeliveriesForWorkspace(options.workspaceId)
        .then((rows) => {
          setDeliveries(rows)
          writeLocalDeliveries(options.workspaceKey!, rows)
        })
        .catch(() => {
          setDeliveries(readLocalDeliveries(options.workspaceKey!))
        })
    } else {
      setDeliveries(readLocalDeliveries(options.workspaceKey))
    }

    setHydratedKey(options.workspaceKey)
  }, [
    options.enabled,
    options.workspaceId,
    options.workspaceKey,
    options.isSupabaseEnabled,
    hydratedKey,
  ])

  useEffect(() => {
    if (!options.enabled || !options.isSupabaseEnabled || !options.workspaceId) {
      return undefined
    }

    return subscribeToMselInjectDeliveries(options.workspaceId, (delivery) => {
      setDeliveries((previous) => {
        if (previous.some((entry) => entry.id === delivery.id)) {
          return previous
        }
        const next = [delivery, ...previous]
        if (options.workspaceKey) {
          writeLocalDeliveries(options.workspaceKey, next)
        }
        return next
      })
    })
  }, [options.enabled, options.isSupabaseEnabled, options.workspaceId, options.workspaceKey])

  const appendDeliveries = (nextDeliveries: MselInjectDelivery[]) => {
    setDeliveries((previous) => {
      const merged = [...nextDeliveries, ...previous].filter(
        (delivery, index, array) => array.findIndex((entry) => entry.id === delivery.id) === index
      )
      if (options.workspaceKey) {
        writeLocalDeliveries(options.workspaceKey, merged)
      }
      return merged
    })
  }

  return {
    deliveries,
    appendDeliveries,
    resetHydration: () => setHydratedKey(null),
  }
}
