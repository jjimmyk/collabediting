import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export const DEFAULT_WORKSPACE_ROSTER_EMAILS = [
  'jimmy.king@disastertech.com',
  'jamespking47@gmail.com',
] as const

export const DEFAULT_WORKSPACE_ROSTER_POSITION = 'Incident Commander'

const DEFAULT_INCIDENT_WORKSPACE_IDS = [1, 2, 3] as const
const DEFAULT_EXERCISE_WORKSPACE_IDS = [1, 2, 3] as const

function formatNow(): string {
  return new Date().toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function createDefaultRosterMember(email: string): WorkspaceRosterMember {
  return {
    id: `default-${email}`,
    email: email.toLowerCase(),
    icsPosition: DEFAULT_WORKSPACE_ROSTER_POSITION,
    status: 'active',
    addedAt: formatNow(),
    userId: null,
  }
}

export function buildDefaultLocalWorkspaceRosters(): Record<string, WorkspaceRosterMember[]> {
  const rosters: Record<string, WorkspaceRosterMember[]> = {}

  for (const id of DEFAULT_INCIDENT_WORKSPACE_IDS) {
    rosters[`incident-${id}`] = DEFAULT_WORKSPACE_ROSTER_EMAILS.map((email) => ({
      ...createDefaultRosterMember(email),
      id: `default-${email}-incident-${id}`,
    }))
  }

  for (const id of DEFAULT_EXERCISE_WORKSPACE_IDS) {
    rosters[`exercise-${id}`] = DEFAULT_WORKSPACE_ROSTER_EMAILS.map((email) => ({
      ...createDefaultRosterMember(email),
      id: `default-${email}-exercise-${id}`,
    }))
  }

  return rosters
}

export function isDefaultRosterEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return DEFAULT_WORKSPACE_ROSTER_EMAILS.some((entry) => entry === normalized)
}
