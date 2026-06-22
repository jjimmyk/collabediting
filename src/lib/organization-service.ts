import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'
import {
  ACTIVE_ORGANIZATION_STORAGE_KEY,
  USCG_ORGANIZATION_ID,
  USCG_ORGANIZATION_NAME,
  USCG_ORGANIZATION_SLUG,
} from '@/lib/organization-constants'
import type {
  CreatedOrganization,
  OrganizationMemberRecord,
  UserOrganization,
} from '@/lib/organization-types'

export function readStoredActiveOrganizationId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(ACTIVE_ORGANIZATION_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredActiveOrganizationId(organizationId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACTIVE_ORGANIZATION_STORAGE_KEY, organizationId)
  } catch {
    /* ignore inaccessible localStorage */
  }
}

export function resolveActiveOrganizationId(
  organizations: UserOrganization[],
  storedOrganizationId: string | null
): string | null {
  if (organizations.length === 0) {
    if (!storedOrganizationId || storedOrganizationId === USCG_ORGANIZATION_ID) {
      return USCG_ORGANIZATION_ID
    }
    return storedOrganizationId
  }

  if (
    storedOrganizationId &&
    organizations.some((org) => org.organizationId === storedOrganizationId)
  ) {
    return storedOrganizationId
  }

  const uscg = organizations.find((org) => org.organizationId === USCG_ORGANIZATION_ID)
  return uscg?.organizationId ?? organizations[0]?.organizationId ?? null
}

export function resolveDisplayOrganization(
  organizations: UserOrganization[],
  activeOrganizationId: string | null
): UserOrganization | null {
  const match = organizations.find((org) => org.organizationId === activeOrganizationId)
  if (match) {
    return match
  }

  if (activeOrganizationId === USCG_ORGANIZATION_ID) {
    return {
      organizationId: USCG_ORGANIZATION_ID,
      name: USCG_ORGANIZATION_NAME,
      slug: USCG_ORGANIZATION_SLUG,
      role: 'member',
      status: 'active',
    }
  }

  return organizations[0] ?? null
}

export async function fetchUserOrganizations(userId: string): Promise<UserOrganization[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      status,
      organization:organizations (
        id,
        name,
        slug
      )
    `
    )
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error || !data) {
    if (error) {
      console.error('fetchUserOrganizations failed', error.message)
    }
    return []
  }

  return data
    .map((row) => {
      const organizationRaw = row.organization as
        | { id: string; name: string; slug: string }
        | { id: string; name: string; slug: string }[]
        | null
      const organization = Array.isArray(organizationRaw) ? organizationRaw[0] : organizationRaw
      if (!organization) return null
      return {
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: row.role as UserOrganization['role'],
        status: row.status as UserOrganization['status'],
      }
    })
    .filter((entry): entry is UserOrganization => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchOrganizationMembers(
  organizationId: string
): Promise<OrganizationMemberRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('organization_members')
    .select('id, user_id, email, role, status, joined_at')
    .eq('organization_id', organizationId)
    .neq('status', 'removed')
    .order('email')

  if (error || !data) {
    if (error) {
      console.error('fetchOrganizationMembers failed', error.message)
    }
    return []
  }

  const userIds = data
    .map((row) => row.user_id)
    .filter((value): value is string => typeof value === 'string')

  const profilesById = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile.full_name ?? null)
    }
  }

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id ?? null,
    email: row.email,
    fullName: row.user_id ? profilesById.get(row.user_id) ?? null : null,
    role: row.role as OrganizationMemberRecord['role'],
    status: row.status as OrganizationMemberRecord['status'],
    joinedAt: row.joined_at ?? null,
  }))
}

export async function createOrganization(params: {
  accessToken: string
  name: string
  slug?: string
}): Promise<{ ok: true; organization: CreatedOrganization } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/create-organization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      name: params.name,
      slug: params.slug,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    organization?: CreatedOrganization
  }

  if (!response.ok || !payload.organization) {
    return { ok: false, message: payload.error ?? 'Could not create organization.' }
  }

  return { ok: true, organization: payload.organization }
}

export async function assignOrgMemberToPosition(params: {
  accessToken: string
  workspaceId: string
  userId: string
  icsPosition: string
  scheduleOnOpAdvance?: boolean
}): Promise<{ ok: true; memberId: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/assign-org-member-to-position', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      userId: params.userId,
      icsPosition: params.icsPosition,
      ...(params.scheduleOnOpAdvance ? { scheduleOnOpAdvance: true } : {}),
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    memberId?: string
  }

  if (!response.ok || !payload.memberId) {
    return { ok: false, message: payload.error ?? 'Could not assign organization member.' }
  }

  return { ok: true, memberId: payload.memberId }
}

export async function inviteOrganizationMember(params: {
  accessToken: string
  organizationId: string
  email: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch('/api/invite-organization-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      organizationId: params.organizationId,
      email: params.email,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    return { ok: false, message: payload.error ?? 'Could not invite organization member.' }
  }

  return { ok: true }
}
