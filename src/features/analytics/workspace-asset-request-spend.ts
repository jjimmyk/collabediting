import {
  formatAssetRequestNeedLinkAssignee,
  hasAssetRequestNeedLink,
} from '@/lib/asset-request-ics215-need-link-display'
import {
  computeLineItemTotalCost,
  getResourceRequestLineItems,
  type AssetRequestLineItem,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type WorkspaceAssetRequestSpendRow = {
  rowKey: string
  requestId: number
  requestStorageRecordId?: string
  requestNumber: string
  requestStatus: ResourceRequestItem['status']
  lineItemIndex: number
  description: string
  quantity: number
  costPerUnit: number | null
  totalCost: number | null
  resolvedTotalCost: number | null
  totalCostIsDerived: boolean
  lastUpdatedAt: string | null
  lastUpdatedAtDate: Date | null
  assignee: string | null
  hasNeedLink: boolean
}

export type WorkspaceAssetRequestSpendSummary = {
  totalSpend: number
  pricedRowCount: number
  unpricedRowCount: number
  totalQuantity: number
}

export type WorkspaceAssetRequestSpendDayBucket = {
  dateKey: string
  dateLabel: string
  totalSpend: number
  rowCount: number
}

function parseFilterDate(value: string): Date | null {
  if (!value.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseStoredDateTime(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (isoMatch) {
    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const legacyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
  if (legacyMatch) {
    const month = legacyMatch[1].padStart(2, '0')
    const day = legacyMatch[2].padStart(2, '0')
    const year = legacyMatch[3]
    const hour = legacyMatch[4].padStart(2, '0')
    const minute = legacyMatch[5]
    const parsed = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function resolveLineItemSpendAmount(item: AssetRequestLineItem): number | null {
  if (typeof item.totalCost === 'number' && Number.isFinite(item.totalCost)) {
    return item.totalCost
  }
  return computeLineItemTotalCost(item.quantity, item.costPerUnit)
}

export function resolveSpendRowLastUpdatedAt(
  request: ResourceRequestItem,
  lineItem: AssetRequestLineItem
): { iso: string | null; date: Date | null } {
  const candidates = [request.recordUpdatedAt, request.recordCreatedAt, lineItem.dateTime]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue
    const date = parseStoredDateTime(candidate)
    if (date) {
      return { iso: candidate.trim(), date }
    }
  }
  return { iso: null, date: null }
}

export function resolveSpendRowAssignee(
  request: ResourceRequestItem,
  workspaceId: string,
  roster: WorkspaceRosterMember[] = []
): string | null {
  const link = request.ics215NeedLink
  if (!hasAssetRequestNeedLink(request) || !link) return null
  if (link.workspaceId.trim() !== workspaceId.trim()) return null
  return formatAssetRequestNeedLinkAssignee(link, roster)
}

function buildLineItemDescription(item: AssetRequestLineItem): string {
  const parts = [item.kind, item.type, item.detailedItemDescription].map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Requested item'
}

export function flattenWorkspaceAssetRequestSpendRows(
  requests: ResourceRequestItem[],
  workspaceId: string,
  roster: WorkspaceRosterMember[] = []
): WorkspaceAssetRequestSpendRow[] {
  const normalizedWorkspaceId = workspaceId.trim()
  if (!normalizedWorkspaceId) return []

  const rows: WorkspaceAssetRequestSpendRow[] = []

  for (const request of requests) {
    if (request.sourceWorkspaceId?.trim() !== normalizedWorkspaceId) continue

    const lineItems = getResourceRequestLineItems(request)
    const assignee = resolveSpendRowAssignee(request, normalizedWorkspaceId, roster)
    const hasNeedLink = assignee !== null
    const rowIdPrefix = request.storageRecordId?.trim() || String(request.id)

    lineItems.forEach((lineItem, lineItemIndex) => {
      const resolvedTotalCost = resolveLineItemSpendAmount(lineItem)
      const totalCostIsDerived =
        resolvedTotalCost !== null &&
        !(
          typeof lineItem.totalCost === 'number' &&
          Number.isFinite(lineItem.totalCost)
        )
      const { iso: lastUpdatedAt, date: lastUpdatedAtDate } = resolveSpendRowLastUpdatedAt(
        request,
        lineItem
      )

      rows.push({
        rowKey: `${rowIdPrefix}::${lineItem.id}`,
        requestId: request.id,
        requestStorageRecordId: request.storageRecordId,
        requestNumber: request.requestNumber.trim() || '—',
        requestStatus: request.status,
        lineItemIndex,
        description: buildLineItemDescription(lineItem),
        quantity: lineItem.quantity,
        costPerUnit: lineItem.costPerUnit,
        totalCost: lineItem.totalCost,
        resolvedTotalCost,
        totalCostIsDerived,
        lastUpdatedAt,
        lastUpdatedAtDate,
        assignee,
        hasNeedLink,
      })
    })
  }

  return rows.sort((a, b) => {
    const aTime = a.lastUpdatedAtDate?.getTime() ?? 0
    const bTime = b.lastUpdatedAtDate?.getTime() ?? 0
    if (bTime !== aTime) return bTime - aTime
    return a.requestNumber.localeCompare(b.requestNumber)
  })
}

export function filterSpendRowsByDateRange(
  rows: WorkspaceAssetRequestSpendRow[],
  startTime: string,
  endTime: string
): WorkspaceAssetRequestSpendRow[] {
  const start = parseFilterDate(startTime)
  const end = parseFilterDate(endTime)

  return rows.filter((row) => {
    if (!row.lastUpdatedAtDate) {
      return !start && !end
    }

    if (start && row.lastUpdatedAtDate < start) {
      return false
    }

    if (end && row.lastUpdatedAtDate > end) {
      return false
    }

    return true
  })
}

export function aggregateWorkspaceSpendSummary(
  rows: WorkspaceAssetRequestSpendRow[]
): WorkspaceAssetRequestSpendSummary {
  let totalSpend = 0
  let pricedRowCount = 0
  let unpricedRowCount = 0
  let totalQuantity = 0

  for (const row of rows) {
    totalQuantity += row.quantity
    if (row.resolvedTotalCost === null) {
      unpricedRowCount += 1
      continue
    }
    pricedRowCount += 1
    totalSpend += row.resolvedTotalCost
  }

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    pricedRowCount,
    unpricedRowCount,
    totalQuantity,
  }
}

function formatDayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

export function aggregateWorkspaceSpendByDay(
  rows: WorkspaceAssetRequestSpendRow[]
): WorkspaceAssetRequestSpendDayBucket[] {
  const buckets = new Map<string, WorkspaceAssetRequestSpendDayBucket>()

  for (const row of rows) {
    if (row.resolvedTotalCost === null || !row.lastUpdatedAtDate) continue

    const dateKey = formatDayKey(row.lastUpdatedAtDate)
    const existing = buckets.get(dateKey)
    if (existing) {
      existing.totalSpend += row.resolvedTotalCost
      existing.rowCount += 1
      continue
    }

    buckets.set(dateKey, {
      dateKey,
      dateLabel: formatDayLabel(row.lastUpdatedAtDate),
      totalSpend: row.resolvedTotalCost,
      rowCount: 1,
    })
  }

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      totalSpend: Math.round(bucket.totalSpend * 100) / 100,
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

export function formatWorkspaceSpendCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `$${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`
  }

  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`
  }

  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatWorkspaceSpendCurrencyExact(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatWorkspaceSpendDateTime(value: string | null): string {
  if (!value?.trim()) return '—'
  const parsed = parseStoredDateTime(value)
  if (!parsed) return value
  return parsed.toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
