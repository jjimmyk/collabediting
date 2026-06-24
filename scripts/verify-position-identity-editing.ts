import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  resolveStandardPositionReportsTo,
  ICS_ORG_CHART_ROOT_POSITION,
} from '../src/features/roster/ics-org-chart-structure'
import {
  buildWorkspacePositionCatalog,
  resolvePositionReportsTo,
  type WorkspaceCustomPosition,
} from '../src/features/roster/workspace-positions'
import { updateDraftCustomPosition } from '../src/features/roster/roster-draft-state'
import { createDefaultBuildTeamRosterDraft } from '../src/features/roster/roster-draft-state'

assert.equal(resolveStandardPositionReportsTo(ICS_ORG_CHART_ROOT_POSITION), null)
assert.equal(
  resolveStandardPositionReportsTo('Operations Section Chief'),
  ICS_ORG_CHART_ROOT_POSITION
)
assert.equal(
  resolveStandardPositionReportsTo('Staging Area Manager'),
  'Operations Section Chief'
)

const customPositions: WorkspaceCustomPosition[] = [
  {
    id: 'custom-1',
    name: 'Division Alpha',
    reportsTo: ICS_ORG_CHART_ROOT_POSITION,
    sortOrder: 0,
    lifecycleStatus: 'active',
  },
]

const catalog = buildWorkspacePositionCatalog(customPositions)
assert.equal(resolvePositionReportsTo('Division Alpha', catalog), ICS_ORG_CHART_ROOT_POSITION)
assert.equal(
  resolvePositionReportsTo('Operations Section Chief', catalog),
  ICS_ORG_CHART_ROOT_POSITION
)

const draft = createDefaultBuildTeamRosterDraft()
const withCustom = {
  ...draft,
  customPositions: [
    {
      id: 'draft-custom-1',
      name: 'Old Name',
      reportsTo: ICS_ORG_CHART_ROOT_POSITION,
      positionType: 'position' as const,
      customTypeLabel: null,
    },
  ],
  positionSettings: {
    'Old Name': {
      positionType: 'position' as const,
      customTypeLabel: null,
      allowWorkAssignment: false,
    },
  },
}

const renamed = updateDraftCustomPosition(withCustom, 'draft-custom-1', {
  name: 'New Name',
  reportsTo: 'Operations Section Chief',
})

assert.equal(renamed.customPositions[0]?.name, 'New Name')
assert.equal(renamed.customPositions[0]?.reportsTo, 'Operations Section Chief')
assert.ok(renamed.positionSettings['New Name'])
assert.equal(renamed.positionSettings['Old Name'], undefined)

const appSource = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
assert.match(appSource, /handleSaveCustomPosition/)
assert.match(appSource, /handleSingleResourceOrgChartPlacementChange/)

const panelSource = readFileSync(
  join(process.cwd(), 'src/features/roster/PositionRosterDetailPanel.tsx'),
  'utf8'
)
assert.match(panelSource, /PositionIdentitySection/)

const singleResourceSource = readFileSync(
  join(process.cwd(), 'src/features/roster/SingleResourceDetailPanel.tsx'),
  'utf8'
)
assert.match(singleResourceSource, /OrgChartReportsToField/)

console.log('verify-position-identity-editing: all checks passed')
