import { describe, expect, it } from 'vitest'
import {
  BSEE_ORGANIZATION_DISPLAY_NAME,
  getHubOrganizationDisplayName,
  USCG_ORGANIZATION_ID,
  USCG_ORGANIZATION_NAME,
} from '@/lib/organization-constants'

describe('getHubOrganizationDisplayName', () => {
  it('returns USCG when oil spill trajectory models flag is off', () => {
    expect(getHubOrganizationDisplayName(false, USCG_ORGANIZATION_ID)).toBe(USCG_ORGANIZATION_NAME)
    expect(getHubOrganizationDisplayName(false, null)).toBe(USCG_ORGANIZATION_NAME)
  })

  it('returns BSEE when flag is on and org is USCG or unset', () => {
    expect(getHubOrganizationDisplayName(true, USCG_ORGANIZATION_ID)).toBe(
      BSEE_ORGANIZATION_DISPLAY_NAME
    )
    expect(getHubOrganizationDisplayName(true, null)).toBe(BSEE_ORGANIZATION_DISPLAY_NAME)
  })

  it('returns USCG when flag is on but org id is not USCG', () => {
    expect(getHubOrganizationDisplayName(true, '00000000-0000-4000-8000-000000000099')).toBe(
      USCG_ORGANIZATION_NAME
    )
  })
})
