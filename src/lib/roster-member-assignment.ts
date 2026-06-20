import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export const SINGLE_RESOURCE_POSITION_LABEL = 'Single Resource' as const

export type MemberAssignmentKind = 'ics_position' | 'single_resource'

export type WorkspaceMemberPersonSource = 'invite_new' | 'add_existing'

export type RosterMemberEffectiveWhen = 'now' | 'next_op_advance'

export function mapEffectiveWhenToInviteMode(
  effectiveWhen: RosterMemberEffectiveWhen
): 'assign_now' | 'schedule_on_op_advance' {
  return effectiveWhen === 'next_op_advance' ? 'schedule_on_op_advance' : 'assign_now'
}

export function getSingleResourceRosterMembers(
  roster: WorkspaceRosterMember[]
): WorkspaceRosterMember[] {
  return roster
    .filter(
      (member) =>
        member.status !== 'removed' &&
        member.assignmentKind === 'single_resource' &&
        Boolean(member.orgChartReportsTo)
    )
    .sort((a, b) => a.email.localeCompare(b.email))
}

export function isSingleResourceRosterMember(member: WorkspaceRosterMember): boolean {
  return member.assignmentKind === 'single_resource'
}
