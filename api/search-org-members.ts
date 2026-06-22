import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { authenticateRosterManager } from './roster-auth-shared.js'
import { getWorkspaceOrganizationId } from './org-shared.js'

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

    const organizationId = await getWorkspaceOrganizationId(admin, workspaceId)

    const [{ data: orgMembers, error: orgMembersError }, { data: rosterRows, error: rosterError }] =
      await Promise.all([
        admin
          .from('organization_members')
          .select('user_id, email, profiles:user_id (full_name)')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .not('user_id', 'is', null)
          .order('email', { ascending: true })
          .limit(250),
        admin
          .from('workspace_members')
          .select('email, user_id')
          .eq('workspace_id', workspaceId)
          .neq('status', 'removed'),
      ])

    if (orgMembersError) {
      throw new Error(orgMembersError.message)
    }
    if (rosterError) {
      throw new Error(rosterError.message)
    }

    const rosterUserIds = new Set(
      (rosterRows ?? [])
        .map((row) => (typeof row.user_id === 'string' ? row.user_id : ''))
        .filter((value) => value.length > 0)
    )
    const rosterEmails = new Set(
      (rosterRows ?? []).map((row) => (typeof row.email === 'string' ? row.email.toLowerCase() : ''))
    )

    const profileMatches =
      orgMembers?.flatMap((member) => {
        const userId = typeof member.user_id === 'string' ? member.user_id : ''
        const email = typeof member.email === 'string' ? member.email.toLowerCase() : ''
        if (!userId || !email) return []

        const profileRaw = member.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
        const fullName = profile?.full_name ?? null
        const haystack = `${email} ${fullName ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) {
          return []
        }

        return [{ userId, email, fullName }]
      }) ?? []

    const results: OrgMemberSearchResult[] = profileMatches
      .filter((entry) => !rosterUserIds.has(entry.userId) && !rosterEmails.has(entry.email))
      .slice(0, 25)
      .map((entry) => ({
        id: entry.userId,
        email: entry.email,
        fullName: entry.fullName,
      }))

    return res.status(200).json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.'
    console.error('search-org-members handler error', error)
    return res.status(500).json({ error: message })
  }
}
