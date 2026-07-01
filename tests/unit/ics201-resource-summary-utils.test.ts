import { describe, expect, it } from 'vitest'
import { HUB_ASSET_CATALOG } from '@/data/hub-asset-catalog'
import {
  createIcs201ResourceRowFromAsset,
  ics201ResourceLabelsFromAsset,
  normalizeIcs201ResourceSummaryRow,
  refreshIcs201ResourceDenormalizedFields,
  resolveIcs201ResourceSnapshot,
} from '@/features/ics201/resource-summary-utils'
import type { ResourceListItemData } from '@/features/resources/types'

function sampleAsset(overrides: Partial<ResourceListItemData> = {}): ResourceListItemData {
  const base = HUB_ASSET_CATALOG[0]
  return {
    ...base,
    mapLocation: [...base.mapLocation] as [number, number],
    deploymentKind: 'incident',
    assignedWorkspaceId: null,
    assignedWorkspaceKind: null,
    assignedIncidentName: null,
    assignedExerciseName: null,
    orgChartReportsTo: null,
    orgChartSortOrder: 0,
    ics204DocumentId: null,
    pointOfContactMemberId: null,
    assetCheckInStatus: null,
    competencyFunction: null,
    ...overrides,
  }
}

describe('ics201ResourceLabelsFromAsset', () => {
  it('maps type and hull/tail number to ICS-201 columns', () => {
    const asset = sampleAsset({
      type: 'Medium Endurance Cutter (WMEC)',
      name: 'CGC Forward',
      hullTailNumber: 'WMEC-911',
      unitName: 'USCGC Forward (WMEC-911)',
    })
    expect(ics201ResourceLabelsFromAsset(asset)).toEqual({
      resource: 'Medium Endurance Cutter (WMEC)',
      resourceIdentifier: 'WMEC-911',
    })
  })
})

describe('createIcs201ResourceRowFromAsset', () => {
  it('builds a linked row with empty local fields', () => {
    const asset = sampleAsset({ assetKey: 'cgc-forward', id: 42 })
    const row = createIcs201ResourceRowFromAsset(7, asset)
    expect(row).toMatchObject({
      id: 7,
      assetKey: 'cgc-forward',
      resourceId: 42,
      resource: asset.type,
      resourceIdentifier: asset.hullTailNumber,
      dateTimeOrdered: '',
      eta: '',
      onScene: false,
      notes: '',
    })
    expect(row.resourceSnapshot?.assetKey).toBe('cgc-forward')
  })
})

describe('resolveIcs201ResourceSnapshot', () => {
  it('prefers stored snapshot when live catalog is unavailable', () => {
    const asset = sampleAsset({ assetKey: 'stored', name: 'Stored Name' })
    const row = createIcs201ResourceRowFromAsset(1, asset)
    const resolved = resolveIcs201ResourceSnapshot(row)
    expect(resolved.name).toBe('Stored Name')
  })

  it('prefers live catalog over stored snapshot when assetsByKey is provided', () => {
    const asset = sampleAsset({ assetKey: 'stored', name: 'Stored Name' })
    const row = createIcs201ResourceRowFromAsset(1, asset)
    const liveAsset = sampleAsset({ assetKey: 'stored', name: 'Live Name' })
    const resolved = resolveIcs201ResourceSnapshot(row, { stored: liveAsset })
    expect(resolved.name).toBe('Live Name')
  })

  it('falls back to live catalog by assetKey', () => {
    const asset = sampleAsset({ assetKey: 'live-key', name: 'Live Asset' })
    const row = normalizeIcs201ResourceSummaryRow({
      id: 1,
      assetKey: 'live-key',
      resourceId: asset.id,
      resourceSnapshot: null,
      resource: '',
      resourceIdentifier: '',
      dateTimeOrdered: '',
      eta: '',
      onScene: false,
      notes: '',
    })
    const resolved = resolveIcs201ResourceSnapshot(row, { 'live-key': asset })
    expect(resolved.name).toBe('Live Asset')
  })

  it('builds legacy snapshot from text-only row', () => {
    const row = normalizeIcs201ResourceSummaryRow({
      id: 3,
      resource: 'USAR',
      resourceIdentifier: 'Team Alpha',
      dateTimeOrdered: '',
      eta: '',
      onScene: false,
      notes: 'Staged',
    })
    const resolved = resolveIcs201ResourceSnapshot(row)
    expect(resolved.type).toBe('USAR')
    expect(resolved.unitName).toBe('Team Alpha')
    expect(resolved.notes).toBe('Staged')
  })
})

describe('normalizeIcs201ResourceSummaryRow', () => {
  it('adds null asset fields for legacy rows', () => {
    const row = normalizeIcs201ResourceSummaryRow({
      id: 1,
      resource: 'Medical',
      resourceIdentifier: 'Strike Team',
      dateTimeOrdered: '08:00',
      eta: '09:00',
      onScene: true,
      notes: 'On route',
    })
    expect(row.assetKey).toBeNull()
    expect(row.resourceId).toBeNull()
    expect(row.resourceSnapshot).toBeNull()
  })
})

describe('refreshIcs201ResourceDenormalizedFields', () => {
  it('updates labels when catalog asset changes', () => {
    const asset = sampleAsset({
      assetKey: 'updated-key',
      type: 'Helicopter',
      hullTailNumber: 'CG-6012',
    })
    const row = createIcs201ResourceRowFromAsset(1, asset)
    const updatedAsset = { ...asset, type: 'Rotary Wing', hullTailNumber: 'CG-9999' }
    const refreshed = refreshIcs201ResourceDenormalizedFields(row, {
      'updated-key': updatedAsset,
    })
    expect(refreshed.resource).toBe('Rotary Wing')
    expect(refreshed.resourceIdentifier).toBe('CG-9999')
  })

  it('leaves legacy rows unchanged', () => {
    const row = normalizeIcs201ResourceSummaryRow({
      id: 1,
      resource: 'Manual',
      resourceIdentifier: 'Entry',
      dateTimeOrdered: '',
      eta: '',
      onScene: false,
      notes: '',
    })
    expect(refreshIcs201ResourceDenormalizedFields(row)).toEqual(row)
  })
})
