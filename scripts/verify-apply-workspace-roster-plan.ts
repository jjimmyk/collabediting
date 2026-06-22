import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyTemplateToBuildTeamDraft,
  createBuildTeamRosterDraftFromTemplate,
  ensureCreatorInBuildTeamDraft,
  hasNonCreatorBuildTeamDraftEdits,
  isCreatorIncidentCommanderDraftMember,
} from '../src/features/roster/roster-draft-state'
import { buildDraftRosterMembers } from '../src/features/roster/build-draft-position-catalog'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function validateBuildTeamRosterDraftShape(draft: unknown): boolean {
  if (!draft || typeof draft !== 'object') return false
  const candidate = draft as Record<string, unknown>
  if (typeof candidate.templateSlug !== 'string') return false
  if (candidate.effectTiming !== 'immediate' && candidate.effectTiming !== 'op_period_1') {
    return false
  }
  if (!Array.isArray(candidate.visibleStandardPositions)) return false
  if (!Array.isArray(candidate.archivedStandardPositions)) return false
  if (!Array.isArray(candidate.singleResourceSlots)) return false
  if (!Array.isArray(candidate.draftMembers)) return false
  if (!Array.isArray(candidate.customPositions)) return false
  if (!candidate.positionSettings || typeof candidate.positionSettings !== 'object') {
    return false
  }
  return true
}

const emptyDraft = createBuildTeamRosterDraftFromTemplate('full-ics-roster')
assert(
  validateBuildTeamRosterDraftShape(emptyDraft),
  'template draft should satisfy validation shape'
)

const invalidDraft = { templateSlug: 'full-ics-roster' }
assert(!validateBuildTeamRosterDraftShape(invalidDraft), 'partial draft should fail validation')

const seededDraft = ensureCreatorInBuildTeamDraft(emptyDraft, {
  email: 'commander@example.com',
  userId: 'user-123',
})
assert(
  seededDraft.draftMembers.some(isCreatorIncidentCommanderDraftMember),
  'creator should be seeded as active Incident Commander in draft'
)
assert(
  buildDraftRosterMembers(seededDraft).some(
    (member) =>
      member.email === 'commander@example.com' &&
      member.status === 'active' &&
      member.icsPositions.includes('Incident Commander')
  ),
  'draft roster members should include active Incident Commander creator'
)
assert(
  !hasNonCreatorBuildTeamDraftEdits(seededDraft),
  'creator-only draft should not count as non-creator edits'
)

const withInvite = {
  ...seededDraft,
  draftMembers: [
    ...seededDraft.draftMembers,
    {
      id: 'draft-member-invite-1',
      email: 'ops@example.com',
      assignmentKind: 'ics_position' as const,
      icsPositions: ['Operations Section Chief'],
      orgChartReportsTo: null,
      password: 'password1234',
      personSource: 'invite_new' as const,
      existingUserId: null,
      status: 'invited' as const,
    },
  ],
}
assert(
  hasNonCreatorBuildTeamDraftEdits(withInvite),
  'additional draft invites should count as non-creator edits'
)

const switchedTemplate = applyTemplateToBuildTeamDraft(withInvite, 'simple-ics', false)
assert(
  switchedTemplate.draftMembers.some(isCreatorIncidentCommanderDraftMember),
  'template switch should preserve creator Incident Commander row'
)
assert(
  switchedTemplate.draftMembers.length === 1,
  'template switch without preserve should keep only creator row'
)

const rosterPlanSharedSource = readFileSync(
  join(process.cwd(), 'api/roster-plan-shared.ts'),
  'utf8'
)
assert(
  rosterPlanSharedSource.includes('validateBuildTeamRosterDraft') &&
    rosterPlanSharedSource.includes('ensureCreatorAsIncidentCommander') &&
    rosterPlanSharedSource.includes('runRosterPlanStep') &&
    rosterPlanSharedSource.includes('archivedPositions.map'),
  'roster plan shared module should validate drafts, ensure creator, and batch archive upserts'
)

const applyPlanSource = readFileSync(
  join(process.cwd(), 'api/apply-workspace-roster-plan.ts'),
  'utf8'
)
assert(
  applyPlanSource.includes('validateBuildTeamRosterDraft(body.draftPlan)') &&
    applyPlanSource.includes('ensureCreatorAsIncidentCommander') &&
    applyPlanSource.includes('runRosterPlanStep'),
  'apply workspace roster plan API should validate draft and run stepped apply'
)

const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
assert(
  appSource.includes('ensureCreatorInBuildTeamDraft') &&
    appSource.includes('seedActivationRosterDraft') &&
    appSource.includes('was created, but the roster plan could not be applied'),
  'App should seed creator in activation draft and continue after roster plan failure'
)

const migrationSource = readFileSync(
  join(process.cwd(), 'supabase/migrations/065_roster_templates.sql'),
  'utf8'
)
assert(
  migrationSource.includes('create table if not exists public.workspace_roster_plans') &&
    migrationSource.includes("'full-ics-roster'") &&
    migrationSource.includes("'simple-ics'") &&
    migrationSource.includes("'command-and-general-staff'"),
  'migration 065 should create roster plan tables and seed templates'
)

console.log('verify-apply-workspace-roster-plan: all checks passed')
