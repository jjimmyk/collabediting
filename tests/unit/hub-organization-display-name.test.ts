import { describe, expect, it } from 'vitest'
import {
  BSEE_ORGANIZATION_DISPLAY_NAME,
  FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME,
  getHubOrganizationDisplayName,
  USCG_ORGANIZATION_ID,
  USCG_ORGANIZATION_NAME,
} from '@/lib/organization-constants'

describe('getHubOrganizationDisplayName', () => {
  it('returns USCG when no demo flags are on', () => {
    expect(getHubOrganizationDisplayName({}, USCG_ORGANIZATION_ID)).toBe(USCG_ORGANIZATION_NAME)
    expect(getHubOrganizationDisplayName({}, null)).toBe(USCG_ORGANIZATION_NAME)
  })

  it('returns BSEE when oil spill flag is on and org is USCG or unset', () => {
    expect(
      getHubOrganizationDisplayName({ oilSpillTrajectoryModelsEnabled: true }, USCG_ORGANIZATION_ID)
    ).toBe(BSEE_ORGANIZATION_DISPLAY_NAME)
    expect(getHubOrganizationDisplayName({ oilSpillTrajectoryModelsEnabled: true }, null)).toBe(
      BSEE_ORGANIZATION_DISPLAY_NAME
    )
  })

  it('returns Fusion Centers Demo when fusion flag is on and org is USCG or unset', () => {
    expect(getHubOrganizationDisplayName({ fusionCentersEnabled: true }, USCG_ORGANIZATION_ID)).toBe(
      FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME
    )
    expect(getHubOrganizationDisplayName({ fusionCentersEnabled: true }, null)).toBe(
      FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME
    )
  })

  it('prefers fusion centers over oil spill when both flags are on', () => {
    expect(
      getHubOrganizationDisplayName(
        { fusionCentersEnabled: true, oilSpillTrajectoryModelsEnabled: true },
        USCG_ORGANIZATION_ID
      )
    ).toBe(FUSION_CENTERS_ORGANIZATION_DISPLAY_NAME)
  })

  it('returns USCG when flags are on but org id is not USCG', () => {
    expect(
      getHubOrganizationDisplayName(
        { oilSpillTrajectoryModelsEnabled: true, fusionCentersEnabled: true },
        '00000000-0000-4000-8000-000000000099'
      )
    ).toBe(USCG_ORGANIZATION_NAME)
  })
})
