import { buildDynamicOrgChart } from '@/features/roster/build-dynamic-org-chart'
import { collectOrgChartCanvasNodes } from '@/features/roster/org-chart-layout/build-org-chart-graph'
import { computeDefaultOrgChartLayout } from '@/features/roster/org-chart-layout/default-org-chart-layout'
import { mergeOrgChartLayout } from '@/features/roster/org-chart-layout/merge-org-chart-layout'
import {
  assetNodeId,
  parseOrgChartNodeId,
  positionNodeId,
  singleResourceNodeId,
} from '@/features/roster/org-chart-layout/node-ids'
import { emptyWorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import type { ResourceListItemData } from '@/features/resources/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(positionNodeId('Incident Commander') === 'position::Incident Commander', 'position node id')
assert(assetNodeId('asset-1') === 'asset::asset-1', 'asset node id')
assert(singleResourceNodeId('member-1') === 'single_resource::member-1', 'single resource node id')

assert(
  parseOrgChartNodeId('position::Planning Section Chief')?.kind === 'position',
  'parse position id'
)
assert(parseOrgChartNodeId('invalid') === null, 'invalid id returns null')

const catalog = emptyWorkspacePositionCatalog()
catalog.allPositionNames.push('Incident Commander', 'Planning Section Chief')
catalog.rosterPositionNames.push('Incident Commander', 'Planning Section Chief')

const layout = buildDynamicOrgChart(catalog, [] as ResourceListItemData[], [] as WorkspaceRosterMember[])
const visible = new Set(['Incident Commander', 'Planning Section Chief'])
const nodeDefs = collectOrgChartCanvasNodes(layout, visible)

assert(nodeDefs.some((node) => node.id === positionNodeId('Incident Commander')), 'includes IC')
assert(
  nodeDefs.some((node) => node.id === positionNodeId('Planning Section Chief')),
  'includes planning chief'
)

const defaults = computeDefaultOrgChartLayout(nodeDefs)
assert(Object.keys(defaults).length === nodeDefs.length, 'default layout covers all nodes')

const merged = mergeOrgChartLayout(nodeDefs, {
  version: 1,
  nodes: {
    [positionNodeId('Incident Commander')]: { x: 100, y: 200 },
  },
})
assert(
  merged.nodePositions[positionNodeId('Incident Commander')]?.x === 100,
  'saved position overrides default'
)
assert(
  merged.nodePositions[positionNodeId('Planning Section Chief')],
  'unsaved nodes keep default positions'
)

console.log('verify-org-chart-layout: all checks passed')
