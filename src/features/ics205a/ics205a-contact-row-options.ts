import type { PositionRosterEntry } from '@/features/roster/workspace-position-roster'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { ResourceListItemData } from '@/features/resources/types'
import type { Ics205aContactRow } from '@/features/ics205a/types'
import {
  buildWorkAssignmentTarget,
  formatWorkAssignmentTargetLabel,
  parseWorkAssignmentTarget,
  type WorkAssignmentTargetContext,
} from '@/lib/work-assignment-target'
import {
  buildWorkAssignmentTargetOptions,
  mergeLegacyWorkAssignmentTargetOption,
  type WorkAssignmentTargetOption,
} from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics205aContactRowOption = {
  value: string
  label: string
  group: string
  disabled?: boolean
}

export type Ics205aContactRowOptionsInput = {
  roster: WorkspaceRosterMember[]
  positionEntries: PositionRosterEntry[]
  catalog?: WorkspacePositionCatalog
  assetsByKey?: Record<string, ResourceListItemData>
}

export const ICS205A_ASSIGNED_POSITION_GROUPS = [
  'Positions (active roster)',
  'Positions (scheduled next OP)',
  'Single resources (active roster)',
  'Single resources (scheduled next OP)',
  'Assets (active roster)',
  'Assets (scheduled next OP)',
  'Legacy',
] as const

export const ICS205A_NAME_GROUPS = [
  'Members (active roster)',
  'Members (scheduled next OP)',
  'Assets (active roster)',
  'Assets (scheduled next OP)',
  'Resource categories',
  'Custom',
  'Legacy',
] as const

export const ICS205A_CUSTOM_NAME_VALUE = '__custom__'

const ASSIGNED_POSITION_TARGET_TYPES = new Set([
  'position',
  'single_resource',
  'org_chart_asset',
])

const NAME_TARGET_TYPES = new Set(['member', 'position_asset', 'resource_category'])

function buildOptionsContext(
  input: Ics205aContactRowOptionsInput
): WorkAssignmentTargetContext {
  const resourceCategoriesById: WorkAssignmentTargetContext['resourceCategoriesById'] = {}
  for (const entry of input.positionEntries) {
    for (const category of entry.resourceCategories) {
      resourceCategoriesById[category.id] = { ...category, positionName: entry.position }
    }
  }
  return {
    assetsByKey: input.assetsByKey,
    resourceCategoriesById,
  }
}

function toContactRowOption(option: WorkAssignmentTargetOption): Ics205aContactRowOption {
  return {
    value: option.value,
    label: option.label,
    group: option.group,
    disabled: option.disabled,
  }
}

function appendCatalogPositionOptions(
  options: Ics205aContactRowOption[],
  input: Ics205aContactRowOptionsInput
): Ics205aContactRowOption[] {
  if (!input.catalog) return options

  const merged = [...options]
  for (const positionName of input.catalog.rosterPositionNames) {
    const encoded = buildWorkAssignmentTarget({
      type: 'position',
      position: positionName,
      roster: input.roster,
    }).value
    if (merged.some((option) => option.value === encoded)) continue

    const entry = input.positionEntries.find((item) => item.position === positionName)
    if (entry?.opAdvanceLabel === 'retire_on_op_advance') continue

    merged.push({
      value: encoded,
      label: positionName,
      group: entry?.isPlanned
        ? 'Positions (scheduled next OP)'
        : 'Positions (active roster)',
    })
  }

  return merged
}

export function buildIcs205aAssignedPositionOptions(
  input: Ics205aContactRowOptionsInput,
  currentValue = ''
): Ics205aContactRowOption[] {
  const context = buildOptionsContext(input)
  const baseOptions = buildWorkAssignmentTargetOptions({
    roster: input.roster,
    positionEntries: input.positionEntries,
    catalog: input.catalog,
    assetsByKey: input.assetsByKey,
  }).filter((option) => ASSIGNED_POSITION_TARGET_TYPES.has(option.targetType))

  const withCatalogPositions = appendCatalogPositionOptions(
    baseOptions.map(toContactRowOption),
    input
  )

  const seen = new Set<string>()
  const deduped = withCatalogPositions.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })

  return mergeLegacyWorkAssignmentTargetOption(
    deduped.map((option) => ({
      ...option,
      targetType: parseWorkAssignmentTarget(option.value, input.roster, context).type,
    })),
    currentValue,
    input.roster,
    context
  ).map(toContactRowOption)
}

export function encodeCustomIcs205aName(name: string): string {
  return `custom:${name}`
}

export function isCustomIcs205aName(value: string): boolean {
  const trimmed = value.trim()
  return trimmed === ICS205A_CUSTOM_NAME_VALUE || trimmed.startsWith('custom:')
}

export function parseCustomIcs205aName(value: string): string {
  if (value.startsWith('custom:')) {
    return value.slice('custom:'.length)
  }
  return value
}

export function buildIcs205aContactNameOptions(
  input: Ics205aContactRowOptionsInput,
  assignedPositionValue: string
): Ics205aContactRowOption[] {
  const context = buildOptionsContext(input)
  const assigned = parseWorkAssignmentTarget(assignedPositionValue, input.roster, context)
  const options: Ics205aContactRowOption[] = []

  if (assigned.type === 'position' && assigned.position) {
    const position = assigned.position
    const allOptions = buildWorkAssignmentTargetOptions({
      roster: input.roster,
      positionEntries: input.positionEntries,
      catalog: input.catalog,
      assetsByKey: input.assetsByKey,
    })

    for (const option of allOptions) {
      if (!NAME_TARGET_TYPES.has(option.targetType)) continue
      const parsed = parseWorkAssignmentTarget(option.value, input.roster, context)
      if (parsed.position !== position) continue
      if (option.targetType === 'resource_category') {
        const category = context.resourceCategoriesById?.[parsed.categoryId ?? '']
        if (!category?.filledMemberId && !category?.filledAssetKey) continue
      }
      options.push(toContactRowOption(option))
    }
  } else if (assigned.type === 'single_resource' && assigned.memberId) {
    const target = buildWorkAssignmentTarget({
      type: 'single_resource',
      memberId: assigned.memberId,
      roster: input.roster,
    })
    options.push({
      value: target.value,
      label: target.label,
      group: 'Members (active roster)',
    })
  } else if (assigned.type === 'org_chart_asset' && assigned.assetKey) {
    const target = buildWorkAssignmentTarget({
      type: 'org_chart_asset',
      assetKey: assigned.assetKey,
      roster: input.roster,
      assetsByKey: input.assetsByKey,
    })
    options.push({
      value: target.value,
      label: target.label,
      group: 'Assets (active roster)',
    })
  }

  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

export function mergeLegacyIcs205aContactNameOption(
  options: Ics205aContactRowOption[],
  currentValue: string,
  roster: WorkspaceRosterMember[] = [],
  context: WorkAssignmentTargetContext = {}
): Ics205aContactRowOption[] {
  const trimmed = currentValue.trim()
  if (!trimmed || options.some((option) => option.value === trimmed)) {
    return options
  }

  if (isCustomIcs205aName(trimmed)) {
    const customLabel = parseCustomIcs205aName(trimmed) || 'Custom name'
    return [
      ...options,
      {
        value: trimmed,
        label: customLabel,
        group: 'Custom',
      },
    ]
  }

  const parsed = parseWorkAssignmentTarget(trimmed, roster, context)
  if (parsed.type !== 'unassigned' && options.some((option) => option.value === parsed.value)) {
    return options
  }

  if (parsed.type !== 'unassigned') {
    return [
      ...options,
      {
        value: trimmed,
        label: `${formatWorkAssignmentTargetLabel(trimmed, roster, context)} (legacy)`,
        group: 'Legacy',
        disabled: true,
      },
    ]
  }

  return [
    ...options,
    {
      value: trimmed,
      label: `${trimmed} (legacy)`,
      group: 'Legacy',
      disabled: true,
    },
  ]
}

export function resolveIcs205aContactDisplayLabels(
  row: Ics205aContactRow,
  input: Ics205aContactRowOptionsInput
): { assignedPosition: string; name: string } {
  const context = buildOptionsContext(input)
  const assignedPosition = row.assignedPosition.trim()
    ? formatWorkAssignmentTargetLabel(row.assignedPosition, input.roster, context)
    : ''

  let name = ''
  if (row.name.trim()) {
    if (isCustomIcs205aName(row.name)) {
      name = parseCustomIcs205aName(row.name)
    } else {
      name = formatWorkAssignmentTargetLabel(row.name, input.roster, context)
    }
  }

  return { assignedPosition, name }
}

export function resolveDefaultNameForAssignedPosition(
  assignedPositionValue: string,
  input: Ics205aContactRowOptionsInput
): string {
  const context = buildOptionsContext(input)
  const assigned = parseWorkAssignmentTarget(assignedPositionValue, input.roster, context)

  if (assigned.type === 'single_resource' && assigned.memberId) {
    return buildWorkAssignmentTarget({
      type: 'single_resource',
      memberId: assigned.memberId,
      roster: input.roster,
    }).value
  }

  if (assigned.type === 'org_chart_asset' && assigned.assetKey) {
    return buildWorkAssignmentTarget({
      type: 'org_chart_asset',
      assetKey: assigned.assetKey,
      roster: input.roster,
      assetsByKey: input.assetsByKey,
    }).value
  }

  return ''
}

export function contactRowHasContent(row: Ics205aContactRow): boolean {
  return (
    row.assignedPosition.trim().length > 0 ||
    row.name.trim().length > 0 ||
    row.cellPhone.trim().length > 0 ||
    row.radioFrequency.trim().length > 0 ||
    row.other.trim().length > 0
  )
}
