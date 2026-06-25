import { describe, expect, it } from 'vitest'
import {
  createInitialSitrepForm,
  SITREP_SECTIONS_AOR,
  SITREP_SECTIONS_WORKSPACE,
} from '@/features/sitrep/constants'
import {
  buildDefaultSitrepForAor,
  buildDefaultSitrepForWorkspace,
  cloneSitrepFormState,
  createLocalSitrepVersion,
  getSitrepSectionsForScope,
  isSitrepSectionAllowedForScope,
  resolveDefaultSitrepActiveSection,
  resolveSitrepScopeRef,
  summarizeSitrepForMap,
} from '@/features/sitrep/utils'

describe('sitrep utils', () => {
  it('returns AOR sections with ongoing incidents and workspace sections without', () => {
    expect(getSitrepSectionsForScope('aor')).toEqual(SITREP_SECTIONS_AOR)
    expect(getSitrepSectionsForScope('incident')).toEqual(SITREP_SECTIONS_WORKSPACE)
    expect(getSitrepSectionsForScope('exercise')).toEqual(SITREP_SECTIONS_WORKSPACE)
    expect(SITREP_SECTIONS_WORKSPACE.some((section) => section.id === 'ongoing-incidents')).toBe(
      false
    )
  })

  it('resets active section when ongoing incidents is not allowed', () => {
    expect(resolveDefaultSitrepActiveSection('incident', 'ongoing-incidents')).toBe(
      'executive-summary'
    )
    expect(resolveDefaultSitrepActiveSection('aor', 'ongoing-incidents')).toBe('ongoing-incidents')
    expect(isSitrepSectionAllowedForScope('ongoing-incidents', 'exercise')).toBe(false)
  })

  it('resolves workspace and AOR scope refs', () => {
    const workspaceRef = resolveSitrepScopeRef('incident-42', {
      accessibleWorkspaces: [
        {
          workspaceId: 'ws-42',
          kind: 'incident',
          legacyId: 42,
          name: 'Test Incident',
        },
      ],
      organizationId: 'org-1',
      scopeOptions: [
        {
          id: 'incident-42',
          kind: 'incident',
          label: 'Test Incident',
          workspace: { id: 42 },
        },
      ],
    })

    expect(workspaceRef).toEqual({
      kind: 'workspace',
      scopeId: 'incident-42',
      scopeKind: 'incident',
      workspaceId: 'ws-42',
      label: 'Test Incident',
      legacyId: 42,
    })

    const aorRef = resolveSitrepScopeRef('aor-fema-3', {
      accessibleWorkspaces: [],
      organizationId: 'org-1',
      scopeOptions: [{ id: 'aor-fema-3', kind: 'aor', label: 'FEMA Region 3' }],
    })

    expect(aorRef).toEqual({
      kind: 'aor',
      scopeId: 'aor-fema-3',
      scopeKind: 'aor',
      organizationId: 'org-1',
      femaAorId: '3',
      label: 'FEMA Region 3',
    })
  })

  it('builds default workspace and AOR forms', () => {
    const base = createInitialSitrepForm()
    const workspaceForm = buildDefaultSitrepForWorkspace(
      {
        id: 7,
        name: 'Storm Response',
        type: 'Severe Weather',
        status: 'Active',
        severity: 'High',
        region: 'District 5',
        lead: 'Alex Rivera',
        summary: 'Coastal flooding ongoing.',
        resourcesCommitted: '12 crews',
        startedAt: '2026-05-09 06:00 UTC',
      },
      'incident',
      base
    )

    expect(workspaceForm.incidentName).toBe('Storm Response')
    expect(workspaceForm.executiveSummary).toContain('Coastal flooding ongoing.')

    const aorForm = buildDefaultSitrepForAor('FEMA Region 1', base, (label) => `Summary for ${label}`)
    expect(aorForm.executiveSummary).toBe('Summary for FEMA Region 1')
  })

  it('creates local versions and map summaries', () => {
    const form = createInitialSitrepForm()
    const version = createLocalSitrepVersion(form, 'You', '#16a34a', {
      sectionId: 'executive-summary',
      authorRole: 'Planner',
    })

    expect(version.snapshot).not.toBe(form)
    expect(version.sectionId).toBe('executive-summary')
    expect(cloneSitrepFormState(form).executiveSummary).toBe(form.executiveSummary)

    const longSummary = 'x'.repeat(300)
    expect(summarizeSitrepForMap({ ...form, executiveSummary: longSummary }).endsWith('…')).toBe(
      true
    )
    expect(summarizeSitrepForMap({ ...form, executiveSummary: '' })).toBe(
      'No executive summary recorded.'
    )
  })
})
