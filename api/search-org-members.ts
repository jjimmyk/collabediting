import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRosterManager } from './roster-auth-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export type OrgMemberSearchResult = {
  id: string
  email: string
  fullName: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
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

    const workspaceId =
      typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }

    if (query.length < 2) {
      return res.status(200).json({ results: [] satisfies OrgMemberSearchResult[] })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await authenticateRosterManager(admin, accessToken, workspaceId)

    const escaped = query.replace(/[%_,]/g, '\\$&')
    const pattern = `%${escaped}%`

    const [{ data: profiles, error: profilesError }, { data: rosterRows, error: rosterError }] =
      await Promise.all([
        admin
          .from('profiles')
          .select('id, email, full_name')
          .or(`email.ilike."${pattern}",full_name.ilike."${pattern}"`)
          .order('email', { ascending: true })
          .limit(25),
        admin
          .from('workspace_members')
          .select('email')
          .eq('workspace_id', workspaceId)
          .neq('status', 'removed'),
      ])

    if (profilesError) {
      throw new Error(profilesError.message)
    }
    if (rosterError) {
      throw new Error(rosterError.message)
    }

    const rosterEmails = new Set(
      (rosterRows ?? []).map((row) => (typeof row.email === 'string' ? row.email.toLowerCase() : ''))
    )

    const results: OrgMemberSearchResult[] = (profiles ?? [])
      .filter((profile) => {
        const email = typeof profile.email === 'string' ? profile.email.toLowerCase() : ''
        return email.length > 0 && !rosterEmails.has(email)
      })
      .map((profile) => ({
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name ?? null,
      }))

    return res.status(200).json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.'
    console.error('search-org-members handler error', error)
    return res.status(500).json({ error: message })
  }
}
