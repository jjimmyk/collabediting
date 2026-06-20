import type { SupabaseClient } from '@supabase/supabase-js'
import { addMemberScheduleAssignOnOpAdvance } from './roster-member-schedules-shared.js'
import { upsertPendingSingleResourceAssignment } from './roster-pending-assignments-shared.js'
import {
  ensureAuthUser,
  MIN_AUTH_PASSWORD_LENGTH,
  resolveInviteActivePositions,
  upsertMemberProfile,
  upsertWorkspaceMemberAsDeferredSingleResource,
  upsertWorkspaceMemberAsSingleResource,
  upsertWorkspaceMemberWithPositions,
  type MemberAssignmentKind,
} from './roster-shared.js'

export async function addIcsWorkspaceMemberWithEffectiveWhen(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    icsPositions: string[]
    scheduleOnOpAdvance: boolean
    status: 'invited' | 'active'
    userId?: string | null
    invitedBy: string
    joinedAt?: string | null
  }
): Promise<{ memberId: string; scheduleTargetPosition: string | null }> {
  const { activePositions, scheduleTargetPosition } = await resolveInviteActivePositions(
    admin,
    params.workspaceId,
    params.icsPositions,
    params.scheduleOnOpAdvance
  )

  const member = await upsertWorkspaceMemberWithPositions(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    icsPositions: activePositions,
    status: params.status,
    userId: params.userId ?? null,
    invitedBy: params.invitedBy,
    joinedAt: params.joinedAt ?? null,
  })

  if (scheduleTargetPosition) {
    await addMemberScheduleAssignOnOpAdvance(admin, {
      workspaceId: params.workspaceId,
      positionName: scheduleTargetPosition,
      memberId: member.memberId,
      createdBy: params.invitedBy,
    })
  }

  return { memberId: member.memberId, scheduleTargetPosition }
}

export async function addSingleResourceWorkspaceMemberWithEffectiveWhen(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    orgChartReportsTo: string
    scheduleOnOpAdvance: boolean
    status: 'invited' | 'active'
    userId?: string | null
    invitedBy: string
    joinedAt?: string | null
  }
): Promise<{ memberId: string; scheduled: boolean }> {
  if (params.scheduleOnOpAdvance) {
    const member = await upsertWorkspaceMemberAsDeferredSingleResource(admin, {
      workspaceId: params.workspaceId,
      email: params.email,
      status: params.status,
      userId: params.userId ?? null,
      invitedBy: params.invitedBy,
      joinedAt: params.joinedAt ?? null,
    })

    await upsertPendingSingleResourceAssignment(admin, {
      workspaceId: params.workspaceId,
      memberId: member.memberId,
      orgChartReportsTo: params.orgChartReportsTo,
      createdBy: params.invitedBy,
    })

    return { memberId: member.memberId, scheduled: true }
  }

  const member = await upsertWorkspaceMemberAsSingleResource(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    orgChartReportsTo: params.orgChartReportsTo,
    status: params.status,
    userId: params.userId ?? null,
    invitedBy: params.invitedBy,
    joinedAt: params.joinedAt ?? null,
  })

  return { memberId: member.memberId, scheduled: false }
}

export async function provisionSingleResourceMemberWithEffectiveWhen(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    orgChartReportsTo: string
    password: string
    invitedBy: string
    confirmPasswordOverwrite: boolean
    scheduleOnOpAdvance: boolean
  }
): Promise<
  | { ok: true; action: 'created' | 'updated'; memberId: string; scheduled: boolean }
  | { ok: false; code: 'password_too_short' | 'user_exists' }
> {
  if (params.password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return { ok: false, code: 'password_too_short' }
  }

  const authResult = await ensureAuthUser(admin, params.email, params.password, {
    allowPasswordOverwrite: params.confirmPasswordOverwrite,
  })

  if (!authResult.ok) {
    return authResult
  }

  await upsertMemberProfile(admin, authResult.userId, params.email)

  const member = await addSingleResourceWorkspaceMemberWithEffectiveWhen(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    orgChartReportsTo: params.orgChartReportsTo,
    scheduleOnOpAdvance: params.scheduleOnOpAdvance,
    status: 'active',
    userId: authResult.userId,
    invitedBy: params.invitedBy,
    joinedAt: new Date().toISOString(),
  })

  return {
    ok: true,
    action: authResult.action,
    memberId: member.memberId,
    scheduled: member.scheduled,
  }
}

export async function provisionIcsWorkspaceMemberWithEffectiveWhen(
  admin: SupabaseClient,
  params: {
    workspaceId: string
    email: string
    icsPositions: string[]
    password: string
    invitedBy: string
    confirmPasswordOverwrite: boolean
    scheduleOnOpAdvance: boolean
  }
): Promise<
  | { ok: true; action: 'created' | 'updated'; memberId: string; scheduleOnOpAdvance: boolean }
  | { ok: false; code: 'password_too_short' | 'user_exists' }
> {
  if (params.password.length < MIN_AUTH_PASSWORD_LENGTH) {
    return { ok: false, code: 'password_too_short' }
  }

  const authResult = await ensureAuthUser(admin, params.email, params.password, {
    allowPasswordOverwrite: params.confirmPasswordOverwrite,
  })

  if (!authResult.ok) {
    return authResult
  }

  await upsertMemberProfile(admin, authResult.userId, params.email)

  const member = await addIcsWorkspaceMemberWithEffectiveWhen(admin, {
    workspaceId: params.workspaceId,
    email: params.email,
    icsPositions: params.icsPositions,
    scheduleOnOpAdvance: params.scheduleOnOpAdvance,
    status: 'active',
    userId: authResult.userId,
    invitedBy: params.invitedBy,
    joinedAt: new Date().toISOString(),
  })

  return {
    ok: true,
    action: authResult.action,
    memberId: member.memberId,
    scheduleOnOpAdvance: Boolean(member.scheduleTargetPosition),
  }
}

export type { MemberAssignmentKind }
