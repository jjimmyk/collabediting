import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import updateWorkspaceHandler from '../../api/update-workspace.ts'
import createWorkspaceHandler from '../../api/create-workspace.ts'
import startOperationalPeriodHandler from '../../api/start-operational-period.ts'
import { createMockRequest, invokeHandler } from '../helpers/mock-vercel.ts'
import {
  hasIntegrationTestCredentials,
  integrationDescribeLabel,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from '../helpers/test-env.ts'

const describeIntegration = hasIntegrationTestCredentials() ? describe : describe.skip

describeIntegration(integrationDescribeLabel(), () => {
  let admin: SupabaseClient
  let accessToken = ''
  let workspaceId = ''
  let createdWorkspace = false
  const runId = Date.now()
  const workspaceName = `Integration OP ${runId}`

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
  })

  it('creates an initial-response USCG incident workspace', async () => {
    const { statusCode, body } = await invokeHandler(
      createWorkspaceHandler,
      createMockRequest({
        method: 'POST',
        body: {
          kind: 'incident',
          name: workspaceName,
          workspaceFormat: 'uscg-ics',
          incidentComplexity: 'initial-response',
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

  it('upgrades workspace complexity to planning-p', async () => {
    const { statusCode, body } = await invokeHandler(
      updateWorkspaceHandler,
      createMockRequest({
        method: 'PATCH',
        body: {
          workspaceId,
          name: workspaceName,
          workspaceFormat: 'uscg-ics',
          incidentComplexity: 'planning-p',
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as {
      workspace?: { incidentComplexity?: string; hasSequentialWorkflow?: boolean }
    }
    expect(payload.workspace?.incidentComplexity).toBe('planning-p')
    expect(payload.workspace?.hasSequentialWorkflow).toBe(true)
  })

  it('starts operational period 1', async () => {
    const { statusCode, body } = await invokeHandler(
      startOperationalPeriodHandler,
      createMockRequest({
        method: 'POST',
        body: { workspaceId },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as { ok?: boolean; periodNumber?: number }
    expect(payload.ok).toBe(true)
    expect(payload.periodNumber).toBe(1)
  })

  afterAll(async () => {
    if (!createdWorkspace || !workspaceId) return
    await admin.from('workspaces').delete().eq('id', workspaceId)
  })
})
