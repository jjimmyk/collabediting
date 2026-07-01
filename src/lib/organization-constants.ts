export const USCG_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001'
export const USCG_ORGANIZATION_SLUG = 'uscg'
export const USCG_ORGANIZATION_NAME = 'United States Coast Guard'
export const BSEE_ORGANIZATION_DISPLAY_NAME = 'Bureau of Safety and Environmental Enforcement'
export const FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME = 'Fusion Centers Demo'

export const ACTIVE_ORGANIZATION_STORAGE_KEY = 'pratus:active-organization-id'

export type HubOrganizationDisplayOptions = {
  oilSpillTrajectoryModelsEnabled?: boolean
  fusionCentersEnabled?: boolean
}

export function getHubOrganizationDisplayName(
  options: HubOrganizationDisplayOptions,
  organizationId?: string | null
): string {
  const isUscgOrg = organizationId == null || organizationId === USCG_ORGANIZATION_ID
  if (options.fusionCentersEnabled && isUscgOrg) {
    return FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME
  }
  if (options.oilSpillTrajectoryModelsEnabled && isUscgOrg) {
    return BSEE_ORGANIZATION_DISPLAY_NAME
  }
  return USCG_ORGANIZATION_NAME
}
