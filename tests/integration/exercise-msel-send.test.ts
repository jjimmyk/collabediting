import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import createWorkspaceHandler from '../../api/create-workspace.ts'
import sendMselInjectHandler from '../../api/send-msel-inject.ts'
import { createMockRequest, invokeHandler } from '../helpers/mock-vercel.ts'
import {
  hasIntegrationTestCredentials,
  integrationDescribeLabel,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from '../helpers/test-env.ts'
import { TABLETOP_EXERCISE_WORKFLOW } from '@/lib/workspace-format'

const describeIntegration = hasIntegrationTestCredentials() ? describe : describe.skip

describeIntegration(`${integrationDescribeLabel()} — send MSEL inject`, () => {
  let admin: SupabaseClient
  let accessToken = ''
  let senderEmail = ''
  let workspaceId = ''
  let createdWorkspace = false
  const runId = Date.now()
  const workspaceName = `Integration MSEL Send ${runId}`

  beforeAll(() => {
    admin = createClient(supabaseUrl(), supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  })

  it('signs in test user', async () => {
    const anon = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const email = process.env.TEST_USER_EMAIL!.trim()
    const password = process.env.TEST_USER_PASSWORD!.trim()

    const { data, error } = await anon.auth.signInWithPassword({ email, password })
    expect(error).toBeNull()
    expect(data.session?.access_token).toBeTruthy()
    accessToken = data.session!.access_token
    senderEmail = email.toLowerCase()
  })

  it('creates a tabletop exercise workspace with MSEL metadata', async () => {
    const exerciseMsel = {
      objectives: [{ id: 1, name: 'Unified command' }],
      injects: [
        {
          id: 1,
          objectiveId: 1,
          scheduledTime: '2026-06-22T10:00',
          category: 'Operations',
          inject: 'Bridge closure inject',
          expectedAction: 'Reroute traffic',
          mapLocation: [-97.7431, 30.2672],
        },
      ],
    }

    const { statusCode, body } = await invokeHandler(
      createWorkspaceHandler,
      createMockRequest({
        method: 'POST',
        body: {
          kind: 'exercise',
          name: workspaceName,
          workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
          metadata: {
            category: 'Exercise',
            exerciseMsel,
          },
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as { workspace?: { workspaceId?: string } }
    expect(payload.workspace?.workspaceId).toBeTruthy()
    workspaceId = payload.workspace!.workspaceId!
    createdWorkspace = true
  })

  it('sends an MSEL inject to the signed-in roster member', async () => {
    const { statusCode, body } = await invokeHandler(
      sendMselInjectHandler,
      createMockRequest({
        method: 'POST',
        body: {
          workspaceId,
          injectId: 1,
          recipientEmails: [senderEmail],
          severity: 'Medium',
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as {
      deliveries?: Array<{ injectId: number; recipientEmail: string; title: string }>
    }
    expect(payload.deliveries?.length).toBe(1)
    expect(payload.deliveries?.[0]?.injectId).toBe(1)
    expect(payload.deliveries?.[0]?.recipientEmail).toBe(senderEmail)
    expect(payload.deliveries?.[0]?.title).toContain('Bridge closure inject')
  })

  it('allows duplicate sends to the same recipient', async () => {
    const { statusCode, body } = await invokeHandler(
      sendMselInjectHandler,
      createMockRequest({
        method: 'POST',
        body: {
          workspaceId,
          injectId: 1,
          recipientEmails: [senderEmail],
          severity: 'High',
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as { deliveries?: unknown[] }
    expect(payload.deliveries?.length).toBe(1)
  })

  afterAll(async () => {
    if (!createdWorkspace || !workspaceId) {
      return
    }
    await admin.from('exercise_msel_inject_deliveries').delete().eq('workspace_id', workspaceId)
    await admin.from('workspaces').delete().eq('id', workspaceId)
  })
})
