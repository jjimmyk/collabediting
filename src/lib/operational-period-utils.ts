export function getWorkingOperationalPeriodNumber(startedCount: number): number {
  return Math.max(1, startedCount + 1)
}

export function getLatestStartedOperationalPeriodNumber(
  startedCount: number
): number | null {
  return startedCount > 0 ? startedCount : null
}

export function formatOperationalPeriodLabel(periodNumber: number): string {
  return `Operational Period ${periodNumber}`
}

export function formatWorkingOperationalPeriodLabel(periodNumber: number): string {
  return `Working OP ${periodNumber}`
}

export function formatOperationalPeriodStarterLabel(period: {
  startedByName?: string | null
  startedByEmail?: string | null
}): string {
  if (period.startedByName?.trim()) return period.startedByName.trim()
  if (period.startedByEmail?.trim()) return period.startedByEmail.trim()
  return 'Unknown user'
}
