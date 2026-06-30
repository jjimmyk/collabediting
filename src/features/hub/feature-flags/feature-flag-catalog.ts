export type FeatureFlagId = 'cisa' | 'oilSpillTrajectoryModels'

export type FeatureFlagDefinition = {
  id: FeatureFlagId
  label: string
  description: string
}

export const FEATURE_FLAG_CATALOG: FeatureFlagDefinition[] = [
  {
    id: 'cisa',
    label: 'CISA',
    description: 'Show CISA dashboard tabs in the hub More menu.',
  },
  {
    id: 'oilSpillTrajectoryModels',
    label: 'Oil Spill Trajectory Models',
    description: 'Show NOAA GNOME oil spill trajectory layers in Map Layers.',
  },
]

export type FeatureFlagState = Record<FeatureFlagId, boolean>

export const DEFAULT_FEATURE_FLAG_STATE: FeatureFlagState = {
  cisa: false,
  oilSpillTrajectoryModels: false,
}

export function getFeatureFlagDefinition(id: FeatureFlagId): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_CATALOG.find((entry) => entry.id === id)
}

export function isFeatureFlagId(value: string): value is FeatureFlagId {
  return FEATURE_FLAG_CATALOG.some((entry) => entry.id === value)
}
