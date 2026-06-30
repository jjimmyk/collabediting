import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { loadActiveOrganizationMembers } from './org-member-lookup-shared.js'
import { userBelongsToOrganization, userIsPlatformOrgAdmin } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export type OrgMemberSearchResult = {
  id: string | null
  email: string
  fullName: string | null
  qualifications: string[]
  alreadyOnRoster: boolean
  canAdd: boolean
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

    const organizationId =
      typeof req.query.organizationId === 'string' ? req.query.organizationId.trim() : ''
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''
    const position =
      typeof req.query.position === 'string' ? req.query.position.trim() : ''

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const canRead =
      (await userIsPlatformOrgAdmin(admin, user.id)) ||
      (await userBelongsToOrganization(admin, user.id, organizationId))

    if (!canRead) {
      return res.status(403).json({ error: 'You do not have permission to read organization members.' })
    }

    const orgMembers = await loadActiveOrganizationMembers(admin, organizationId)

    const qualificationsByUserId = new Map<string, string[]>()
    const qualificationsByEmail = new Map<string, string[]>()
    for (const member of orgMembers) {
      if (member.userId) {
        qualificationsByUserId.set(member.userId, member.qualifications)
      }
      qualificationsByEmail.set(member.organizationMemberEmail, member.qualifications)
    }

    const profileMatches = orgMembers.flatMap((member) => {
      const email = member.organizationMemberEmail
      const userId = member.userId
      const fullName = member.fullName
      const haystack = `${email} ${fullName ?? ''} ${member.qualifications.join(' ')}`.toLowerCase()
      if (query.length > 0 && !haystack.includes(query)) {
        return []
      }

      return [{ userId, email, fullName }]
    })

    const resultLimit = query.length > 0 ? 25 : 250

    const results: OrgMemberSearchResult[] = profileMatches.slice(0, resultLimit).map((entry) => ({
      id: entry.userId,
      email: entry.email,
      fullName: entry.fullName,
      qualifications:
        (entry.userId ? qualificationsByUserId.get(entry.userId) : undefined) ??
        qualificationsByEmail.get(entry.email) ??
        [],
      alreadyOnRoster: false,
      canAdd: Boolean(entry.userId),
    }))

    if (position) {
      return res.status(200).json({
        results: results.filter((entry) => entry.canAdd),
      })
    }

    return res.status(200).json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.'
    console.error('search-organization-members handler error', error)
    return res.status(500).json({ error: message })
  }
}
