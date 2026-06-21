export const ICS_POSITIONS = [
  'Incident Commander',
  'Public Information Officer',
  'Safety Officer',
  'Liaison Officer',
  'Legal Officer',
  'Operations Section Chief',
  'Staging Area Manager',
  'Planning Section Chief',
  'Resources Unit Leader',
  'Situation Unit Leader',
  'Documentation Unit Leader',
  'Demobilization Unit Leader',
  'Technical Specialist',
  'Logistics Section Chief',
  'Service Branch Director',
  'Support Branch Director',
  'Communications Unit Leader',
  'Food Unit Leader',
  'Medical Unit Leader',
  'Facilities Unit Leader',
  'Ground Support Unit Leader',
  'Supply Unit Leader',
  'Vessel Support Unit Leader',
  'Finance Section Chief',
  'Compensation Unit Leader',
  'Cost Unit Leader',
  'Procurement Unit Leader',
  'Time Unit Leader',
  'Intel/Investigations Section Chief',
  'Intelligence Group Supervisor',
  'Investigative Operations Group Supervisor',
] as const

export type IcsPosition = (typeof ICS_POSITIONS)[number]

/** Standard positions shipped with the product (org chart + roster baseline). */
export const STANDARD_ICS_POSITIONS: readonly IcsPosition[] = ICS_POSITIONS

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
