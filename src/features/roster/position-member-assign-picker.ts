import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export function filterMembersBySearchQuery<T extends { email: string }>(
  members: T[],
  query: string,
  getFullName?: (member: T) => string | null | undefined
): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return members
  }

  return members.filter((member) => {
    const haystack = `${member.email} ${getFullName?.(member) ?? ''}`.toLowerCase()
    return haystack.includes(normalized)
  })
}

export function dedupeOrgSearchResultsAgainstRoster(
  orgResults: OrgMemberSearchResult[],
  rosterMembers: Array<Pick<WorkspaceRosterMember, 'email' | 'userId'>>
): OrgMemberSearchResult[] {
  const rosterEmails = new Set(rosterMembers.map((member) => member.email.toLowerCase()))
  const rosterUserIds = new Set(
    rosterMembers
      .map((member) => member.userId)
      .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
  )

  return orgResults.filter(
    (result) =>
      !rosterEmails.has(result.email.toLowerCase()) && !rosterUserIds.has(result.id)
  )
}

export function formatMemberPositionSummary(positions: string[]): string | null {
  if (positions.length === 0) {
    return null
  }
  if (positions.length === 1) {
    return positions[0] ?? null
  }
  return positions.join(', ')
}
