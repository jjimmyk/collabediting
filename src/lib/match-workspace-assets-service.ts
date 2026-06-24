import type { ResourceListItemData } from '@/features/resources/types'
import { buildAssetSnapshotForMatching } from '@/features/resources/workspace-asset-relevance'

export type MatchWorkspaceAssetsParams = {
  accessToken: string
  workspaceId: string
  query: string
  assets: ResourceListItemData[]
}

export type MatchWorkspaceAssetsResult = {
  suggestedKeys: string[]
  rankedAssetKeys: string[]
  engine: 'lexical' | 'openai'
  reasons?: Record<string, string>
}

export async function matchWorkspaceAssetsViaApi(
  params: MatchWorkspaceAssetsParams
): Promise<MatchWorkspaceAssetsResult> {
  const response = await fetch('/api/match-workspace-assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      query: params.query,
      assets: params.assets.map(buildAssetSnapshotForMatching),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    suggestedKeys?: string[]
    rankedAssetKeys?: string[]
    engine?: 'lexical' | 'openai'
    reasons?: Record<string, string>
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not rank workspace assets.')
  }

  return {
    suggestedKeys: payload.suggestedKeys ?? [],
    rankedAssetKeys: payload.rankedAssetKeys ?? [],
    engine: payload.engine ?? 'lexical',
    reasons: payload.reasons,
  }
}
