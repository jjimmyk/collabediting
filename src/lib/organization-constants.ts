export const USCG_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001'
export const USCG_ORGANIZATION_SLUG = 'uscg'
export const USCG_ORGANIZATION_NAME = 'United States Coast Guard'
export const BSEE_ORGANIZATION_DISPLAY_NAME = 'Bureau of Safety and Environmental Enforcement'

export const ACTIVE_ORGANIZATION_STORAGE_KEY = 'pratus:active-organization-id'

export function getHubOrganizationDisplayName(
  oilSpillTrajectoryModelsEnabled: boolean,
  organizationId?: string | null
): string {
  if (
    oilSpillTrajectoryModelsEnabled &&
    (organizationId == null || organizationId === USCG_ORGANIZATION_ID)
  ) {
    return BSEE_ORGANIZATION_DISPLAY_NAME
  }
  return USCG_ORGANIZATION_NAME
}
