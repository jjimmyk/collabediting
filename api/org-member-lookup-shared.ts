import type { SupabaseClient } from '@supabase/supabase-js'
import { loadOrganizationMemberProfilesByMemberIds } from './org-member-profile-shared.js'

export type ResolvedOrgMember = {
  organizationMemberId: string
  organizationMemberEmail: string
  userId: string | null
  fullName: string | null
  qualifications: string[]
}

export async function loadActiveOrganizationMembers(
  admin: SupabaseClient,
  organizationId: string
): Promise<ResolvedOrgMember[]> {
  const { data: orgMembers, error: orgMembersError } = await admin
    .from('organization_members')
    .select('id, user_id, email')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('email', { ascending: true })
    .limit(250)

  if (orgMembersError) {
    throw new Error(orgMembersError.message)
  }

  const rows =
    orgMembers?.flatMap((member) => {
      const organizationMemberId = typeof member.id === 'string' ? member.id : ''
      const email = typeof member.email === 'string' ? member.email.trim().toLowerCase() : ''
      if (!organizationMemberId || !email) return []
      return [
        {
          organizationMemberId,
          email,
          userId: typeof member.user_id === 'string' ? member.user_id : null,
        },
      ]
    }) ?? []

  if (rows.length === 0) {
    return []
  }

  const linkedUserIds = rows
    .map((row) => row.userId)
    .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
  const unresolvedEmails = rows.filter((row) => !row.userId).map((row) => row.email)

  const profileQueries = []
  if (linkedUserIds.length > 0) {
    profileQueries.push(
      admin.from('profiles').select('id, email, full_name').in('id', linkedUserIds)
    )
  }
  if (unresolvedEmails.length > 0) {
    profileQueries.push(
      admin.from('profiles').select('id, email, full_name').in('email', unresolvedEmails)
    )
  }

  const profileRows = (
    await Promise.all(
      profileQueries.map(async (query) => {
        const { data, error } = await query
        if (error) {
          throw new Error(error.message)
        }
        return data ?? []
      })
    )
  ).flat()

  const profileById = new Map<string, { email: string; fullName: string | null }>()
  const profileByEmail = new Map<string, { id: string; fullName: string | null }>()
  for (const profile of profileRows) {
    const id = typeof profile.id === 'string' ? profile.id : ''
    const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : ''
    const fullName =
      typeof profile.full_name === 'string' && profile.full_name.trim().length > 0
        ? profile.full_name.trim()
        : null
    if (id) {
      profileById.set(id, { email, fullName })
    }
    if (email && id) {
      profileByEmail.set(email, { id, fullName })
    }
  }

  const memberProfiles = await loadOrganizationMemberProfilesByMemberIds(
    admin,
    rows.map((row) => row.organizationMemberId)
  )

  return rows.map((row) => {
    const profileFromUserId = row.userId ? profileById.get(row.userId) : undefined
    const profileFromEmail = profileByEmail.get(row.email)
    const userId = row.userId ?? profileFromEmail?.id ?? null
    const fullName = profileFromUserId?.fullName ?? profileFromEmail?.fullName ?? null
    const memberProfile = memberProfiles.get(row.organizationMemberId)

    return {
      organizationMemberId: row.organizationMemberId,
      organizationMemberEmail: row.email,
      userId,
      fullName,
      qualifications: memberProfile?.qualifications ?? [],
    }
  })
}
