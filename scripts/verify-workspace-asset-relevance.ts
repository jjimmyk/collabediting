import { rankAssetSnapshotsLexically } from '../api/workspace-asset-relevance-shared.ts'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const assets = [
  {
    assetKey: 'helo-1',
    searchText: 'mh-65 dolphin helicopter aircraft aerial hoist',
  },
  {
    assetKey: 'boat-1',
    searchText: 'small boat vessel rb-s 01',
  },
]

const ranked = rankAssetSnapshotsLexically(assets, 'Helicopter')
assert(ranked.suggestedKeys.includes('helo-1'), 'helicopter asset should be suggested')
assert(!ranked.suggestedKeys.includes('boat-1'), 'boat should not be suggested for helicopter')

console.log('verify-workspace-asset-relevance: ok')
