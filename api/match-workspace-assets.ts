import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  rankAssetSnapshotsLexically,
  rankAssetSnapshotsWithOpenAi,
  type ApiAssetSnapshot,
} from './workspace-asset-relevance-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type MatchWorkspaceAssetsBody = {
  workspaceId?: string
  query?: string
  assets?: ApiAssetSnapshot[]
}

function parseBody(req: VercelRequest): MatchWorkspaceAssetsBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as MatchWorkspaceAssetsBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as MatchWorkspaceAssetsBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({ error: 'Supabase server environment is not configured.' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const body = parseBody(req)
    const workspaceId = body.workspaceId?.trim()
    const query = body.query?.trim() ?? ''
    const assets = Array.isArray(body.assets) ? body.assets : []

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }
    if (query.length < 2) {
      return res.status(400).json({ error: 'query must be at least 2 characters.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const { data: membership, error: membershipError } = await admin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (membershipError) {
      return res.status(500).json({ error: membershipError.message })
    }
    if (!membership) {
      return res.status(403).json({ error: 'You do not have access to this workspace.' })
    }

    const openAiKey = process.env.OPENAI_API_KEY?.trim()
    if (openAiKey) {
      const aiRanked = await rankAssetSnapshotsWithOpenAi(assets, query, openAiKey)
      return res.status(200).json({
        ok: true,
        engine: 'openai',
        suggestedKeys: aiRanked.suggestedKeys,
        rankedAssetKeys: aiRanked.rankedAssetKeys,
        reasons: aiRanked.reasons,
      })
    }

    const lexical = rankAssetSnapshotsLexically(assets, query)
    return res.status(200).json({
      ok: true,
      engine: 'lexical',
      suggestedKeys: lexical.suggestedKeys,
      rankedAssetKeys: lexical.rankedAssetKeys,
      reasons: {},
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Match workspace assets failed.'
    return res.status(500).json({ error: message })
  }
}
