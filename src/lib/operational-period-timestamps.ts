import type { OperationalPeriodFormKey } from '@/lib/operational-period-form-registry'

export const DEFAULT_OPERATIONAL_PERIOD_DURATION_MS = 12 * 60 * 60 * 1000

export type OperationalPeriodWindow = {
  from: Date
  to: Date
}

export function computeOperationalPeriodWindows(
  startedAt: Date,
  durationMs = DEFAULT_OPERATIONAL_PERIOD_DURATION_MS
): {
  frozen: OperationalPeriodWindow
  working: OperationalPeriodWindow
} {
  const frozenFrom = startedAt
  const frozenTo = new Date(startedAt.getTime() + durationMs)
  const workingFrom = frozenTo
  const workingTo = new Date(startedAt.getTime() + durationMs * 2)

  return {
    frozen: { from: frozenFrom, to: frozenTo },
    working: { from: workingFrom, to: workingTo },
  }
}

export function formatOperationalPeriodDatetimeLocal(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export function formatOperationalPeriodDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function formatOperationalPeriodTime(value: Date): string {
  return value.toTimeString().slice(0, 5)
}

export function applyOperationalPeriodTimestampsToSnapshot(
  snapshot: unknown,
  formKey: OperationalPeriodFormKey,
  window: OperationalPeriodWindow
): unknown {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return snapshot
  }

  const data = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>

  switch (formKey) {
    case 'ics201':
      data.operationalPeriodStart = formatOperationalPeriodDatetimeLocal(window.from)
      data.operationalPeriodEnd = formatOperationalPeriodDatetimeLocal(window.to)
      break
    case 'iap':
    case 'ics202':
    case 'ics203':
    case 'ics234':
      data.operationalPeriodFrom = formatOperationalPeriodDatetimeLocal(window.from)
      data.operationalPeriodTo = formatOperationalPeriodDatetimeLocal(window.to)
      break
    case 'ics214':
      data.operationalPeriodFrom = formatOperationalPeriodDatetimeLocal(window.from)
      data.operationalPeriodTo = formatOperationalPeriodDatetimeLocal(window.to)
      data.dateOfActivity = formatOperationalPeriodDate(window.from)
      break
    case 'ics215':
    case 'ics215a':
    case 'ics205':
    case 'ics205a':
    case 'ics206':
    case 'ics208':
    case 'ics208hm':
    case 'ics209':
      data.operationalPeriodDateFrom = formatOperationalPeriodDate(window.from)
      data.operationalPeriodDateTo = formatOperationalPeriodDate(window.to)
      data.operationalPeriodTimeFrom = formatOperationalPeriodTime(window.from)
      data.operationalPeriodTimeTo = formatOperationalPeriodTime(window.to)
      break
    default:
      break
  }

  return data
}
