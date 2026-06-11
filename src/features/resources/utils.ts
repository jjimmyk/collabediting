import type { ResourceCostUnitType, ResourceListItemData } from '@/features/resources/types'

export const getResourceIncidentAssignmentLabel = (resource: ResourceListItemData) =>
  resource.deploymentKind === 'incident' ? resource.assignedIncidentName ?? '' : ''

export const formatResourceCostPerUnit = (costPerUnit: number) =>
  costPerUnit.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const formatResourceCostUnitType = (costUnitType: ResourceCostUnitType) => {
  if (costUnitType === 'per day') return 'Per day'
  if (costUnitType === 'per hour') return 'Per hour'
  return 'To purchase'
}
