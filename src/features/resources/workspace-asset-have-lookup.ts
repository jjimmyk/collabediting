import type { Ics215ResourceValue } from '@/features/ics215/types'
import type { Ics204ResourceRequirementRow } from '@/features/ics204/types'
import type { ResourceListItemData } from '@/features/resources/types'

export type AssetHaveMatchField = 'name' | 'type' | 'unitName' | 'unitType'

export type AssetHaveLookupOptions = {
  matchFields?: AssetHaveMatchField[]
  countMode?: 'asset-count' | 'quantity-sum'
  minQueryLength?: number
}

export type AssetHaveLookupResult = {
  have: string
  matchCount: number
  matchedAssetKeys: string[]
  query: string
}

const DEFAULT_MATCH_FIELDS: AssetHaveMatchField[] = ['name', 'type', 'unitName', 'unitType']

export function normalizeResourceNameQuery(query: string): string {
  return query.trim().toLowerCase()
}

function readAssetMatchField(asset: ResourceListItemData, field: AssetHaveMatchField): string {
  switch (field) {
    case 'name':
      return asset.name
    case 'type':
      return asset.type
    case 'unitName':
      return asset.unitName
    case 'unitType':
      return asset.unitType
    default:
      return ''
  }
}

export function assetMatchesResourceNameQuery(
  asset: ResourceListItemData,
  query: string,
  matchFields: AssetHaveMatchField[] = DEFAULT_MATCH_FIELDS
): boolean {
  const normalizedQuery = normalizeResourceNameQuery(query)
  if (normalizedQuery.length === 0) return false
  return matchFields.some((field) =>
    normalizeResourceNameQuery(readAssetMatchField(asset, field)).includes(normalizedQuery)
  )
}

export function countWorkspaceAssetsForResourceName(
  assets: ResourceListItemData[],
  resourceName: string,
  options: AssetHaveLookupOptions = {}
): number {
  const {
    matchFields = DEFAULT_MATCH_FIELDS,
    countMode = 'asset-count',
    minQueryLength = 2,
  } = options
  const query = resourceName.trim()
  if (query.length < minQueryLength) return 0

  const matched = assets.filter((asset) => assetMatchesResourceNameQuery(asset, query, matchFields))
  if (countMode === 'quantity-sum') {
    return matched.reduce((total, asset) => total + Math.max(0, asset.quantity || 0), 0)
  }
  return matched.length
}

export function formatHaveFromAssetCount(count: number): string {
  return String(count)
}

export function lookupHaveFromWorkspaceAssets(
  assets: ResourceListItemData[],
  resourceName: string,
  options: AssetHaveLookupOptions = {}
): AssetHaveLookupResult {
  const query = resourceName.trim()
  const matchCount = countWorkspaceAssetsForResourceName(assets, query, options)
  const matchedAssetKeys = assets
    .filter((asset) =>
      assetMatchesResourceNameQuery(
        asset,
        query,
        options.matchFields ?? DEFAULT_MATCH_FIELDS
      )
    )
    .map((asset) => asset.assetKey)

  return {
    have: formatHaveFromAssetCount(matchCount),
    matchCount,
    matchedAssetKeys,
    query,
  }
}

export function buildHaveFillTooltip(
  resourceName: string,
  matchCount: number,
  hasWorkspaceAssets: boolean
): string {
  const label = resourceName.trim() || 'resource'
  if (!hasWorkspaceAssets) {
    return 'Assign assets to this workspace to auto-fill Have.'
  }
  if (matchCount === 0) {
    return `No assigned workspace assets match “${label}”.`
  }
  return `Set Have to ${matchCount} based on workspace assets matching “${label}”.`
}

function parseNumericField(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function applyHaveWithOptionalNeedRecalc(
  value: Ics215ResourceValue,
  have: string
): Ics215ResourceValue {
  const next: Ics215ResourceValue = { ...value, have }
  const required = parseNumericField(next.required)
  const haveNumber = parseNumericField(next.have)
  if (required !== null && haveNumber !== null) {
    next.need = String(Math.max(0, required - haveNumber))
  }
  return next
}

export function applyHaveToResourceRequirement(
  requirement: Ics204ResourceRequirementRow,
  have: string
): Ics204ResourceRequirementRow {
  const next = { ...requirement, have }
  const required = parseNumericField(next.required)
  const haveNumber = parseNumericField(next.have)
  if (required !== null && haveNumber !== null) {
    next.need = String(Math.max(0, required - haveNumber))
  }
  return next
}

export type FillHaveOptions = {
  overwrite?: boolean
  onlyIfHaveEmpty?: boolean
  recalculateNeed?: boolean
  lookupOptions?: AssetHaveLookupOptions
}

export function shouldFillHaveValue(currentHave: string, options: FillHaveOptions): boolean {
  if (options.overwrite) return true
  if (options.onlyIfHaveEmpty ?? true) {
    return currentHave.trim().length === 0
  }
  return true
}

export function fillHaveForResourceValue(
  value: Ics215ResourceValue,
  resourceName: string,
  assets: ResourceListItemData[],
  options: FillHaveOptions = {}
): { value: Ics215ResourceValue; filled: boolean; lookup: AssetHaveLookupResult } {
  const lookup = lookupHaveFromWorkspaceAssets(assets, resourceName, options.lookupOptions)
  if (!shouldFillHaveValue(value.have, options)) {
    return { value, filled: false, lookup }
  }
  const nextValue = options.recalculateNeed ?? true
    ? applyHaveWithOptionalNeedRecalc(value, lookup.have)
    : { ...value, have: lookup.have }
  return { value: nextValue, filled: true, lookup }
}

export function fillHaveForResourceRequirementRow(
  requirement: Ics204ResourceRequirementRow,
  assets: ResourceListItemData[],
  options: FillHaveOptions = {}
): { requirement: Ics204ResourceRequirementRow; filled: boolean; lookup: AssetHaveLookupResult } {
  const lookup = lookupHaveFromWorkspaceAssets(assets, requirement.resource, options.lookupOptions)
  if (!shouldFillHaveValue(requirement.have, options)) {
    return { requirement, filled: false, lookup }
  }
  const nextRequirement =
    options.recalculateNeed ?? true
      ? applyHaveToResourceRequirement(requirement, lookup.have)
      : { ...requirement, have: lookup.have }
  return { requirement: nextRequirement, filled: true, lookup }
}
