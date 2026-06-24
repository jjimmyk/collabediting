export const OPERATIONS_SECTION_CHIEF_POSITION = 'Operations Section Chief' as const
export const INCIDENT_COMMANDER_POSITION = 'Incident Commander' as const

/** Canonical standard-position reports-to map (matches migration 073). */
const STANDARD_POSITION_REPORTS_TO: Record<string, string | null> = {
  'Incident Commander': null,
  'Public Information Officer': 'Incident Commander',
  'Safety Officer': 'Incident Commander',
  'Liaison Officer': 'Incident Commander',
  'Legal Officer': 'Incident Commander',
  'Operations Section Chief': 'Incident Commander',
  'Staging Area Manager': 'Operations Section Chief',
  'Planning Section Chief': 'Incident Commander',
  'Resources Unit Leader': 'Planning Section Chief',
  'Situation Unit Leader': 'Planning Section Chief',
  'Documentation Unit Leader': 'Planning Section Chief',
  'Demobilization Unit Leader': 'Planning Section Chief',
  'Technical Specialist': 'Planning Section Chief',
  'Logistics Section Chief': 'Incident Commander',
  'Service Branch Director': 'Logistics Section Chief',
  'Support Branch Director': 'Logistics Section Chief',
  'Communications Unit Leader': 'Service Branch Director',
  'Food Unit Leader': 'Service Branch Director',
  'Medical Unit Leader': 'Service Branch Director',
  'Facilities Unit Leader': 'Support Branch Director',
  'Ground Support Unit Leader': 'Support Branch Director',
  'Supply Unit Leader': 'Support Branch Director',
  'Vessel Support Unit Leader': 'Support Branch Director',
  'Finance Section Chief': 'Incident Commander',
  'Finance/Admin Section Chief': 'Incident Commander',
  'Compensation Unit Leader': 'Finance Section Chief',
  'Cost Unit Leader': 'Finance Section Chief',
  'Procurement Unit Leader': 'Finance Section Chief',
  'Time Unit Leader': 'Finance Section Chief',
  'Intel/Investigations Section Chief': 'Incident Commander',
  'Intelligence Group Supervisor': 'Intel/Investigations Section Chief',
  'Investigative Operations Group Supervisor': 'Intel/Investigations Section Chief',
  'Display Unit Leader': 'Planning Section Chief',
  'Agency Representative': 'Incident Commander',
}

function normalizePositionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

function standardPositionReportsTo(positionName: string): string | null {
  return STANDARD_POSITION_REPORTS_TO[normalizePositionName(positionName)] ?? null
}

/** API-safe default for allow-work-assignment without importing frontend modules. */
export function defaultAllowWorkAssignmentForApi(
  positionName: string,
  options: { reportsTo?: string | null } = {}
): boolean {
  const normalized = normalizePositionName(positionName)
  if (normalized === OPERATIONS_SECTION_CHIEF_POSITION) {
    return true
  }

  let current: string | null =
    options.reportsTo?.trim() || standardPositionReportsTo(normalized) || null
  const visited = new Set<string>()

  while (current && !visited.has(current)) {
    if (current === OPERATIONS_SECTION_CHIEF_POSITION) {
      return true
    }
    if (current === INCIDENT_COMMANDER_POSITION) {
      return false
    }
    visited.add(current)
    current = standardPositionReportsTo(current)
  }

  return false
}
