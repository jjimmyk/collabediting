import { describe, expect, it } from 'vitest'
import {
  buildActivationNotificationBody,
  formatInitialReportForActivationNotification,
  resolveActivationNotificationRecipientEmails,
  resolveCustomMessageDeliveries,
  resolveMembersForPosition,
} from '@/features/activation/activation-notification-delivery'
import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'

const draft: BuildTeamRosterDraft = {
  templateId: 'unified-command',
  visibleStandardPositions: ['Incident Commander', 'Operations Section Chief'],
  customPositions: [{ id: 'custom-1', name: 'Liaison Officer' }],
  draftMembers: [
    {
      id: 'member-1',
      email: 'Ops@Example.com',
      icsPositions: ['Operations Section Chief'],
      orgChartReportsTo: 'Incident Commander',
      assignmentKind: 'ics_position',
      isCreator: false,
    },
    {
      id: 'member-2',
      email: 'ic@example.com',
      icsPositions: ['Incident Commander'],
      orgChartReportsTo: null,
      assignmentKind: 'ics_position',
      isCreator: true,
    },
    {
      id: 'member-3',
      email: 'IC@example.com',
      icsPositions: ['Incident Commander'],
      orgChartReportsTo: null,
      assignmentKind: 'ics_position',
      isCreator: false,
    },
  ],
}

const sampleReport = {
  shortDescription: 'Pipeline release near staging area',
  reportDate: '2026-06-28',
  reportTime: '09:15',
  callerName: 'Field Supervisor',
  callbackNumber: '555-0100',
  callType: 'incident',
  whatHappened: 'Visible sheen reported during transfer operations.',
  icNotifiedName: 'Jane Doe',
  rpName: 'Acme Energy',
  materialReleased: 'Crude oil',
}

describe('activation notification delivery', () => {
  it('formats initial report into notification body', () => {
    const formatted = formatInitialReportForActivationNotification(sampleReport)

    expect(formatted).toContain('Summary: Pipeline release near staging area')
    expect(formatted).toContain('What happened: Visible sheen reported during transfer operations.')
    expect(formatted).toContain('IC notified: Jane Doe')
  })

  it('builds activation notification body with optional report block', () => {
    const body = buildActivationNotificationBody({
      baseSummary: 'East Grid workspace is being activated.',
      includeInitialReport: true,
      initialReport: sampleReport,
      customMessage: 'Please join the command briefing.',
    })

    expect(body).toContain('East Grid workspace is being activated.')
    expect(body).toContain('Please join the command briefing.')
    expect(body).toContain('Initial report')
  })

  it('resolves member targets to emails', () => {
    const deliveries = resolveCustomMessageDeliveries(draft, [
      {
        id: 1,
        target: {
          kind: 'member',
          memberId: 'member-1',
          email: 'ops@example.com',
          label: 'ops@example.com',
        },
        message: 'Report to staging.',
      },
    ])

    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]?.recipientEmails).toEqual(['ops@example.com'])
  })

  it('expands position targets to assigned draft members', () => {
    const emails = resolveMembersForPosition(draft, 'Incident Commander')

    expect(emails.sort()).toEqual(['ic@example.com'])
  })

  it('deduplicates recipient emails for base send and position expansion', () => {
    const baseRecipients = resolveActivationNotificationRecipientEmails(draft)
    expect(baseRecipients.sort()).toEqual(['ic@example.com', 'ops@example.com'])

    const positionDeliveries = resolveCustomMessageDeliveries(draft, [
      {
        id: 2,
        target: { kind: 'position', positionName: 'Incident Commander' },
        message: 'Assume command.',
      },
    ])

    expect(positionDeliveries[0]?.recipientEmails).toEqual(['ic@example.com'])
  })
})
