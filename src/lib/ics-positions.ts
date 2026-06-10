export const ICS_POSITIONS = [
  'Incident Commander',
  'Public Information Officer',
  'Safety Officer',
  'Liaison Officer',
  'Operations Section Chief',
  'Planning Section Chief',
  'Logistics Section Chief',
  'Finance/Admin Section Chief',
  'Situation Unit Leader',
  'Resources Unit Leader',
  'Documentation Unit Leader',
  'Display Unit Leader',
  'Demobilization Unit Leader',
] as const

export type IcsPosition = (typeof ICS_POSITIONS)[number]

/** Positions shown in workspace roster grid and org chart (same set). */
export const WORKSPACE_ROSTER_POSITIONS: readonly IcsPosition[] = ICS_POSITIONS

export const WORKSPACE_PERMISSION_EDIT_ICS201 = 'edit_ics201' as const

export type WorkspacePermission = typeof WORKSPACE_PERMISSION_EDIT_ICS201

export const ROSTER_MANAGER_POSITIONS: readonly IcsPosition[] = [
  'Incident Commander',
  'Planning Section Chief',
  'Operations Section Chief',
]

export function normalizeIcsPositions(positions: string[]): string[] {
  const allowed = new Set<string>(ICS_POSITIONS)
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const position of positions) {
    const trimmed = position.trim()
    if (!allowed.has(trimmed) || seen.has(trimmed)) continue
    seen.add(trimmed)
    normalized.push(trimmed)
  }
  return normalized
}

export function primaryIcsPosition(positions: string[]): string {
  return positions[0] ?? 'Incident Commander'
}

export function memberHasEditIcs201Permission(positions: string[]): boolean {
  return positions.length > 0
}
