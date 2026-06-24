import type {
  MselInject,
  MselInjectDelivery,
  MselInjectDeliveryGroup,
  MselInjectSnapshot,
} from './types'
import { getExerciseObjectiveLabel } from './msel-utils'

export function buildMselInjectSnapshot(inject: MselInject): MselInjectSnapshot {
  return {
    id: inject.id,
    objectiveId: inject.objectiveId ?? null,
    scheduledTime: inject.scheduledTime ?? '',
    category: inject.category ?? 'Operations',
    inject: inject.inject ?? '',
    expectedAction: inject.expectedAction ?? '',
    mapLocation: inject.mapLocation ?? null,
  }
}

export function buildMselInjectNotificationContent(options: {
  inject: MselInjectSnapshot
  objectiveLabel: string
  workspaceName?: string | null
}): { title: string; summary: string } {
  const injectText = options.inject.inject.trim() || `Inject ${options.inject.id}`
  const title = injectText.length > 120 ? `${injectText.slice(0, 117)}...` : injectText

  const parts = [
    options.workspaceName ? `Exercise: ${options.workspaceName}` : null,
    options.inject.scheduledTime.trim()
      ? `Scheduled: ${options.inject.scheduledTime}`
      : 'Scheduled: Not set',
    `Category: ${options.inject.category.trim() || 'Operations'}`,
    `Objective: ${options.objectiveLabel}`,
    `Expected action: ${options.inject.expectedAction.trim() || 'Not specified'}`,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    title,
    summary: parts.join(' · '),
  }
}

export function buildMselInjectNotificationFromInject(
  inject: MselInject,
  objectives: Array<{ id: number; name: string }>,
  workspaceName?: string | null
): { title: string; summary: string; snapshot: MselInjectSnapshot; objectiveLabel: string } {
  const snapshot = buildMselInjectSnapshot(inject)
  const objectiveLabel = getExerciseObjectiveLabel(objectives, inject.objectiveId)
  const content = buildMselInjectNotificationContent({
    inject: snapshot,
    objectiveLabel,
    workspaceName,
  })
  return { ...content, snapshot, objectiveLabel }
}

export function mapDeliveryRow(row: Record<string, unknown>): MselInjectDelivery {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id ?? row.workspaceId),
    injectId: Number(row.inject_id ?? row.injectId),
    recipientEmail: String(row.recipient_email ?? row.recipientEmail).toLowerCase(),
    title: String(row.title),
    summary: String(row.summary),
    severity: String(row.severity ?? 'Medium'),
    injectSnapshot: (row.inject_snapshot ?? row.injectSnapshot) as MselInjectSnapshot,
    sentByEmail:
      row.sent_by_email != null
        ? String(row.sent_by_email)
        : row.sentByEmail != null
          ? String(row.sentByEmail)
          : null,
    hubNotificationId:
      row.hub_notification_id != null
        ? String(row.hub_notification_id)
        : row.hubNotificationId != null
          ? String(row.hubNotificationId)
          : null,
    createdAt: String(row.created_at ?? row.createdAt),
  }
}

export function filterDeliveriesForRecipient(
  deliveries: MselInjectDelivery[],
  recipientEmail?: string | null
): MselInjectDelivery[] {
  if (!recipientEmail?.trim()) {
    return deliveries
  }
  const normalized = recipientEmail.trim().toLowerCase()
  return deliveries.filter((delivery) => delivery.recipientEmail === normalized)
}

export function groupDeliveriesByInject(
  deliveries: MselInjectDelivery[]
): MselInjectDeliveryGroup[] {
  const byInjectId = new Map<number, MselInjectDelivery[]>()

  for (const delivery of deliveries) {
    const existing = byInjectId.get(delivery.injectId) ?? []
    existing.push(delivery)
    byInjectId.set(delivery.injectId, existing)
  }

  return [...byInjectId.entries()]
    .map(([injectId, injectDeliveries]) => {
      const sorted = [...injectDeliveries].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      return {
        injectId,
        injectSnapshot: sorted[0]?.injectSnapshot ?? {
          id: injectId,
          objectiveId: null,
          scheduledTime: '',
          category: '',
          inject: '',
          expectedAction: '',
          mapLocation: null,
        },
        deliveries: sorted,
      }
    })
    .sort((left, right) => {
      const leftTime = new Date(left.deliveries[0]?.createdAt ?? 0).getTime()
      const rightTime = new Date(right.deliveries[0]?.createdAt ?? 0).getTime()
      return rightTime - leftTime
    })
}

export function countDeliveriesByInjectId(
  deliveries: MselInjectDelivery[]
): Record<number, number> {
  const counts: Record<number, number> = {}
  for (const delivery of deliveries) {
    counts[delivery.injectId] = (counts[delivery.injectId] ?? 0) + 1
  }
  return counts
}

export function formatMselDeliveryTimestamp(createdAt: string): string {
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) {
    return createdAt
  }
  return parsed.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
