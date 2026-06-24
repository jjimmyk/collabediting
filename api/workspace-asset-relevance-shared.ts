export type ApiAssetSnapshot = {
  assetKey: string
  searchText: string
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
}

export function tokenizeResourceQuery(query: string): string[] {
  const normalized = query.trim().toLowerCase()
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

function searchTextIncludesToken(searchText: string, token: string): boolean {
  if (!token) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
  return pattern.test(searchText)
}

export function scoreAssetSearchText(searchText: string, query: string): number {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return 0

  let score = 0
  if (searchTextIncludesToken(searchText, normalizedQuery.replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '))) {
    score += 40
  } else if (searchText.includes(normalizedQuery)) {
    score += 40
  }

  const tokens = tokenizeResourceQuery(query)
  let matched = 0
  for (const token of tokens) {
    if (searchTextIncludesToken(searchText, token)) matched += 1
  }
  if (tokens.length > 0) {
    score += Math.round((matched / tokens.length) * 40)
  }

  return score
}

export function rankAssetSnapshotsLexically(
  assets: ApiAssetSnapshot[],
  query: string,
  suggestionThreshold = 12
): { suggestedKeys: string[]; rankedAssetKeys: string[] } {
  const scored = assets
    .map((asset) => ({
      assetKey: asset.assetKey,
      score: scoreAssetSearchText(asset.searchText, query),
    }))
    .sort((left, right) => right.score - left.score)

  const suggestedKeys = scored
    .filter((entry) => entry.score >= suggestionThreshold)
    .map((entry) => entry.assetKey)

  return {
    suggestedKeys,
    rankedAssetKeys: scored.map((entry) => entry.assetKey),
  }
}

export async function rankAssetSnapshotsWithOpenAi(
  assets: ApiAssetSnapshot[],
  query: string,
  apiKey: string
): Promise<{ suggestedKeys: string[]; rankedAssetKeys: string[]; reasons: Record<string, string> }> {
  const lexical = rankAssetSnapshotsLexically(assets, query)
  if (assets.length === 0) {
    return { ...lexical, reasons: {} }
  }

  const shortlist = assets.slice(0, 40)
  const prompt = [
    'Rank these incident workspace assets by relevance to the resource requirement label.',
    `Requirement label: "${query}"`,
    'Return JSON: {"rankedAssetKeys":["..."], "suggestedKeys":["..."], "reasons":{"assetKey":"short reason"}}',
    'Assets:',
    ...shortlist.map(
      (asset) => `- ${asset.assetKey}: ${asset.searchText.slice(0, 240)}`
    ),
  ].join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You help emergency managers match resource labels to assigned assets. Only use provided asset keys.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) {
    return { ...lexical, reasons: {} }
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content) {
    return { ...lexical, reasons: {} }
  }

  try {
    const parsed = JSON.parse(content) as {
      rankedAssetKeys?: string[]
      suggestedKeys?: string[]
      reasons?: Record<string, string>
    }
    const validKeys = new Set(assets.map((asset) => asset.assetKey))
    const rankedAssetKeys = (parsed.rankedAssetKeys ?? [])
      .filter((key) => validKeys.has(key))
      .concat(assets.map((asset) => asset.assetKey).filter((key) => !(parsed.rankedAssetKeys ?? []).includes(key)))
    const suggestedKeys = (parsed.suggestedKeys ?? []).filter((key) => validKeys.has(key))
    return {
      rankedAssetKeys: [...new Set(rankedAssetKeys)],
      suggestedKeys,
      reasons: parsed.reasons ?? {},
    }
  } catch {
    return { ...lexical, reasons: {} }
  }
}