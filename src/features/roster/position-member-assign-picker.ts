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

export function dedupeOrgSearchResultsAgainstDraftMembers(
  orgResults: OrgMemberSearchResult[],
  draftMembers: Array<{
    email: string
    existingUserId: string | null
    icsPositions: string[]
    assignmentKind: 'ics_position' | 'single_resource'
  }>,
  position?: string
): OrgMemberSearchResult[] {
  const draftEmails = new Set(draftMembers.map((member) => member.email.toLowerCase()))
  const draftUserIds = new Set(
    draftMembers
      .map((member) => member.existingUserId)
      .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
  )

  const positionUserIds = position
    ? new Set(
        draftMembers
          .filter(
            (member) =>
              member.assignmentKind === 'ics_position' && member.icsPositions.includes(position)
          )
          .map((member) => member.existingUserId)
          .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
      )
    : null

  return orgResults.filter((result) => {
    if (draftEmails.has(result.email.toLowerCase())) {
      return false
    }
    if (result.id && draftUserIds.has(result.id)) {
      return false
    }
    if (position && result.id && positionUserIds?.has(result.id)) {
      return false
    }
    return true
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
      !rosterEmails.has(result.email.toLowerCase()) &&
      !(result.id && rosterUserIds.has(result.id))
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

export type OrgMemberPickerMode = 'add_to_roster' | 'assign_to_position' | 'pre_workspace'

export function isSelectableOrgMember(
  result: {
    id: string | null
    canAdd?: boolean
    alreadyOnRoster?: boolean
  },
  mode: OrgMemberPickerMode = 'add_to_roster'
): boolean {
  if (!result.id) {
    return false
  }
  if (mode === 'pre_workspace') {
    return result.canAdd !== false
  }
  if (mode === 'assign_to_position') {
    return result.canAdd !== false
  }
  return result.canAdd !== false && result.alreadyOnRoster !== true
}

export function orgMemberStatusLabel(
  result: {
    id: string | null
    alreadyOnRoster?: boolean
    canAdd?: boolean
  },
  mode: OrgMemberPickerMode = 'add_to_roster',
  position?: string
): string | null {
  if (mode === 'pre_workspace') {
    if (!result.id) {
      return 'No sign-in account yet'
    }
    if (result.canAdd === false) {
      return 'Unavailable'
    }
    return null
  }

  if (mode === 'assign_to_position') {
    if (result.canAdd === false) {
      return position ? `Already assigned to ${position}` : 'Already assigned here'
    }
    if (!result.id) {
      return 'No sign-in account yet'
    }
    return null
  }

  if (result.alreadyOnRoster) {
    return 'Already on roster'
  }
  if (!result.id) {
    return 'No sign-in account yet'
  }
  if (result.canAdd === false) {
    return 'Unavailable'
  }
  return null
}
