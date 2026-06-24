import type { ResourceListItemData } from '@/features/resources/types'

export type ScoredWorkspaceAsset = {
  asset: ResourceListItemData
  score: number
  matchReason: string
}

export type RankedWorkspaceAssets = {
  suggested: ScoredWorkspaceAsset[]
  other: ScoredWorkspaceAsset[]
  query: string
}

export type AssetRelevanceOptions = {
  suggestionThreshold?: number
  minQueryLength?: number
}

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'for',
  'to',
  'in',
  'on',
  'at',
  'by',
  'with',
])

const QUERY_ALIASES: Record<string, string[]> = {
  helo: ['helicopter', 'rotary', 'aircraft'],
  helicopter: ['helo', 'rotary', 'aircraft'],
  boat: ['vessel', 'small boat', 'craft'],
  vessel: ['boat', 'ship', 'craft'],
  truck: ['vehicle', 'transport'],
  generator: ['power', 'genset'],
}

const DEFAULT_SUGGESTION_THRESHOLD = 12

export function normalizeResourceQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function tokenizeResourceQuery(query: string): string[] {
  const normalized = normalizeResourceQuery(query)
  if (!normalized) return []

  const baseTokens = normalized
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))

  const expanded = new Set<string>()
  for (const token of baseTokens) {
    expanded.add(token)
    for (const alias of QUERY_ALIASES[token] ?? []) {
      expanded.add(alias)
    }
  }
  return [...expanded]
}

export function buildAssetSearchText(asset: ResourceListItemData): string {
  const parts = [
    asset.name,
    asset.type,
    asset.unitType,
    asset.unitName,
    asset.owner,
    asset.teamLead,
    asset.location,
    asset.notes,
    asset.currentLocation,
    asset.opcon,
    asset.tacon,
    asset.pointOfContact,
    asset.owningOrganization,
    asset.hullTailNumber,
    asset.symbology,
    asset.capabilities,
    asset.competencyFunction,
    asset.status,
    asset.checkInStatus,
  ]
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function searchTextIncludesToken(searchText: string, token: string): boolean {
  if (!token) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
  return pattern.test(searchText)
}

function scoreTokenOverlap(searchText: string, tokens: string[]): { score: number; reason: string } {
  if (tokens.length === 0) return { score: 0, reason: '' }

  let matched = 0
  const matchedTokens: string[] = []
  for (const token of tokens) {
    if (searchTextIncludesToken(searchText, token)) {
      matched += 1
      matchedTokens.push(token)
    }
  }

  if (matched === 0) return { score: 0, reason: '' }

  const coverage = matched / tokens.length
  return {
    score: Math.round(40 * coverage + matched * 8),
    reason: `Matched terms: ${matchedTokens.join(', ')}`,
  }
}

export function scoreAssetRelevance(
  asset: ResourceListItemData,
  query: string
): ScoredWorkspaceAsset {
  const normalizedQuery = normalizeResourceQuery(query)
  const tokens = tokenizeResourceQuery(query)
  const searchText = buildAssetSearchText(asset)

  if (!normalizedQuery) {
    return { asset, score: 0, matchReason: '' }
  }

  let score = 0
  const reasons: string[] = []

  const name = asset.name.trim().toLowerCase()
  const type = asset.type.trim().toLowerCase()
  const unitName = asset.unitName.trim().toLowerCase()
  const unitType = asset.unitType.trim().toLowerCase()

  if (name === normalizedQuery || type === normalizedQuery) {
    score += 100
    reasons.push('Exact label match')
  } else {
    if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) {
      score += 60
      reasons.push('Name match')
    }
    if (type.includes(normalizedQuery) || normalizedQuery.includes(type)) {
      score += 50
      reasons.push('Type match')
    }
    if (unitName.includes(normalizedQuery)) {
      score += 35
      reasons.push('Unit name match')
    }
    if (unitType.includes(normalizedQuery)) {
      score += 30
      reasons.push('Unit type match')
    }
  }

  const overlap = scoreTokenOverlap(searchText, tokens)
  score += overlap.score
  if (overlap.reason) reasons.push(overlap.reason)

  if (searchText.includes(normalizedQuery)) {
    score += 20
    reasons.push('Full-text match')
  }

  return {
    asset,
    score,
    matchReason: reasons.slice(0, 2).join(' · '),
  }
}

export function rankWorkspaceAssetsForResourceQuery(
  assets: ResourceListItemData[],
  query: string,
  options: AssetRelevanceOptions = {}
): RankedWorkspaceAssets {
  const { suggestionThreshold = DEFAULT_SUGGESTION_THRESHOLD, minQueryLength = 2 } = options
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < minQueryLength) {
    return {
      suggested: [],
      other: assets
        .map((asset) => ({ asset, score: 0, matchReason: '' }))
        .sort((left, right) => left.asset.name.localeCompare(right.asset.name)),
      query: trimmedQuery,
    }
  }

  const scored = assets
    .map((asset) => scoreAssetRelevance(asset, trimmedQuery))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      return left.asset.name.localeCompare(right.asset.name)
    })

  const suggested = scored.filter((entry) => entry.score >= suggestionThreshold)
  const suggestedKeys = new Set(suggested.map((entry) => entry.asset.assetKey))
  const other = scored.filter((entry) => !suggestedKeys.has(entry.asset.assetKey))

  return {
    suggested,
    other,
    query: trimmedQuery,
  }
}

export function buildAssetSnapshotForMatching(asset: ResourceListItemData): {
  assetKey: string
  searchText: string
} {
  return {
    assetKey: asset.assetKey,
    searchText: buildAssetSearchText(asset),
  }
}
