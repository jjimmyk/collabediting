import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import createWorkspaceHandler from '../../api/create-workspace.ts'
import matchWorkspaceAssetsHandler from '../../api/match-workspace-assets.ts'
import { createMockRequest, invokeHandler } from '../helpers/mock-vercel.ts'
import {
  hasIntegrationTestCredentials,
  integrationDescribeLabel,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from '../helpers/test-env.ts'

const describeIntegration = hasIntegrationTestCredentials() ? describe : describe.skip

describeIntegration(`${integrationDescribeLabel()} — match workspace assets`, () => {
  let admin: SupabaseClient
  let accessToken = ''
  let workspaceId = ''
  let createdWorkspace = false
  const runId = Date.now()

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
    accessToken = data.session!.access_token
  })

  it('creates workspace for asset match API', async () => {
    const { statusCode, body } = await invokeHandler(
      createWorkspaceHandler,
      createMockRequest({
        method: 'POST',
        body: {
          kind: 'incident',
          name: `Asset Match API ${runId}`,
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )
    expect(statusCode).toBe(200)
    const payload = body as { workspace?: { workspaceId?: string } }
    workspaceId = payload.workspace!.workspaceId!
    createdWorkspace = true
  })

  it('ranks assets for a resource label', async () => {
    const { statusCode, body } = await invokeHandler(
      matchWorkspaceAssetsHandler,
      createMockRequest({
        method: 'POST',
        body: {
          workspaceId,
          query: 'Helicopter',
          assets: [
            {
              assetKey: 'helo-1',
              searchText: 'mh-65 dolphin helicopter aircraft',
            },
            {
              assetKey: 'boat-1',
              searchText: 'small boat vessel',
            },
          ],
        },
        headers: { authorization: `Bearer ${accessToken}` },
      })
    )

    expect(statusCode).toBe(200)
    const payload = body as { suggestedKeys?: string[]; engine?: string }
    expect(payload.engine).toBeTruthy()
    expect(payload.suggestedKeys).toContain('helo-1')
  })

  afterAll(async () => {
    if (!createdWorkspace || !workspaceId) return
    await admin.from('workspaces').delete().eq('id', workspaceId)
  })
})
