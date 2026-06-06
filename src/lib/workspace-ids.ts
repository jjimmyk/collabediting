import type { WorkspaceKind } from '@/lib/workspace-types'

/** Stable UUIDs seeded in supabase/migrations/001_workspaces_roster_auth.sql */
export const SEEDED_WORKSPACE_IDS: Record<`${WorkspaceKind}:${number}`, string> = {
  'incident:1': 'a1000001-0001-4000-8000-000000000001',
  'incident:2': 'a1000001-0001-4000-8000-000000000002',
  'incident:3': 'a1000001-0001-4000-8000-000000000003',
  'exercise:1': 'a1000002-0002-4000-8000-000000000001',
  'exercise:2': 'a1000002-0002-4000-8000-000000000002',
  'exercise:3': 'a1000002-0002-4000-8000-000000000003',
}

export function getSeededWorkspaceId(kind: WorkspaceKind, legacyId: number): string | null {
  return SEEDED_WORKSPACE_IDS[`${kind}:${legacyId}`] ?? null
}
