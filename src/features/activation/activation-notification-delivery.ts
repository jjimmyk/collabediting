import type { BuildTeamRosterDraft } from '@/features/roster/roster-template-types'
import {
  formatActivationNotificationChannelLabel,
  type ActivationCustomMessageRow,
  type ActivationNotificationChannel,
  type ActivationNotificationSettings,
  type ActivationNotificationTarget,
} from '@/features/activation/activation-notification-types'

export type ActivationInitialReportInput = {
  shortDescription: string
  reportDate: string
  reportTime: string
  callerName: string
  callbackNumber: string
  callType: string
  whatHappened: string
  icNotifiedName: string
  rpName: string
  materialReleased: string
}

export type ActivationNotificationBaseMessageInput = {
  kind: 'incident' | 'exercise'
  name: string
  workflowLabel?: string | null
}

export type ActivationCustomMessageDelivery = {
  rowId: number
  recipientEmails: string[]
  message: string
}

export function buildActivationNotificationBaseMessage(
  input: ActivationNotificationBaseMessageInput
): { title: string; summary: string } {
  const entityLabel = input.kind === 'incident' ? 'Incident' : 'Exercise'
  const title = `${entityLabel} activation: ${input.name}`
  const summaryParts = [
    `${input.name} ${input.kind} workspace is being activated.`,
    input.workflowLabel ? `${input.workflowLabel} workflow selected.` : null,
    'Review your assignment and check in when available.',
  ].filter(Boolean)

  return {
    title,
    summary: summaryParts.join(' '),
  }
}

export function formatInitialReportForActivationNotification(
  report: ActivationInitialReportInput
): string {
  const parts: string[] = []

  if (report.shortDescription.trim()) {
    parts.push(`Summary: ${report.shortDescription.trim()}`)
  }
  if (report.whatHappened.trim()) {
    parts.push(`What happened: ${report.whatHappened.trim()}`)
  }
  if (report.callType) {
    parts.push(`Call type: ${report.callType}`)
  }
  if (report.callerName.trim()) {
    parts.push(`Caller: ${report.callerName.trim()}`)
  }
  if (report.callbackNumber.trim()) {
    parts.push(`Callback: ${report.callbackNumber.trim()}`)
  }
  if (report.icNotifiedName.trim()) {
    parts.push(`IC notified: ${report.icNotifiedName.trim()}`)
  }
  if (report.rpName.trim()) {
    parts.push(`RP: ${report.rpName.trim()}`)
  }
  if (report.materialReleased.trim()) {
    parts.push(`Material released: ${report.materialReleased.trim()}`)
  }
  if (report.reportDate.trim() || report.reportTime.trim()) {
    parts.push(
      `Report time: ${[report.reportDate.trim(), report.reportTime.trim()].filter(Boolean).join(' ')}`
    )
  }

  if (parts.length === 0) {
    return ''
  }

  return `Initial report\n${parts.join('\n')}`
}

export function buildActivationNotificationBody(input: {
  baseSummary: string
  includeInitialReport: boolean
  initialReport?: ActivationInitialReportInput
  customMessage?: string
}): string {
  const sections = [input.baseSummary.trim()]

  if (input.customMessage?.trim()) {
    sections.push(input.customMessage.trim())
  }

  if (input.includeInitialReport && input.initialReport) {
    const reportBlock = formatInitialReportForActivationNotification(input.initialReport)
    if (reportBlock) {
      sections.push(reportBlock)
    }
  }

  return sections.filter(Boolean).join('\n\n')
}

export function resolveActivationNotificationRecipientEmails(
  draft: BuildTeamRosterDraft
): string[] {
  const emails = new Set<string>()
  for (const member of draft.draftMembers) {
    const normalized = member.email.trim().toLowerCase()
    if (normalized) {
      emails.add(normalized)
    }
  }
  return [...emails]
}

export function resolveCustomMessageDeliveries(
  draft: BuildTeamRosterDraft,
  customMessages: ActivationCustomMessageRow[]
): ActivationCustomMessageDelivery[] {
  return customMessages.flatMap((row) => {
    const message = row.message.trim()
    if (!message || !row.target) {
      return []
    }

    const recipientEmails =
      row.target.kind === 'member'
        ? [row.target.email.trim().toLowerCase()].filter(Boolean)
        : resolveMembersForPosition(draft, row.target.positionName).map((email) =>
            email.trim().toLowerCase()
          )

    const uniqueEmails = [...new Set(recipientEmails.filter(Boolean))]
    if (uniqueEmails.length === 0) {
      return []
    }

    return [{ rowId: row.id, recipientEmails: uniqueEmails, message }]
  })
}

export function resolveMembersForPosition(
  draft: BuildTeamRosterDraft,
  positionName: string
): string[] {
  const normalizedPosition = positionName.trim().toLowerCase()
  if (!normalizedPosition) {
    return []
  }

  const emails = new Set<string>()
  for (const member of draft.draftMembers) {
    const matches = member.icsPositions.some(
      (position) => position.trim().toLowerCase() === normalizedPosition
    )
    if (matches && member.email.trim()) {
      emails.add(member.email.trim().toLowerCase())
    }
  }
  return [...emails]
}

export function buildActivationPositionOptions(draft: BuildTeamRosterDraft): string[] {
  const positions = new Set<string>()
  for (const position of draft.visibleStandardPositions) {
    if (position.trim()) positions.add(position.trim())
  }
  for (const position of draft.customPositions) {
    if (position.name.trim()) positions.add(position.name.trim())
  }
  for (const member of draft.draftMembers) {
    for (const position of member.icsPositions) {
      if (position.trim()) positions.add(position.trim())
    }
  }
  return [...positions].sort((left, right) => left.localeCompare(right))
}

export function buildActivationMemberTargetOptions(
  draft: BuildTeamRosterDraft
): Extract<ActivationNotificationTarget, { kind: 'member' }>[] {
  return draft.draftMembers.flatMap((member) => {
    const email = member.email.trim()
    if (!email) return []
    const positionSummary =
      member.icsPositions.length > 0 ? member.icsPositions.join(', ') : 'Unassigned'
    return [
      {
        kind: 'member' as const,
        memberId: member.id,
        email,
        label: `${email} · ${positionSummary}`,
      },
    ]
  })
}

export function formatActivationNotificationChannelSummary(
  channels: ActivationNotificationChannel[]
): string {
  if (channels.length === 0) {
    return 'No notification channels selected.'
  }
  return `Notification channels: ${channels.map(formatActivationNotificationChannelLabel).join(', ')}.`
}

export function summarizeNonPratusChannels(
  channels: ActivationNotificationChannel[]
): string | null {
  const pending = channels.filter((channel) => channel !== 'pratus')
  if (pending.length === 0) {
    return null
  }
  return `${pending.map(formatActivationNotificationChannelLabel).join(', ')} saved for future delivery.`
}
