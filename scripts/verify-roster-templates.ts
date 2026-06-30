import {
  createBuildTeamRosterDraftFromTemplate,
  createDefaultBuildTeamRosterDraft,
  ensureCreatorInBuildTeamDraft,
  isCreatorIncidentCommanderDraftMember,
  normalizeBuildTeamRosterDraftForApply,
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
import { resolveEffectiveLocalRosterDraft } from '../src/features/roster/local-roster-plan'
import { ICS_ORG_CHART_POSITIONS } from '../src/features/roster/ics-org-chart-structure'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(ROSTER_TEMPLATE_CATALOG.length === 4, 'four roster templates should be seeded in catalog')
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

const hwcgDraft = createBuildTeamRosterDraftFromTemplate('hwcg-source-control')
assert(
  hwcgDraft.visibleStandardPositions.includes('Incident Commander') &&
    hwcgDraft.visibleStandardPositions.includes('Operations Section Chief'),
  'HWCG Source Control should include Incident Commander and Operations Section Chief'
)
assert(
  hwcgDraft.customPositions.some((position) => position.name === 'Source Control Branch') &&
    hwcgDraft.customPositions.some((position) => position.name === 'Relief Well Group'),
  'HWCG Source Control should seed Source Control Branch and Relief Well Group custom positions'
)
assert(
  hwcgDraft.customPositions.length === 40,
  'HWCG Source Control should seed 40 custom positions'
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

const legacyDeferredDraft = createBuildTeamRosterDraftFromTemplate('full-ics-roster', 'op_period_1')
const normalizedDraft = normalizeBuildTeamRosterDraftForApply(legacyDeferredDraft)
assert(
  normalizedDraft.effectTiming === 'immediate',
  'legacy deferred drafts should normalize to immediate apply'
)
const localPlan = {
  draft: normalizedDraft,
  applied: true,
}
const effectiveDraft = resolveEffectiveLocalRosterDraft(localPlan)
assert(
  effectiveDraft?.visibleStandardPositions.length === ICS_ORG_CHART_POSITIONS.length,
  'local roster plan should use full configured draft immediately'
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
    !buildTeamSource.includes('Roster takes effect') &&
    buildTeamSource.includes('RosterDisplayFiltersMenu') &&
    buildTeamSource.includes('WorkspacePositionRosterTable') &&
    buildTeamSource.includes('WorkspaceOrgChartRoster') &&
    buildTeamSource.includes("layout?: 'page' | 'compact'") &&
    buildTeamSource.includes("layoutMode={isPageLayout ? 'wide' : 'compact'}") &&
    buildTeamSource.includes('CREATE_ACTIVATION_PORTAL_Z_CLASS'),
  'Build Team step should include template and roster controls without effect timing'
)

const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
assert(
  appSource.includes('BuildTeamRosterStep') &&
    appSource.includes('activationRosterDraft') &&
    appSource.includes('applyWorkspaceRosterPlan') &&
    appSource.includes('normalizeBuildTeamRosterDraftForApply') &&
    appSource.includes('CreateActivationPageLayout') &&
    appSource.includes('navigateToCreateActivation') &&
    !appSource.includes('open={isCreateActivationOpen}') &&
    appSource.includes('if (isCreateActivationOpen)') &&
    !appSource.includes('fixed inset-0 z-[200]') &&
    !appSource.includes('Placeholder for roster configuration UI') &&
    !appSource.includes('Full roster activates at Operational Period 1'),
  'App should use full-page create activation flow with immediate roster apply'
)

assert(
  getRosterTemplateBySlug('full-ics-roster')?.name === 'Full ICS Roster',
  'template lookup by slug should work'
)

console.log('verify-roster-templates: all checks passed')
