import { describe, expect, it } from 'vitest'
import {
  buildMselInjectNotificationContent,
  buildMselInjectNotificationFromInject,
  buildMselInjectSnapshot,
  countDeliveriesByInjectId,
  filterDeliveriesForRecipient,
  groupDeliveriesByInject,
  mapDeliveryRow,
} from '@/features/exercise-msel/delivery-utils'
import type { MselInjectDelivery } from '@/features/exercise-msel/types'

const baseInject = {
  id: 7,
  objectiveId: 2,
  scheduledTime: '2026-06-22T09:00',
  category: 'Operations',
  inject: 'Bridge closure reported',
  expectedAction: 'Activate detour plan',
  mapLocation: [-97.74, 30.27] as [number, number],
}

describe('exercise-msel delivery utils', () => {
  it('maps delivery rows from snake_case and camelCase', () => {
    const delivery = mapDeliveryRow({
      id: 'abc-123',
      workspace_id: 'ws-1',
      inject_id: 7,
      recipient_email: 'Ops@Example.com',
      title: 'Bridge closure reported',
      summary: 'Scheduled: 09:00',
      severity: 'High',
      inject_snapshot: baseInject,
      sent_by_email: 'facilitator@example.com',
      hub_notification_id: 'note-1',
      created_at: '2026-06-22T09:05:00.000Z',
    })

    expect(delivery.recipientEmail).toBe('ops@example.com')
    expect(delivery.injectId).toBe(7)
    expect(delivery.injectSnapshot.inject).toBe('Bridge closure reported')
  })

  it('builds notification content from inject snapshot', () => {
    const snapshot = buildMselInjectSnapshot(baseInject)
    const content = buildMselInjectNotificationContent({
      inject: snapshot,
      objectiveLabel: 'Unified command',
      workspaceName: 'Regional Tabletop',
    })

    expect(content.title).toBe('Bridge closure reported')
    expect(content.summary).toContain('Exercise: Regional Tabletop')
    expect(content.summary).toContain('Unified command')
  })

  it('builds notification bundle from live inject state', () => {
    const bundle = buildMselInjectNotificationFromInject(
      baseInject,
      [{ id: 2, name: 'Unified command' }],
      'Regional Tabletop'
    )

    expect(bundle.snapshot.mapLocation).toEqual([-97.74, 30.27])
    expect(bundle.title).toBe('Bridge closure reported')
  })

  it('groups deliveries by inject and sorts newest first', () => {
    const deliveries: MselInjectDelivery[] = [
      {
        id: '1',
        workspaceId: 'ws-1',
        injectId: 7,
        recipientEmail: 'a@example.com',
        title: 'Bridge closure reported',
        summary: 'First send',
        severity: 'Medium',
        injectSnapshot: baseInject,
        sentByEmail: 'facilitator@example.com',
        hubNotificationId: null,
        createdAt: '2026-06-22T09:00:00.000Z',
      },
      {
        id: '2',
        workspaceId: 'ws-1',
        injectId: 7,
        recipientEmail: 'b@example.com',
        title: 'Bridge closure reported',
        summary: 'Second send',
        severity: 'Medium',
        injectSnapshot: baseInject,
        sentByEmail: 'facilitator@example.com',
        hubNotificationId: null,
        createdAt: '2026-06-22T10:00:00.000Z',
      },
      {
        id: '3',
        workspaceId: 'ws-1',
        injectId: 9,
        recipientEmail: 'a@example.com',
        title: 'Power outage',
        summary: 'Other inject',
        severity: 'Low',
        injectSnapshot: { ...baseInject, id: 9, inject: 'Power outage' },
        sentByEmail: 'facilitator@example.com',
        hubNotificationId: null,
        createdAt: '2026-06-22T11:00:00.000Z',
      },
    ]

    const groups = groupDeliveriesByInject(deliveries)
    expect(groups).toHaveLength(2)
    expect(groups[0]?.injectId).toBe(9)
    expect(groups.find((group) => group.injectId === 7)?.deliveries).toHaveLength(2)
    expect(groups.find((group) => group.injectId === 7)?.deliveries[0]?.recipientEmail).toBe(
      'b@example.com'
    )
  })

  it('filters deliveries for a recipient and counts by inject', () => {
    const deliveries: MselInjectDelivery[] = [
      {
        id: '1',
        workspaceId: 'ws-1',
        injectId: 7,
        recipientEmail: 'a@example.com',
        title: 'One',
        summary: 'One',
        severity: 'Medium',
        injectSnapshot: baseInject,
        sentByEmail: null,
        hubNotificationId: null,
        createdAt: '2026-06-22T09:00:00.000Z',
      },
      {
        id: '2',
        workspaceId: 'ws-1',
        injectId: 7,
        recipientEmail: 'b@example.com',
        title: 'Two',
        summary: 'Two',
        severity: 'Medium',
        injectSnapshot: baseInject,
        sentByEmail: null,
        hubNotificationId: null,
        createdAt: '2026-06-22T09:05:00.000Z',
      },
    ]

    expect(filterDeliveriesForRecipient(deliveries, 'A@Example.com')).toHaveLength(1)
    expect(countDeliveriesByInjectId(deliveries)).toEqual({ 7: 2 })
  })
})
