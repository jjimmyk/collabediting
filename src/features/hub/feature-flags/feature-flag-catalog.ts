export type FeatureFlagId = 'cisa'

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
]

export type FeatureFlagState = Record<FeatureFlagId, boolean>

export const DEFAULT_FEATURE_FLAG_STATE: FeatureFlagState = {
  cisa: false,
}

export function getFeatureFlagDefinition(id: FeatureFlagId): FeatureFlagDefinition | undefined {
  return FEATURE_FLAG_CATALOG.find((entry) => entry.id === id)
}

export function isFeatureFlagId(value: string): value is FeatureFlagId {
  return FEATURE_FLAG_CATALOG.some((entry) => entry.id === value)
}
