import {
  buildMselInjectNotificationFromInject,
  countDeliveriesByInjectId,
  groupDeliveriesByInject,
  mapDeliveryRow,
} from '../src/features/exercise-msel/delivery-utils.ts'
import type { MselInjectDelivery } from '../src/features/exercise-msel/types.ts'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const inject = {
  id: 1,
  objectiveId: 1,
  scheduledTime: '2026-06-22T09:00',
  category: 'Operations',
  inject: 'Regional comms failure',
  expectedAction: 'Switch to backup net',
  mapLocation: [-97.7431, 30.2672] as [number, number],
}

const notification = buildMselInjectNotificationFromInject(
  inject,
  [{ id: 1, name: 'Command coordination' }],
  'Tabletop Exercise'
)

assert(notification.title.includes('Regional comms failure'), 'notification title includes inject text')
assert(notification.summary.includes('Command coordination'), 'notification summary includes objective')

const delivery = mapDeliveryRow({
  id: 'delivery-1',
  workspace_id: 'ws-1',
  inject_id: 1,
  recipient_email: 'ops@example.com',
  title: notification.title,
  summary: notification.summary,
  severity: 'Medium',
  inject_snapshot: notification.snapshot,
  sent_by_email: 'facilitator@example.com',
  hub_notification_id: null,
  created_at: '2026-06-22T09:05:00.000Z',
})

assert(delivery.recipientEmail === 'ops@example.com', 'delivery recipient email is normalized')

const duplicateDelivery: MselInjectDelivery = {
  ...delivery,
  id: 'delivery-2',
  recipientEmail: 'ops@example.com',
  createdAt: '2026-06-22T10:05:00.000Z',
}

const groups = groupDeliveriesByInject([delivery, duplicateDelivery])
assert(groups.length === 1, 'duplicate sends group under one inject')
assert(groups[0]?.deliveries.length === 2, 'duplicate sends are preserved')

const counts = countDeliveriesByInjectId([delivery, duplicateDelivery])
assert(counts[1] === 2, 'delivery counts include duplicate sends')

console.log('verify-exercise-msel-deliveries: ok')
