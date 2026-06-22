import {
  createBuildTeamRosterDraftFromTemplate,
  createDefaultBuildTeamRosterDraft,
  ensureCreatorInBuildTeamDraft,
  isCreatorIncidentCommanderDraftMember,
} from '../src/features/roster/roster-draft-state'
import {
  getDefaultRosterTemplate,
  getRosterTemplateBySlug,
  ROSTER_TEMPLATE_CATALOG,
} from '../src/features/roster/roster-template-catalog'
import {
  buildDraftPositionCatalog,
  buildStandardLifecycleFromDraft,
} from '../src/features/roster/build-draft-position-catalog'
import {
  isLocalRosterPlanPending,
  resolveEffectiveLocalRosterDraft,
} from '../src/features/roster/local-roster-plan'
import { ICS_ORG_CHART_POSITIONS } from '../src/features/roster/ics-org-chart-structure'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(ROSTER_TEMPLATE_CATALOG.length === 3, 'three roster templates should be seeded in catalog')
assert(
  getDefaultRosterTemplate().slug === 'full-ics-roster',
  'default roster template should be Full ICS Roster'
)

const defaultDraft = createDefaultBuildTeamRosterDraft()
assert(defaultDraft.templateSlug === 'full-ics-roster', 'default draft should use Full ICS')
assert(defaultDraft.effectTiming === 'immediate', 'default draft should apply immediately')
assert(
  defaultDraft.visibleStandardPositions.length === ICS_ORG_CHART_POSITIONS.length,
  'Full ICS draft should include all org chart positions'
)

const seededDefaultDraft = ensureCreatorInBuildTeamDraft(defaultDraft, {
  email: 'ic@example.com',
  userId: 'creator-user-id',
})
assert(
  seededDefaultDraft.draftMembers.some(isCreatorIncidentCommanderDraftMember),
  'default activation draft should include creator as Incident Commander when seeded'
)

const simpleDraft = createBuildTeamRosterDraftFromTemplate('simple-ics')
assert(
  simpleDraft.visibleStandardPositions.join(',') === 'Incident Commander',
  'Simple ICS draft should only include Incident Commander'
)

const commandDraft = createBuildTeamRosterDraftFromTemplate('command-and-general-staff')
assert(
  commandDraft.singleResourceSlots.some((slot) => slot.label === 'Agency Representative'),
  'Command & General Staff should include Agency Representative slot'
)

const simpleCatalog = buildDraftPositionCatalog(simpleDraft)
assert(
  simpleCatalog.rosterPositionNames.join(',') === 'Incident Commander',
  'Simple ICS catalog should only expose Incident Commander'
)

const fullCatalog = buildDraftPositionCatalog(defaultDraft)
assert(
  fullCatalog.rosterPositionNames.length > simpleCatalog.rosterPositionNames.length,
  'Full ICS catalog should expose more positions than Simple ICS'
)

const deferredPlan = {
  draft: createBuildTeamRosterDraftFromTemplate('full-ics-roster', 'op_period_1'),
  applied: false,
}
assert(isLocalRosterPlanPending(deferredPlan), 'deferred local plan should be pending before apply')
const effectiveDeferred = resolveEffectiveLocalRosterDraft(deferredPlan)
assert(
  effectiveDeferred?.visibleStandardPositions.join(',') === 'Incident Commander',
  'deferred plan should render IC-only roster before OP1 apply'
)

const archivedLifecycle = buildStandardLifecycleFromDraft(simpleDraft)
assert(
  archivedLifecycle.length > 0 && archivedLifecycle.every((row) => row.archivedAt),
  'archived lifecycle rows should mark hidden standard positions'
)

const buildTeamSource = readFileSync(
  join(process.cwd(), 'src/features/roster/BuildTeamRosterStep.tsx'),
  'utf8'
)
assert(
  buildTeamSource.includes('Roster template') &&
    buildTeamSource.includes('Roster takes effect') &&
    buildTeamSource.includes('RosterDisplayFiltersMenu') &&
    buildTeamSource.includes('WorkspacePositionRosterTable') &&
    buildTeamSource.includes('WorkspaceOrgChartRoster') &&
    buildTeamSource.includes("layout?: 'page' | 'compact'") &&
    buildTeamSource.includes("layoutMode={isPageLayout ? 'wide' : 'compact'}") &&
    buildTeamSource.includes('CREATE_ACTIVATION_PORTAL_Z_CLASS'),
  'Build Team step should include template, timing, roster controls, page layout, and portal z-index'
)

const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
assert(
  appSource.includes('BuildTeamRosterStep') &&
    appSource.includes('activationRosterDraft') &&
    appSource.includes('applyWorkspaceRosterPlan') &&
    appSource.includes('CreateActivationPageLayout') &&
    appSource.includes('navigateToCreateActivation') &&
    !appSource.includes('open={isCreateActivationOpen}') &&
    appSource.includes('if (isCreateActivationOpen)') &&
    !appSource.includes('fixed inset-0 z-[200]') &&
    !appSource.includes('Placeholder for roster configuration UI'),
  'App should use full-page create activation flow with roster draft wiring'
)

assert(
  getRosterTemplateBySlug('full-ics-roster')?.name === 'Full ICS Roster',
  'template lookup by slug should work'
)

console.log('verify-roster-templates: all checks passed')
