import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  loadOrganizationMemberProfilesByMemberIds,
  saveOrganizationMemberProfile,
} from './org-member-profile-shared.js'
import {
  userBelongsToOrganization,
  userIsOrgAdminForOrganization,
  userIsPlatformOrgAdmin,
} from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type PatchOrganizationMemberProfileBody = {
  organizationMemberId?: string
  phone?: string | null
  address?: string | null
  defaultRadioContact?: string | null
  homeAorNodeId?: string | null
  qualifications?: string[]
}

function parseBody(req: VercelRequest): PatchOrganizationMemberProfileBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as PatchOrganizationMemberProfileBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as PatchOrganizationMemberProfileBody
}

async function userCanManageOrganizationMemberProfile(
  admin: ReturnType<typeof createClient>,
  userId: string,
  organizationMemberId: string
): Promise<boolean> {
  if (await userIsPlatformOrgAdmin(admin, userId)) {
    return true
  }

  const { data, error } = await admin
    .from('organization_members')
    .select('organization_id, user_id, status')
    .eq('id', organizationMemberId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!data || data.status === 'removed') {
    return false
  }

  if (data.user_id === userId) {
    return true
  }

  return userIsOrgAdminForOrganization(admin, userId, data.organization_id)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'PATCH') {
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

    const organizationMemberId =
      req.method === 'GET'
        ? typeof req.query.organizationMemberId === 'string'
          ? req.query.organizationMemberId.trim()
          : ''
        : parseBody(req).organizationMemberId?.trim() ?? ''

    if (!organizationMemberId) {
      return res.status(400).json({ error: 'organizationMemberId is required.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const { data: memberRow, error: memberError } = await admin
      .from('organization_members')
      .select('organization_id, user_id, status')
      .eq('id', organizationMemberId)
      .maybeSingle()

    if (memberError) {
      throw new Error(memberError.message)
    }
    if (!memberRow || memberRow.status === 'removed') {
      return res.status(404).json({ error: 'Organization member not found.' })
    }

    const canRead =
      (await userIsPlatformOrgAdmin(admin, user.id)) ||
      (await userBelongsToOrganization(admin, user.id, memberRow.organization_id))

    if (!canRead) {
      return res.status(403).json({ error: 'You do not have permission to view this profile.' })
    }

    if (req.method === 'GET') {
      const profiles = await loadOrganizationMemberProfilesByMemberIds(admin, [organizationMemberId])
      const profile = profiles.get(organizationMemberId) ?? {
        organizationMemberId,
        phone: null,
        address: null,
        defaultRadioContact: null,
        homeAorNodeId: null,
        qualifications: [],
      }
      return res.status(200).json({ profile })
    }

    const canManage = await userCanManageOrganizationMemberProfile(
      admin,
      user.id,
      organizationMemberId
    )
    if (!canManage) {
      return res.status(403).json({ error: 'You do not have permission to edit this profile.' })
    }

    const body = parseBody(req)
    const profile = await saveOrganizationMemberProfile(admin, organizationMemberId, {
      phone: body.phone,
      address: body.address,
      defaultRadioContact: body.defaultRadioContact,
      homeAorNodeId: body.homeAorNodeId,
      qualifications: body.qualifications,
    })

    return res.status(200).json({ profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile request failed.'
    console.error('org-member-profile handler error', error)
    return res.status(500).json({ error: message })
  }
}
