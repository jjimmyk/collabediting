import type { SupabaseClient } from '@supabase/supabase-js'

export async function getWorkspaceOrganizationId(
  admin: SupabaseClient,
  workspaceId: string
): Promise<string> {
  const { data, error } = await admin
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!data?.organization_id) {
    throw new Error('Workspace organization not found.')
  }
  return data.organization_id
}

export async function userIsPlatformOrgAdmin(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from('profiles')
    .select('is_org_admin')
    .eq('id', userId)
    .maybeSingle()

  return data?.is_org_admin === true
}

export async function userIsOrgAdminForOrganization(
  admin: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  if (await userIsPlatformOrgAdmin(admin, userId)) {
    return true
  }

  const { data } = await admin
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .maybeSingle()

  return Boolean(data)
}

export async function userBelongsToOrganization(
  admin: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data } = await admin
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return Boolean(data)
}

export async function assertUserInWorkspaceOrganization(
  admin: SupabaseClient,
  workspaceId: string,
  targetUserId: string
): Promise<void> {
  const organizationId = await getWorkspaceOrganizationId(admin, workspaceId)

  const belongs = await userBelongsToOrganization(admin, targetUserId, organizationId)
  if (!belongs) {
    throw new Error('That person is not an active member of this workspace organization.')
  }
}

export async function ensureOrganizationMembership(
  admin: SupabaseClient,
  params: {
    organizationId: string
    email: string
    userId?: string | null
    role?: 'admin' | 'member'
    status?: 'invited' | 'active'
    invitedBy?: string | null
    joinedAt?: string | null
  }
): Promise<void> {
  const email = params.email.trim().toLowerCase()
  const { error } = await admin.from('organization_members').upsert(
    {
      organization_id: params.organizationId,
      email,
      user_id: params.userId ?? null,
      role: params.role ?? 'member',
      status: params.status ?? 'active',
      invited_by: params.invitedBy ?? null,
      joined_at:
        params.status === 'active'
          ? params.joinedAt ?? new Date().toISOString()
          : params.joinedAt ?? null,
    },
    { onConflict: 'organization_id,email' }
  )

  if (error) {
    throw new Error(error.message)
  }
}
