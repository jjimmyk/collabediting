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

async function loadRosterExclusions(
  admin: ReturnType<typeof createClient>,
  workspaceId: string,
  position: string
): Promise<{ userIds: Set<string>; emails: Set<string> }> {
  const { data: rosterRows, error: rosterError } = await admin
    .from('workspace_members')
    .select('id, user_id, email')
    .eq('workspace_id', workspaceId)
    .neq('status', 'removed')

  if (rosterError) {
    throw new Error(rosterError.message)
  }

  const memberIdToUserId = new Map<string, string>()
  const rosterUserIds = new Set<string>()
  const rosterEmails = new Set<string>()

  for (const row of rosterRows ?? []) {
    const memberId = typeof row.id === 'string' ? row.id : ''
    const userId = typeof row.user_id === 'string' ? row.user_id : ''
    const email = typeof row.email === 'string' ? row.email.toLowerCase() : ''
    if (memberId && userId) {
      memberIdToUserId.set(memberId, userId)
    }
    if (userId) {
      rosterUserIds.add(userId)
    }
    if (email) {
      rosterEmails.add(email)
    }
  }

  if (!position) {
    return { userIds: rosterUserIds, emails: rosterEmails }
  }

  const [{ data: positionAssignments, error: positionError }, { data: scheduledAssigns, error: scheduleError }] =
    await Promise.all([
      admin.from('workspace_member_positions').select('member_id, ics_position').eq('ics_position', position),
      admin
        .from('workspace_position_member_schedules')
        .select('member_id')
        .eq('workspace_id', workspaceId)
        .eq('position_name', position)
        .eq('schedule_action', 'assign_on_op_advance'),
    ])

  if (positionError) {
    throw new Error(positionError.message)
  }
  if (scheduleError) {
    throw new Error(scheduleError.message)
  }

  const excludedUserIds = new Set<string>()

  for (const row of positionAssignments ?? []) {
    const memberId = typeof row.member_id === 'string' ? row.member_id : ''
    const userId = memberIdToUserId.get(memberId)
    if (userId) {
      excludedUserIds.add(userId)
    }
  }

  for (const row of scheduledAssigns ?? []) {
    const memberId = typeof row.member_id === 'string' ? row.member_id : ''
    const userId = memberIdToUserId.get(memberId)
    if (userId) {
      excludedUserIds.add(userId)
    }
  }

  return { userIds: excludedUserIds, emails: new Set<string>() }
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
    const position =
      typeof req.query.position === 'string' ? req.query.position.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    await authenticateRosterManager(admin, accessToken, workspaceId)

    const organizationId = await getWorkspaceOrganizationId(admin, workspaceId)

    const [{ data: orgMembers, error: orgMembersError }, rosterExclusions] = await Promise.all([
      admin
        .from('organization_members')
        .select('user_id, email, profiles:user_id (full_name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .not('user_id', 'is', null)
        .order('email', { ascending: true })
        .limit(250),
      loadRosterExclusions(admin, workspaceId, position),
    ])

    if (orgMembersError) {
      throw new Error(orgMembersError.message)
    }

    const profileMatches =
      orgMembers?.flatMap((member) => {
        const userId = typeof member.user_id === 'string' ? member.user_id : ''
        const email = typeof member.email === 'string' ? member.email.toLowerCase() : ''
        if (!userId || !email) return []

        const profileRaw = member.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
        const fullName = profile?.full_name ?? null
        const haystack = `${email} ${fullName ?? ''}`.toLowerCase()
        if (query.length > 0 && !haystack.includes(query)) {
          return []
        }

        return [{ userId, email, fullName }]
      }) ?? []

    const resultLimit = query.length > 0 ? 25 : 250

    const results: OrgMemberSearchResult[] = profileMatches
      .filter(
        (entry) =>
          !rosterExclusions.userIds.has(entry.userId) &&
          !rosterExclusions.emails.has(entry.email)
      )
      .slice(0, resultLimit)
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
