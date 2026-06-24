import { getAllHubAssets } from '../src/data/hub-asset-catalog'
import { mergeHubAssetCatalog } from '../src/lib/organization-asset-catalog'
import { buildHubAorAreaViews } from '../src/features/hub/aor/hub-aor-tree'
import {
  filterHubAorAreaViews,
  hubAorPanelItemIdFromResultId,
  hubAorScrollTargetFromResultId,
  searchHubAorFlatHits,
  searchHubAorHierarchy,
} from '../src/features/hub/aor/hub-aor-search'
import { HUB_AOR_HIERARCHY_NODES } from '../src/features/hub/aor/hub-aor-hierarchy-nodes'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

const assets = mergeHubAssetCatalog(getAllHubAssets(), [])
const areaViews = buildHubAorAreaViews(assets)

assert(areaViews.length === 2, 'expected Atlantic and Pacific area views')
assert(
  areaViews.some((view) => view.districts.length > 0),
  'expected districts in at least one area view'
)
assert(HUB_AOR_HIERARCHY_NODES.length >= 30, 'expected hierarchy seed nodes')

const virginiaSearch = searchHubAorHierarchy(areaViews, 'Virginia')
assert(
  virginiaSearch.directMatchNodeIds.has('sector-virginia'),
  'Virginia search should match Sector Virginia'
)
assert(virginiaSearch.expandDistrictIds.has(3), 'Virginia search should expand District 5 Mid-Atlantic (id 3)')

const kodiakSearch = searchHubAorHierarchy(areaViews, 'Kodiak')
assert(
  kodiakSearch.directMatchNodeIds.has('airsta-kodiak'),
  'Kodiak search should match Air Station Kodiak'
)

const filteredVirginia = filterHubAorAreaViews(areaViews, virginiaSearch, true)
assert(filteredVirginia.length > 0, 'filtered views should not be empty for Virginia query')
assert(
  filteredVirginia.some((view) =>
    view.districts.some((district) =>
      district.childNodes.some((node) => node.node.id === 'sector-virginia')
    )
  ),
  'filtered tree should include Sector Virginia'
)

const flatHits = searchHubAorFlatHits(areaViews, 'Elizabeth City')
assert(flatHits.length > 0, 'flat search should return hits for Elizabeth City')
assert(
  flatHits.some((hit) => hit.title.includes('Elizabeth City')),
  'flat hit title should mention Elizabeth City'
)

const districtHit = flatHits.find((hit) => hit.kind === 'hub-aor-district') ??
  searchHubAorFlatHits(areaViews, 'District 7')[0]
if (districtHit?.kind === 'hub-aor-district') {
  assert(
    hubAorScrollTargetFromResultId(districtHit.id) === String(districtHit.id.replace('hub-aor-district-', '')),
    'district scroll target should strip prefix'
  )
  assert(
    hubAorPanelItemIdFromResultId(districtHit.id).startsWith('aor-'),
    'district panel item id should use aor- prefix'
  )
}

const nodeHit = searchHubAorFlatHits(areaViews, 'Sector Miami')[0]
if (nodeHit?.kind === 'hub-aor-node') {
  assert(
    hubAorScrollTargetFromResultId(nodeHit.id) === 'sector-miami',
    'node scroll target should be bare node id'
  )
  assert(
    hubAorPanelItemIdFromResultId(nodeHit.id) === nodeHit.id,
    'node panel item id should match search result id'
  )
}

console.log('verify-hub-aor-search: all checks passed')
