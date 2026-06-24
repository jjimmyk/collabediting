import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import {
  assertActiveWorkspaceMember,
  assertRecipientsOnRoster,
  buildMselInjectNotificationContent,
  buildMselInjectSnapshot,
  fetchActiveWorkspaceRosterEmails,
  findMselInjectInMetadata,
  getObjectiveLabel,
  normalizeRecipientEmails,
  TABLETOP_EXERCISE_WORKFLOW,
} from './exercise-msel-delivery-shared.js'
import { normalizeExerciseMselMetadata } from './exercise-msel-metadata.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type SendMselInjectBody = {
  workspaceId?: string
  injectId?: number
  recipientEmails?: string[]
  severity?: string
}

function parseBody(req: VercelRequest): SendMselInjectBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as SendMselInjectBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as SendMselInjectBody
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({ error: 'Supabase server environment is not configured.' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const body = parseBody(req)
    const workspaceId = body.workspaceId?.trim()
    const injectId = body.injectId
    const recipientEmails = normalizeRecipientEmails(body.recipientEmails ?? [])
    const severity = body.severity?.trim() || 'Medium'

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required.' })
    }
    if (typeof injectId !== 'number' || !Number.isFinite(injectId)) {
      return res.status(400).json({ error: 'injectId is required.' })
    }
    if (recipientEmails.length === 0) {
      return res.status(400).json({ error: 'Select at least one roster recipient.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    await assertActiveWorkspaceMember(admin, user.id, workspaceId)

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .select('id, kind, name, workspace_format, metadata')
      .eq('id', workspaceId)
      .maybeSingle()

    if (workspaceError || !workspace) {
      return res.status(404).json({ error: 'Workspace not found.' })
    }

    if (workspace.kind !== 'exercise') {
      return res.status(400).json({ error: 'MSEL inject send is only available in exercise workspaces.' })
    }

    if (workspace.workspace_format !== TABLETOP_EXERCISE_WORKFLOW) {
      return res.status(400).json({ error: 'MSEL inject send requires a tabletop exercise workspace.' })
    }

    const metadata = (workspace.metadata ?? {}) as Record<string, unknown>
    const inject = findMselInjectInMetadata(metadata, injectId)
    if (!inject) {
      return res.status(404).json({ error: 'MSEL inject not found in workspace schedule.' })
    }

    const rosterEmails = await fetchActiveWorkspaceRosterEmails(admin, workspaceId)
    if (rosterEmails.size === 0) {
      return res.status(400).json({ error: 'Workspace roster has no active members to receive injects.' })
    }

    try {
      assertRecipientsOnRoster(recipientEmails, rosterEmails)
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid recipients.',
      })
    }

    const exerciseMsel = normalizeExerciseMselMetadata(metadata.exerciseMsel)
    const objectives = exerciseMsel?.objectives ?? []
    const objectiveLabel = getObjectiveLabel(objectives, inject.objectiveId ?? null)
    const injectSnapshot = buildMselInjectSnapshot(inject)
    const notificationContent = buildMselInjectNotificationContent({
      inject: injectSnapshot,
      objectiveLabel,
      workspaceName: workspace.name,
    })

    const senderEmail = user.email?.trim().toLowerCase() ?? null
    const deliveries: Array<Record<string, unknown>> = []

    for (const recipientEmail of recipientEmails) {
      const { data: hubNotification, error: hubError } = await admin
        .from('hub_user_notifications')
        .insert({
          recipient_email: recipientEmail,
          title: notificationContent.title,
          summary: notificationContent.summary,
          severity,
          created_by_email: senderEmail,
        })
        .select('id')
        .single()

      if (hubError || !hubNotification) {
        return res.status(500).json({ error: hubError?.message ?? 'Could not create notification.' })
      }

      const { data: delivery, error: deliveryError } = await admin
        .from('exercise_msel_inject_deliveries')
        .insert({
          workspace_id: workspaceId,
          inject_id: injectId,
          recipient_email: recipientEmail,
          title: notificationContent.title,
          summary: notificationContent.summary,
          severity,
          inject_snapshot: injectSnapshot,
          sent_by_email: senderEmail,
          hub_notification_id: hubNotification.id,
        })
        .select('*')
        .single()

      if (deliveryError || !delivery) {
        return res.status(500).json({ error: deliveryError?.message ?? 'Could not record inject delivery.' })
      }

      deliveries.push(delivery)
    }

    return res.status(200).json({
      ok: true,
      deliveries: deliveries.map(mapDeliveryResponse),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send MSEL inject failed.'
    return res.status(500).json({ error: message })
  }
}

function mapDeliveryResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    injectId: row.inject_id,
    recipientEmail: row.recipient_email,
    title: row.title,
    summary: row.summary,
    severity: row.severity,
    injectSnapshot: row.inject_snapshot,
    sentByEmail: row.sent_by_email ?? null,
    hubNotificationId: row.hub_notification_id ?? null,
    createdAt: row.created_at,
  }
}
