import { emptyWorkspacePositionCatalog } from '../src/features/roster/workspace-positions'
import {
  isOrgChartParentWithinOperationsSubtree,
  isPositionWithinOrBelowOperationsSectionChief,
  isStandardPositionWithinOperationsSubtree,
  OPERATIONS_SECTION_CHIEF_POSITION,
} from '../src/features/roster/operations-work-assignment-scope'
import { defaultAllowWorkAssignment } from '../src/lib/workspace-position-settings'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const catalog = emptyWorkspacePositionCatalog()

assert(
  isStandardPositionWithinOperationsSubtree(OPERATIONS_SECTION_CHIEF_POSITION),
  'Operations Section Chief should be within operations subtree'
)
assert(
  isStandardPositionWithinOperationsSubtree('Staging Area Manager'),
  'Staging Area Manager should be within operations subtree'
)
assert(
  !isStandardPositionWithinOperationsSubtree('Planning Section Chief'),
  'Planning Section Chief should not be within operations subtree'
)
assert(
  !isStandardPositionWithinOperationsSubtree('Incident Commander'),
  'Incident Commander should not be within operations subtree'
)

assert(
  defaultAllowWorkAssignment('Operations Section Chief', catalog),
  'default allow work assignment for Operations Section Chief'
)
assert(
  defaultAllowWorkAssignment('Staging Area Manager', catalog),
  'default allow work assignment for Staging Area Manager'
)
assert(
  !defaultAllowWorkAssignment('Planning Section Chief', catalog),
  'Planning Section Chief should default to no work assignment'
)

assert(
  isPositionWithinOrBelowOperationsSectionChief('Division Alpha', catalog, {
    reportsTo: OPERATIONS_SECTION_CHIEF_POSITION,
  }),
  'custom position under Operations Section Chief should be eligible'
)
assert(
  !isPositionWithinOrBelowOperationsSectionChief('Division Alpha', catalog, {
    reportsTo: 'Planning Section Chief',
  }),
  'custom position under Planning should not be eligible'
)

assert(
  isOrgChartParentWithinOperationsSubtree(OPERATIONS_SECTION_CHIEF_POSITION, catalog),
  'single resource under Operations Section Chief should be eligible'
)
assert(
  !isOrgChartParentWithinOperationsSubtree('Planning Section Chief', catalog),
  'single resource under Planning should not be eligible'
)

console.log('verify-operations-work-assignment-defaults: all checks passed')
