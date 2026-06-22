/**
 * Smoke-check organization migration assumptions for local/dev verification.
 * Run with: npx tsx scripts/verify-organizations-migration.ts
 */
import { USCG_ORGANIZATION_ID, USCG_ORGANIZATION_SLUG } from '../src/lib/organization-constants'

const checks = [
  USCG_ORGANIZATION_ID.length === 36,
  USCG_ORGANIZATION_SLUG === 'uscg',
]

if (!checks.every(Boolean)) {
  console.error('Organization migration constants failed verification.')
  process.exit(1)
}

console.log('Organization migration constants look valid.')
