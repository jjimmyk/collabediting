import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeCompetencyFunctionLabel } from '../api/roster-competency-shared.js'
import { buildDraftRosterMembers } from '../src/features/roster/build-draft-position-catalog'
import { createDefaultBuildTeamRosterDraft } from '../src/features/roster/roster-draft-state'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(normalizeCompetencyFunctionLabel('  Logistics Lead  ') === 'Logistics Lead', 'trim competency labels')
assert(normalizeCompetencyFunctionLabel('   ') === null, 'blank competency labels become null')

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/070_roster_competency_functions.sql'),
  'utf8'
)
assert(
  migration.includes('organization_roster_competency_functions'),
  'migration should create organization competency catalog'
)
assert(
  migration.includes('workspace_member_positions') &&
    migration.includes('competency_function'),
  'migration should add competency_function to member positions'
)

const draft = createDefaultBuildTeamRosterDraft()
draft.draftMembers = [
  {
    id: 'draft-member-1',
    email: 'ops@example.com',
    assignmentKind: 'ics_position',
    icsPositions: ['Operations Section Chief'],
    orgChartReportsTo: null,
    competencyFunction: 'Operations Lead',
    password: '',
    personSource: 'invite_new',
    existingUserId: null,
  },
  {
    id: 'draft-member-2',
    email: 'resource@example.com',
    assignmentKind: 'single_resource',
    icsPositions: [],
    orgChartReportsTo: 'Operations Section Chief',
    competencyFunction: 'Field Liaison',
    password: '',
    personSource: 'invite_new',
    existingUserId: null,
  },
]

const rosterMembers = buildDraftRosterMembers(draft)
assert(
  rosterMembers[0]?.competencyByPosition?.['Operations Section Chief'] === 'Operations Lead',
  'ICS draft members should map competency to assigned positions'
)
assert(
  rosterMembers[1]?.competencyFunction === 'Field Liaison',
  'single resource draft members should map competencyFunction'
)

console.log('verify-roster-competency-functions: ok')
