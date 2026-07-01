import { useCallback, useEffect, useState } from 'react'
import type { FeatureFlagId, FeatureFlagState } from '@/features/hub/feature-flags/feature-flag-catalog'
import {
  isFeatureFlagEnabled,
  loadFeatureFlags,
  saveFeatureFlags,
} from '@/features/hub/feature-flags/feature-flag-storage'

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlagState>(() => loadFeatureFlags())

  useEffect(() => {
    setFlags(loadFeatureFlags())
  }, [])

  const setFlag = useCallback((flagId: FeatureFlagId, enabled: boolean) => {
    setFlags((previous) => {
      const next = { ...previous, [flagId]: enabled }
      saveFeatureFlags(next)
      return next
    })
  }, [])

  return {
    flags,
    setFlag,
    isCisaEnabled: isFeatureFlagEnabled(flags, 'cisa'),
    isOilSpillTrajectoryModelsEnabled: isFeatureFlagEnabled(flags, 'oilSpillTrajectoryModels'),
    isFusionCentersEnabled: isFeatureFlagEnabled(flags, 'fusionCenters'),
  }
}
