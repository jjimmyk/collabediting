import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import updateWorkspaceHandler from '../../api/update-workspace.ts'
import createWorkspaceHandler from '../../api/create-workspace.ts'
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

describeIntegration(`${integrationDescribeLabel()} — exercise MSEL metadata`, () => {
  let admin: SupabaseClient
  let accessToken = ''
  let workspaceId = ''
  let createdWorkspace = false
  const runId = Date.now()
  const workspaceName = `Integration Tabletop MSEL ${runId}`

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

  it('creates a tabletop exercise workspace with MSEL metadata', async () => {
    const exerciseMsel = {
      mode: 'tabletop' as const,
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
    const payload = body as {
      workspace?: { workspaceId?: string; metadata?: { exerciseMsel?: typeof exerciseMsel } }
    }
    expect(payload.workspace?.workspaceId).toBeTruthy()
    workspaceId = payload.workspace!.workspaceId!
    createdWorkspace = true
  })

  it('round-trips exercise MSEL metadata on update', async () => {
    const exerciseMsel = {
      mode: 'tabletop' as const,
      objectives: [{ id: 1, name: 'Unified command' }],
      injects: [
        {
          id: 1,
          objectiveId: 1,
          scheduledTime: '2026-06-22T11:00',
          category: 'Operations',
          inject: 'Updated inject text',
          expectedAction: 'Coordinate with county EOC',
          mapLocation: [-95.3698, 29.7604],
        },
      ],
    }

    const { statusCode, body } = await invokeHandler(
      updateWorkspaceHandler,
      createMockRequest({
        method: 'PATCH',
        body: {
          workspaceId,
          name: workspaceName,
          workspaceFormat: TABLETOP_EXERCISE_WORKFLOW,
          metadata: {
            exerciseMsel,
          },
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as {
      workspace?: { metadata?: { exerciseMsel?: typeof exerciseMsel } }
    }
    expect(payload.workspace?.metadata?.exerciseMsel?.injects[0].inject).toBe('Updated inject text')
    expect(payload.workspace?.metadata?.exerciseMsel?.injects[0].mapLocation).toEqual([
      -95.3698, 29.7604,
    ])
  })

  afterAll(async () => {
    if (!createdWorkspace || !workspaceId) {
      return
    }
    await admin.from('workspaces').delete().eq('id', workspaceId)
  })
})
