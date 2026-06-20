import { validateAssetOrgChartReportsTo } from '../src/features/roster/workspace-asset-org-chart'
import {
  assetEffectiveWhenSummary,
  validateAssetEffectiveWhen,
} from '../src/features/roster/roster-asset-effective-when'
import { emptyWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const catalog = emptyWorkspacePositionCatalog()
catalog.allPositionNames.push('Incident Commander', 'Staging Area Manager')
catalog.rosterPositionNames.push('Incident Commander', 'Staging Area Manager')

assert(
  validateAssetOrgChartReportsTo('Incident Commander', catalog) === null,
  'valid asset reports-to should pass'
)

assert(
  validateAssetEffectiveWhen({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'ics_position',
    icsPosition: 'Incident Commander',
    orgChartReportsTo: '',
    pointOfContactMemberId: 'member-1',
    catalog,
    operationalPeriodsEnabled: true,
  }) === null,
  'next OP ICS asset with POC should pass'
)

assert(
  validateAssetEffectiveWhen({
    effectiveWhen: 'now',
    assignmentKind: 'ics_position',
    icsPosition: 'Incident Commander',
    orgChartReportsTo: '',
    pointOfContactMemberId: null,
    catalog,
    operationalPeriodsEnabled: true,
  }) !== null,
  'ICS asset without POC should fail'
)

assert(
  assetEffectiveWhenSummary({
    effectiveWhen: 'next_op_advance',
    assignmentKind: 'single_resource',
    icsPosition: '',
    orgChartReportsTo: 'Incident Commander',
  }).includes('Incident Commander'),
  'single resource next OP summary mentions reports-to position'
)

console.log('verify-add-asset-effective-when: all checks passed')
