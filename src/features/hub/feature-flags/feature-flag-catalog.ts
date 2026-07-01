export type FeatureFlagId = 'cisa' | 'oilSpillTrajectoryModels' | 'fusionCenters'

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
  {
    id: 'fusionCenters',
    label: 'Fusion Centers',
    description:
      'Swap hub org branding and primary notification to the Port of Houston cyber demo scenario.',
  },
]

export type FeatureFlagState = Record<FeatureFlagId, boolean>

export const DEFAULT_FEATURE_FLAG_STATE: FeatureFlagState = {
  cisa: false,
  oilSpillTrajectoryModels: false,
  fusionCenters: false,
}

export function getFeatureFlagDefinition(id: FeatureFlagId): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_CATALOG.find((entry) => entry.id === id)
}

export function isFeatureFlagId(value: string): value is FeatureFlagId {
  return FEATURE_FLAG_CATALOG.some((entry) => entry.id === value)
}
