import {
  buildUniqueAssetKey,
  createInputToCatalogFields,
  mergeHubAssetCatalog,
  organizationAssetToCatalogRecord,
  resourceToUpdateOrganizationAssetInput,
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

const orgAssetPayload = {
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
  mapLocation: [-76.2, 36.8] as [number, number],
  createdAt: '2026-06-22T12:00:00.000Z',
  catalogFields: {
    teamLead: 'CWO Smith',
    opcon: 'District 5',
    quantity: 2,
    costPerUnit: 1500,
  },
}

const merged = mergeHubAssetCatalog(getAllHubAssets(), [orgAssetPayload])

assert(
  merged.some((asset) => asset.assetKey === 'org-custom-boat-a1b2'),
  'merged catalog should include organization asset'
)

const catalogRecord = organizationAssetToCatalogRecord(orgAssetPayload, 0)

assert(catalogRecord.name === 'Custom Boat', 'catalog record preserves name')
assert(catalogRecord.id >= 10001, 'catalog record uses org id base')
assert(catalogRecord.teamLead === 'CWO Smith', 'catalog record merges extended fields')
assert(catalogRecord.opcon === 'District 5', 'catalog record merges opcon')
assert(catalogRecord.quantity === 2, 'catalog record merges quantity')

const updateInput = resourceToUpdateOrganizationAssetInput({
  ...catalogRecord,
  deploymentKind: 'available',
  assignedWorkspaceId: null,
  assignedWorkspaceKind: null,
  assignedIncidentName: null,
  assignedExerciseName: null,
  orgChartReportsTo: null,
  orgChartSortOrder: 0,
  ics204DocumentId: null,
})

assert(updateInput.assetKey === 'org-custom-boat-a1b2', 'update input preserves asset key')
assert(updateInput.teamLead === 'CWO Smith', 'update input preserves extended fields')

const catalogFields = createInputToCatalogFields({
  name: 'New Asset',
  type: 'Boat',
  teamLead: 'Lead',
  quantity: 3,
})

assert(catalogFields.teamLead === 'Lead', 'create input maps extended fields')
assert(catalogFields.quantity === 3, 'create input maps quantity')

console.log('verify-create-organization-asset: all checks passed')
