import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import type { BuildTeamRosterDraft } from '../src/features/roster/roster-template-types.js'
import {
  applyMinimalIcOnlyRoster,
  applyRosterPlanToWorkspace,
  ensureCreatorAsIncidentCommander,
  loadDefaultRosterTemplate,
  loadRosterTemplateBySlug,
  markRosterInvitesSent,
  markRosterPlanApplied,
  runRosterPlanStep,
  saveWorkspaceRosterPlan,
  sendBuildTeamInvites,
  validateBuildTeamRosterDraft,
} from './roster-plan-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type ApplyWorkspaceRosterPlanBody = {
  workspaceId?: string
  draftPlan?: BuildTeamRosterDraft
}

function parseBody(req: VercelRequest): ApplyWorkspaceRosterPlanBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as ApplyWorkspaceRosterPlanBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as ApplyWorkspaceRosterPlanBody
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

    if (!workspaceId || !body.draftPlan) {
      return res.status(400).json({ error: 'workspaceId and draftPlan are required.' })
    }

    let draftPlan: BuildTeamRosterDraft
    try {
      draftPlan = validateBuildTeamRosterDraft(body.draftPlan)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid draftPlan payload.'
      return res.status(400).json({ error: message })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const creatorEmail = user.email?.trim().toLowerCase()
    if (!creatorEmail) {
      return res.status(400).json({ error: 'Signed-in user must have an email address.' })
    }

    const template = await runRosterPlanStep('load roster template', async () => {
      return (
        (await loadRosterTemplateBySlug(admin, draftPlan.templateSlug)) ??
        (await loadDefaultRosterTemplate())
      )
    })

    await runRosterPlanStep('ensure creator Incident Commander membership', async () => {
      await ensureCreatorAsIncidentCommander(admin, workspaceId, user.id, creatorEmail)
    })

    await runRosterPlanStep('save workspace roster plan', async () => {
      await saveWorkspaceRosterPlan(admin, {
        workspaceId,
        templateId: template.id,
        effectTiming: draftPlan.effectTiming,
        draftPlan,
        appliedAt: draftPlan.effectTiming === 'immediate' ? new Date().toISOString() : null,
        invitesSentAt: null,
      })
    })

    await runRosterPlanStep('send Build Team invites', async () => {
      await sendBuildTeamInvites(admin, workspaceId, draftPlan, user.id, creatorEmail)
    })

    await runRosterPlanStep('mark roster invites sent', async () => {
      await markRosterInvitesSent(admin, workspaceId)
    })

    if (draftPlan.effectTiming === 'immediate') {
      await runRosterPlanStep('apply roster plan to workspace', async () => {
        await applyRosterPlanToWorkspace(admin, workspaceId, draftPlan, user.id)
      })
      await runRosterPlanStep('mark roster plan applied', async () => {
        await markRosterPlanApplied(admin, workspaceId)
      })
    } else {
      await runRosterPlanStep('apply minimal Incident Commander roster', async () => {
        await applyMinimalIcOnlyRoster(admin, workspaceId)
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Apply workspace roster plan failed.'
    return res.status(500).json({ error: message })
  }
}
