import type { SupabaseClient } from '@supabase/supabase-js'

export type OrganizationMemberProfileRecord = {
  organizationMemberId: string
  phone: string | null
  address: string | null
  defaultRadioContact: string | null
  homeAorNodeId: string | null
  qualifications: string[]
}

type DbOrganizationMemberProfileRow = {
  organization_member_id: string
  phone: string | null
  address: string | null
  default_radio_contact: string | null
  home_aor_node_id: string | null
}

type DbOrganizationMemberQualificationRow = {
  organization_member_id: string
  label: string
  sort_order: number
}

export function mapOrganizationMemberProfile(
  profileRow: DbOrganizationMemberProfileRow | null | undefined,
  qualificationRows: DbOrganizationMemberQualificationRow[]
): OrganizationMemberProfileRecord {
  const organizationMemberId =
    profileRow?.organization_member_id ?? qualificationRows[0]?.organization_member_id ?? ''

  return {
    organizationMemberId,
    phone: profileRow?.phone?.trim() || null,
    address: profileRow?.address?.trim() || null,
    defaultRadioContact: profileRow?.default_radio_contact?.trim() || null,
    homeAorNodeId: profileRow?.home_aor_node_id?.trim() || null,
    qualifications: qualificationRows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => row.label.trim())
      .filter(Boolean),
  }
}

export async function loadOrganizationMemberProfilesByMemberIds(
  admin: SupabaseClient,
  organizationMemberIds: string[]
): Promise<Map<string, OrganizationMemberProfileRecord>> {
  const uniqueIds = [...new Set(organizationMemberIds.filter(Boolean))]
  const map = new Map<string, OrganizationMemberProfileRecord>()
  if (uniqueIds.length === 0) return map

  const [{ data: profileRows, error: profileError }, { data: qualificationRows, error: qualificationError }] =
    await Promise.all([
      admin
        .from('organization_member_profiles')
        .select(
          'organization_member_id, phone, address, default_radio_contact, home_aor_node_id'
        )
        .in('organization_member_id', uniqueIds),
      admin
        .from('organization_member_qualifications')
        .select('organization_member_id, label, sort_order')
        .in('organization_member_id', uniqueIds)
        .order('sort_order', { ascending: true }),
    ])

  if (profileError) {
    throw new Error(profileError.message)
  }
  if (qualificationError) {
    throw new Error(qualificationError.message)
  }

  const profilesByMemberId = new Map<string, DbOrganizationMemberProfileRow>()
  for (const row of profileRows ?? []) {
    if (typeof row.organization_member_id === 'string') {
      profilesByMemberId.set(row.organization_member_id, row as DbOrganizationMemberProfileRow)
    }
  }

  const qualificationsByMemberId = new Map<string, DbOrganizationMemberQualificationRow[]>()
  for (const row of qualificationRows ?? []) {
    if (typeof row.organization_member_id !== 'string') continue
    const existing = qualificationsByMemberId.get(row.organization_member_id) ?? []
    existing.push(row as DbOrganizationMemberQualificationRow)
    qualificationsByMemberId.set(row.organization_member_id, existing)
  }

  for (const memberId of uniqueIds) {
    map.set(
      memberId,
      mapOrganizationMemberProfile(
        profilesByMemberId.get(memberId),
        qualificationsByMemberId.get(memberId) ?? []
      )
    )
  }

  return map
}

export async function loadOrganizationMemberQualificationsByUserIds(
  admin: SupabaseClient,
  organizationId: string,
  userIds: string[]
): Promise<Map<string, string[]>> {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, string[]>()
  if (uniqueUserIds.length === 0) return map

  const { data: memberRows, error: memberError } = await admin
    .from('organization_members')
    .select('id, user_id')
    .eq('organization_id', organizationId)
    .in('user_id', uniqueUserIds)
    .neq('status', 'removed')

  if (memberError) {
    throw new Error(memberError.message)
  }

  const memberIdByUserId = new Map<string, string>()
  for (const row of memberRows ?? []) {
    if (typeof row.user_id === 'string' && typeof row.id === 'string') {
      memberIdByUserId.set(row.user_id, row.id)
    }
  }

  const profiles = await loadOrganizationMemberProfilesByMemberIds(
    admin,
    [...memberIdByUserId.values()]
  )

  for (const [userId, memberId] of memberIdByUserId) {
    map.set(userId, profiles.get(memberId)?.qualifications ?? [])
  }

  return map
}

export async function saveOrganizationMemberProfile(
  admin: SupabaseClient,
  organizationMemberId: string,
  input: {
    phone?: string | null
    address?: string | null
    defaultRadioContact?: string | null
    homeAorNodeId?: string | null
    qualifications?: string[]
  }
): Promise<OrganizationMemberProfileRecord> {
  const phone = input.phone?.trim() || null
  const address = input.address?.trim() || null
  const defaultRadioContact = input.defaultRadioContact?.trim() || null
  const homeAorNodeId = input.homeAorNodeId?.trim() || null

  const { error: profileError } = await admin.from('organization_member_profiles').upsert(
    {
      organization_member_id: organizationMemberId,
      phone,
      address,
      default_radio_contact: defaultRadioContact,
      home_aor_node_id: homeAorNodeId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_member_id' }
  )

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (input.qualifications !== undefined) {
    const { error: deleteError } = await admin
      .from('organization_member_qualifications')
      .delete()
      .eq('organization_member_id', organizationMemberId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    const labels = input.qualifications
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)

    if (labels.length > 0) {
      const { error: insertError } = await admin.from('organization_member_qualifications').insert(
        labels.map((label, index) => ({
          organization_member_id: organizationMemberId,
          label,
          sort_order: index,
        }))
      )

      if (insertError) {
        throw new Error(insertError.message)
      }
    }
  }

  const profiles = await loadOrganizationMemberProfilesByMemberIds(admin, [organizationMemberId])
  const profile = profiles.get(organizationMemberId)
  if (!profile) {
    throw new Error('Profile could not be loaded after save.')
  }
  return profile
}
