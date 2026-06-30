import { describe, expect, it } from 'vitest'
import { buildDynamicOrgChart } from '@/features/roster/build-dynamic-org-chart'
import { buildWideLayoutConnectorLinks } from '@/features/roster/build-wide-layout-connector-links'
import { buildDraftPositionCatalog, buildDraftRosterMembers } from '@/features/roster/build-draft-position-catalog'
import {
  HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS,
  HWCG_SOURCE_CONTROL_STANDARD_POSITIONS,
  HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
} from '@/features/roster/hwcg-source-control-roster-template'
import {
  HWCG_SOURCE_CONTROL_SECTION_BRANCHES,
} from '@/features/roster/hwcg-source-control-org-chart-structure'
import { createBuildTeamRosterDraftFromTemplate } from '@/features/roster/roster-draft-state'
import { getRosterTemplateBySlug } from '@/features/roster/roster-template-catalog'
import { orgChartForkLayoutTokens, orgChartHwcgPositionCardSizeClasses, orgChartHwcgSectionChiefRowTokens, orgChartSectionColumnClassName } from '@/features/roster/org-chart-layout-tokens'
import { orgChartHwcgSecondaryTextClasses } from '@/features/roster/ics-org-chart-structure'
import { DEFAULT_ROSTER_DISPLAY_FILTERS } from '@/features/roster/roster-display-filters'
import { resolvePositionReportsTo } from '@/features/roster/workspace-positions'
import type { OrgChartNode } from '@/features/roster/ics-org-chart-structure'
import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'

function findPositionNode(
  nodes: OrgChartNode[],
  position: string
): Extract<OrgChartNode, { kind: 'position' }> | undefined {
  for (const node of nodes) {
    if (node.kind === 'position') {
      if (node.position === position) return node
      const nested = findPositionNode(node.children ?? [], position)
      if (nested) return nested
    }
    if (node.kind === 'group' || node.kind === 'stack' || node.kind === 'fork') {
      const nested = findPositionNode(node.children, position)
      if (nested) return nested
    }
  }
  return undefined
}

describe('hwcg-source-control roster template', () => {
  it('registers in the built-in catalog', () => {
    const template = getRosterTemplateBySlug(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    expect(template?.name).toBe('HWCG Source Control')
    expect(template?.definition.customPositions?.length).toBe(
      HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS.length
    )
  })

  it('seeds five standard positions and all custom positions in draft', () => {
    const draft = createBuildTeamRosterDraftFromTemplate(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    expect(draft.visibleStandardPositions).toEqual([...HWCG_SOURCE_CONTROL_STANDARD_POSITIONS])
    expect(draft.customPositions).toHaveLength(HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS.length)

    const customNames = new Set(draft.customPositions.map((position) => position.name))
    expect(customNames.size).toBe(draft.customPositions.length)

    for (const seed of HWCG_SOURCE_CONTROL_CUSTOM_POSITIONS) {
      const match = draft.customPositions.find((position) => position.name === seed.name)
      expect(match?.reportsTo).toBe(seed.reportsTo)
      expect(match?.positionType).toBe(seed.positionType)
      expect(draft.positionSettings[seed.name]?.positionType).toBe(seed.positionType)
    }
  })

  it('resolves reportsTo for deep custom units through the custom chain', () => {
    const draft = createBuildTeamRosterDraftFromTemplate(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    const catalog = buildDraftPositionCatalog(draft)

    expect(resolvePositionReportsTo('Interim Riser Systems Unit', catalog)).toBe(
      'Interim Containment Task Force'
    )
    expect(resolvePositionReportsTo('Source Control Branch', catalog)).toBe(
      'Operations Section Chief'
    )
    expect(resolvePositionReportsTo('Rig Operations Task Force', catalog)).toBe('Relief Well Group')
    expect(resolvePositionReportsTo('Vessel Management Team', catalog)).toBe('SIMOPS Group')
    expect(resolvePositionReportsTo('Command Staff', catalog)).toBe('Incident Commander')
    expect(resolvePositionReportsTo('HWCG Crisis Management Team', catalog)).toBe(
      'Operations Section Chief'
    )
  })

  it('builds HWCG section order and branch/group fork layout with colors', () => {
    const draft = createBuildTeamRosterDraftFromTemplate(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    const catalog = buildDraftPositionCatalog(draft)
    const rosterMembers = buildDraftRosterMembers(draft)
    const layout = buildDynamicOrgChart(catalog, [], rosterMembers, {
      templateSlug: HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
    })

    expect(layout.sectionBranches.map((branch) => branch.label)).toEqual(
      HWCG_SOURCE_CONTROL_SECTION_BRANCHES.map((branch) => branch.label)
    )

    const operationsChief = layout.sectionBranches
      .flatMap((branch) => branch.children)
      .find(
        (node): node is Extract<OrgChartNode, { kind: 'position' }> =>
          node.kind === 'position' && node.position === 'Operations Section Chief'
      )

    expect(operationsChief?.color).toBe('hwcg_section')
    expect(operationsChief?.children?.[0]?.kind).toBe('fork')
    expect(operationsChief?.children?.[0]?.forkVariant).toBe('hwcg_ops')

    const opsFork = operationsChief?.children?.[0]
    expect(opsFork?.kind).toBe('fork')
    if (opsFork?.kind !== 'fork') return

    const sourceControlBranch = opsFork.children.find(
      (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
        child.kind === 'position' && child.position === 'Source Control Branch'
    )
    expect(sourceControlBranch?.color).toBe('hwcg_ic')

    const sourceControlFork = sourceControlBranch?.children?.[0]
    expect(sourceControlFork?.kind).toBe('fork')
    if (sourceControlFork?.kind !== 'fork') return
    expect(sourceControlFork.forkVariant).toBe('hwcg_source_control')
    expect(sourceControlFork.children).toHaveLength(5)

    const crisisTeam = opsFork.children.find(
      (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
        child.kind === 'position' && child.position === 'HWCG Crisis Management Team'
    )
    expect(crisisTeam?.connectorStyle).toBeUndefined()
    expect(crisisTeam?.color).toBe('hwcg_advisory')

    const containmentGroup = sourceControlFork.children.find(
      (child): child is Extract<OrgChartNode, { kind: 'position' }> =>
        child.kind === 'position' && child.position === 'Containment Group'
    )
    const interimTf = findPositionNode(containmentGroup?.children ?? [], 'Interim Containment Task Force')
    expect(interimTf?.color).toBe('hwcg_task_force')
    const interimUnit = findPositionNode(interimTf?.children ?? [], 'Interim Riser Systems Unit')
    expect(interimUnit?.color).toBe('hwcg_unit')
  })

  it('uses compact HWCG fork layout tokens without expanding crossbars to parent width', () => {
    expect(orgChartForkLayoutTokens('hwcg_ops')).toEqual({
      minWidthClassName: 'w-max',
      columnClassName: 'grid-cols-3 gap-x-3',
      expandToParent: false,
    })
    expect(orgChartForkLayoutTokens('hwcg_source_control')).toEqual({
      minWidthClassName: 'w-max',
      columnClassName: 'grid-cols-5 gap-x-2',
      expandToParent: false,
    })
    expect(orgChartForkLayoutTokens('default').expandToParent).toBe(true)
  })

  it('uses tight HWCG section chief row tokens derived from group fork spacing', () => {
    expect(orgChartHwcgSectionChiefRowTokens()).toEqual({
      columnClassName: 'grid-cols-4 gap-x-4',
      columnMinWidthClassName: 'min-w-[12rem]',
      gridTemplateColumnsClassName: 'grid-cols-[repeat(4,12rem)]',
    })
    expect(orgChartSectionColumnClassName('Finance Section', HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)).toBe(
      ''
    )
  })

  it('uses high-contrast secondary text classes on HWCG org chart cards', () => {
    expect(orgChartHwcgSecondaryTextClasses('hwcg_section')).toBe('!text-white')
    expect(orgChartHwcgSecondaryTextClasses('hwcg_unit')).toBe('!text-slate-900')
  })

  it('uses fixed HWCG position card dimensions sized to Capping Group reference', () => {
    expect(orgChartHwcgPositionCardSizeClasses()).toBe('w-[9.5rem] h-[5.5rem]')
  })

  it('links Source Control Branch to its group fork in spine connectors', () => {
    const draft = createBuildTeamRosterDraftFromTemplate(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    const catalog = buildDraftPositionCatalog(draft)
    const rosterMembers = buildDraftRosterMembers(draft)
    const entriesByPosition = Object.fromEntries(
      catalog.orgChartPositionNames.map((position) => [
        position,
        { position, members: [], assets: [] } as PositionRosterEntry,
      ])
    )
    const layout = buildDynamicOrgChart(catalog, [], rosterMembers, {
      templateSlug: HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
    })

    const { spineLinks } = buildWideLayoutConnectorLinks(layout, {
      entriesByPosition,
      assetsByKey: {},
      rosterById: Object.fromEntries(rosterMembers.map((member) => [member.id, member])),
      visiblePositions: new Set(catalog.orgChartPositionNames),
      displayFilters: DEFAULT_ROSTER_DISPLAY_FILTERS,
      orgChartTemplateSlug: HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
    })

    expect(
      spineLinks.some(
        (link) =>
          link.parentId === 'pos:Source Control Branch' &&
          link.layout === 'crossbar' &&
          link.childIds.includes('pos:SIMOPS Group')
      )
    ).toBe(true)
    expect(
      spineLinks.some(
        (link) =>
          link.parentId === 'pos:Operations Section Chief' &&
          link.layout === 'crossbar' &&
          link.childIds.includes('pos:OSR Branch (QI/SMT)') &&
          link.childIds.includes('pos:Source Control Branch')
      )
    ).toBe(true)
    expect(
      spineLinks.some(
        (link) =>
          link.parentId === 'pos:Operations Section Chief' &&
          !link.dashed &&
          link.layout === 'crossbar' &&
          link.childIds.includes('pos:HWCG Crisis Management Team')
      )
    ).toBe(true)
  })

  it('builds dashed advisory IC bus links and chief-based section connectors', () => {
    const draft = createBuildTeamRosterDraftFromTemplate(HWCG_SOURCE_CONTROL_TEMPLATE_SLUG)
    const catalog = buildDraftPositionCatalog(draft)
    const rosterMembers = buildDraftRosterMembers(draft)
    const entriesByPosition = Object.fromEntries(
      catalog.orgChartPositionNames.map((position) => [
        position,
        { position, members: [], assets: [] } as PositionRosterEntry,
      ])
    )
    const layout = buildDynamicOrgChart(catalog, [], rosterMembers, {
      templateSlug: HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
    })

    const { icBusLinks, spineLinks } = buildWideLayoutConnectorLinks(layout, {
      entriesByPosition,
      assetsByKey: {},
      rosterById: Object.fromEntries(rosterMembers.map((member) => [member.id, member])),
      visiblePositions: new Set(catalog.orgChartPositionNames),
      displayFilters: DEFAULT_ROSTER_DISPLAY_FILTERS,
      orgChartTemplateSlug: HWCG_SOURCE_CONTROL_TEMPLATE_SLUG,
    })

    expect(
      icBusLinks.some(
        (link) =>
          link.dashed &&
          link.headerIds.includes('pos:Command Staff') &&
          link.headerIds.includes('pos:Supporting Government Officials (FOSC)')
      )
    ).toBe(true)

    expect(
      icBusLinks.some((link) =>
        link.headerIds.includes('pos:Finance Section Chief')
      )
    ).toBe(true)

    expect(
      icBusLinks.some((link) =>
        link.headerIds.includes('pos:Operations Section Chief') &&
        link.headerIds.includes('pos:Planning Section Chief')
      )
    ).toBe(true)

    expect(
      spineLinks.some(
        (link) =>
          link.parentId === 'pos:Operations Section Chief' &&
          link.childIds.includes('pos:OSR Branch (QI/SMT)')
      )
    ).toBe(true)
  })
})
