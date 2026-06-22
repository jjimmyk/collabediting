import type { SupabaseClient } from '@supabase/supabase-js'
import { getWorkspaceOrganizationId } from './org-shared.js'

export function normalizeCompetencyFunctionLabel(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function upsertOrganizationCompetencyFunction(
  admin: SupabaseClient,
  organizationId: string,
  label: string,
  createdBy: string
): Promise<string | null> {
  const normalized = normalizeCompetencyFunctionLabel(label)
  if (!normalized) return null

  const normalizedKey = normalized.toLowerCase()
  const { data: existing } = await admin
    .from('organization_roster_competency_functions')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('normalized_label', normalizedKey)
    .maybeSingle()

  if (!existing) {
    const { error } = await admin.from('organization_roster_competency_functions').insert({
      organization_id: organizationId,
      label: normalized,
      normalized_label: normalizedKey,
      created_by: createdBy,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  return normalized
}

export async function listOrganizationCompetencyFunctions(
  admin: SupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from('organization_roster_competency_functions')
    .select('label')
    .eq('organization_id', organizationId)
    .order('label')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? [])
    .map((row) => (typeof row.label === 'string' ? row.label.trim() : ''))
    .filter((label) => label.length > 0)
}

export async function resolveWorkspaceOrganizationId(
  admin: SupabaseClient,
  workspaceId: string
): Promise<string> {
  return getWorkspaceOrganizationId(admin, workspaceId)
}
