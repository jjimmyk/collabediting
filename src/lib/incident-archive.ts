export function isIncidentArchived(incident: { archivedAt?: string | null }): boolean {
  return incident.archivedAt != null && incident.archivedAt.length > 0
}
