import {
  buildUniqueAssetKey,
  mergeHubAssetCatalog,
  organizationAssetToCatalogRecord,
  slugifyAssetName,
} from '../src/lib/organization-asset-catalog'
import { getAllHubAssets } from '../src/data/hub-asset-catalog'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

assert(slugifyAssetName('USCGC Forward') === 'uscgc-forward', 'slugify asset name')
assert(
  buildUniqueAssetKey('USCGC Forward', 'abcd1234') === 'org-uscgc-forward-abcd1234',
  'build unique asset key'
)

const merged = mergeHubAssetCatalog(getAllHubAssets(), [
  {
    id: 'asset-1',
    organizationId: 'org-1',
    assetKey: 'org-custom-boat-a1b2',
    name: 'Custom Boat',
    type: 'Response Boat',
    owner: 'Sector Test',
    assetStatus: 'FMC',
    location: 'Dock A',
    notes: 'Test asset',
    areaKey: 'atlantic',
    mapLocation: [0, 0],
    createdAt: '2026-06-22T12:00:00.000Z',
  },
])

assert(
  merged.some((asset) => asset.assetKey === 'org-custom-boat-a1b2'),
  'merged catalog should include organization asset'
)

const catalogRecord = organizationAssetToCatalogRecord(
  {
    id: 'asset-1',
    organizationId: 'org-1',
    assetKey: 'org-custom-boat-a1b2',
    name: 'Custom Boat',
    type: 'Response Boat',
    owner: 'Sector Test',
    assetStatus: 'FMC',
    location: 'Dock A',
    notes: 'Test asset',
    areaKey: 'atlantic',
    mapLocation: [-76.2, 36.8],
    createdAt: '2026-06-22T12:00:00.000Z',
  },
  0
)

assert(catalogRecord.name === 'Custom Boat', 'catalog record preserves name')
assert(catalogRecord.id >= 10001, 'catalog record uses org id base')

console.log('verify-create-organization-asset: all checks passed')
