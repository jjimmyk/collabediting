import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeExerciseMselMetadata } from './exercise-msel-metadata.js'

export const TABLETOP_EXERCISE_WORKFLOW = 'tabletop-exercise'

export type ApiMselInjectSnapshot = {
  id: number
  objectiveId: number | null
  scheduledTime: string
  category: string
  inject: string
  expectedAction: string
  mapLocation?: [number, number] | null
}

export type ApiMselInject = ApiMselInjectSnapshot

export function buildMselInjectSnapshot(inject: ApiMselInject): ApiMselInjectSnapshot {
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

export function getObjectiveLabel(
  objectives: Array<{ id: number; name: string }>,
  objectiveId: number | null
): string {
  if (objectiveId == null) {
    return 'No objective selected'
  }
  const objective = objectives.find((entry) => entry.id === objectiveId)
  if (!objective) {
    return 'Unknown objective'
  }
  return objective.name.trim() || 'Untitled objective'
}

export function buildMselInjectNotificationContent(options: {
  inject: ApiMselInjectSnapshot
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

export function normalizeRecipientEmails(emails: string[]): string[] {
  return emails.map((email) => email.trim().toLowerCase()).filter(Boolean)
}

export function findMselInjectInMetadata(
  metadata: Record<string, unknown> | null | undefined,
  injectId: number
): ApiMselInject | null {
  const exerciseMsel = normalizeExerciseMselMetadata(metadata?.exerciseMsel)
  if (!exerciseMsel) {
    return null
  }
  return exerciseMsel.injects.find((inject) => inject.id === injectId) ?? null
}

export async function fetchActiveWorkspaceRosterEmails(
  admin: SupabaseClient,
  workspaceId: string
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('workspace_members')
    .select('email')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')

  if (error) {
    throw new Error(error.message)
  }

  return new Set(
    (data ?? [])
      .map((row) => (typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''))
      .filter(Boolean)
  )
}

export function assertRecipientsOnRoster(
  recipientEmails: string[],
  rosterEmails: Set<string>
): string[] {
  const invalid = recipientEmails.filter((email) => !rosterEmails.has(email))
  if (invalid.length > 0) {
    throw new Error(`Recipients must be on the workspace roster: ${invalid.join(', ')}`)
  }
  return recipientEmails
}

export async function assertActiveWorkspaceMember(
  admin: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<void> {
  const { data, error } = await admin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('You do not have access to this workspace.')
  }
}
