import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import type {
  OrganizationMemberProfile,
  OrganizationMemberProfileUpdateInput,
} from '@/lib/organization-types'

export async function fetchOrganizationMemberProfile(params: {
  accessToken: string
  organizationMemberId: string
}): Promise<OrganizationMemberProfile | null> {
  if (!isSupabaseConfigured) return null

  const searchParams = new URLSearchParams({
    organizationMemberId: params.organizationMemberId,
  })

  const response = await fetch(`/api/org-member-profile?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    profile?: OrganizationMemberProfile
  }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load member profile.')
  }

  return payload.profile ?? null
}

export async function updateOrganizationMemberProfile(params: {
  accessToken: string
  organizationMemberId: string
  input: OrganizationMemberProfileUpdateInput
}): Promise<OrganizationMemberProfile> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.')
  }

  const response = await fetch('/api/org-member-profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      organizationMemberId: params.organizationMemberId,
      ...params.input,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    profile?: OrganizationMemberProfile
  }

  if (!response.ok || !payload.profile) {
    throw new Error(payload.error ?? 'Could not save member profile.')
  }

  return payload.profile
}

export async function fetchOrganizationMemberQualificationsByUserIds(
  organizationId: string,
  userIds: string[]
): Promise<Map<string, string[]>> {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, string[]>()
  if (!isSupabaseConfigured || uniqueUserIds.length === 0) {
    return map
  }

  const supabase = getSupabaseClient()
  if (!supabase) return map

  const { data: memberRows, error: memberError } = await supabase
    .from('organization_members')
    .select('id, user_id')
    .eq('organization_id', organizationId)
    .in('user_id', uniqueUserIds)
    .neq('status', 'removed')

  if (memberError || !memberRows) {
    return map
  }

  const memberIdByUserId = new Map<string, string>()
  for (const row of memberRows) {
    if (typeof row.user_id === 'string' && typeof row.id === 'string') {
      memberIdByUserId.set(row.user_id, row.id)
    }
  }

  const memberIds = [...memberIdByUserId.values()]
  if (memberIds.length === 0) {
    return map
  }

  const { data: qualificationRows, error: qualificationError } = await supabase
    .from('organization_member_qualifications')
    .select('organization_member_id, label, sort_order')
    .in('organization_member_id', memberIds)
    .order('sort_order', { ascending: true })

  if (qualificationError || !qualificationRows) {
    return map
  }

  const qualificationsByMemberId = new Map<string, string[]>()
  for (const row of qualificationRows) {
    if (typeof row.organization_member_id !== 'string') continue
    const label = typeof row.label === 'string' ? row.label.trim() : ''
    if (!label) continue
    const existing = qualificationsByMemberId.get(row.organization_member_id) ?? []
    existing.push(label)
    qualificationsByMemberId.set(row.organization_member_id, existing)
  }

  for (const [userId, memberId] of memberIdByUserId) {
    map.set(userId, qualificationsByMemberId.get(memberId) ?? [])
  }

  return map
}

export function enrichWorkspaceRosterWithQualifications(
  roster: import('@/lib/workspace-types').WorkspaceRosterMember[],
  qualificationsByUserId: Map<string, string[]>
): import('@/lib/workspace-types').WorkspaceRosterMember[] {
  return roster.map((member) => ({
    ...member,
    qualifications:
      member.userId && qualificationsByUserId.has(member.userId)
        ? qualificationsByUserId.get(member.userId) ?? []
        : member.qualifications,
  }))
}
