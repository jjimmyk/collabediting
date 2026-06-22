/**
 * Verify default workspace roster emails are present in USCG organization_members.
 * Run with: npx tsx scripts/verify-default-roster-org-members.ts
 */
import { DEFAULT_WORKSPACE_ROSTER_EMAILS } from '../src/lib/default-roster'
import { USCG_ORGANIZATION_SLUG } from '../src/lib/organization-constants'

const expected = [...DEFAULT_WORKSPACE_ROSTER_EMAILS].map((email) => email.toLowerCase()).sort()

if (expected.length !== 7) {
  console.error(`Expected 7 default roster emails, found ${expected.length}.`)
  process.exit(1)
}

console.log(
  `Default roster org verification expects ${expected.length} emails in organization slug "${USCG_ORGANIZATION_SLUG}".`
)
console.log('Run against production after migration 068:')
console.log('')
console.log(
  `select lower(om.email)
from organization_members om
join organizations o on o.id = om.organization_id
where o.slug = '${USCG_ORGANIZATION_SLUG}'
  and lower(om.email) = any (array[${expected.map((email) => `'${email}'`).join(', ')}])
order by 1;`
)
console.log('')
console.log('Expected rows:', expected.join(', '))
