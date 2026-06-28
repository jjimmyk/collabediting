import { applyIcs215NeedRecalc, computeIcs215Need } from '@/features/ics215/ics215-work-assignments-table-shared'
import { resolveHaveDisplayValue } from '@/features/ics215/ics215-have-asset-link'
import type {
  Ics215NeedLinkRef,
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
  Ics215FormState,
} from '@/features/ics215/types'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'

export type Ics215NeedLinkLocation = {
  rowId: number
  columnId: string
  columnLabel: string
  assigneeKey: string
  assigneeLabel: string
  workAssignment: string
}

export type Ics215NeedCellContext = {
  rowId: number
  columnId: string
  columnLabel: string
  assigneeKey: string
  assigneeLabel: string
  workAssignment: string
  reportingLocation: string
  required: string
  have: string
  need: string
}

export function parseNumericNeedValue(required: string, have: string): number {
  const req = Number.parseFloat(required.trim())
  if (!Number.isFinite(req)) return 0
  const havRaw = resolveHaveDisplayValue({ required, have, need: '' })
  const hav = Number.parseFloat(havRaw.trim())
  const resolvedHave = Number.isFinite(hav) ? hav : 0
  return Math.max(0, req - resolvedHave)
}

export function isNeedLinkedToAssetRequest(value: Ics215ResourceValue | undefined): boolean {
  return Boolean(value?.linkedNeedAssetRequest?.assetRequestStorageRecordId?.trim())
}

export function resolveNeedDisplayValue(value: Ics215ResourceValue | undefined): string {
  if (!value) return ''
  if (isNeedLinkedToAssetRequest(value)) {
    return value.linkedNeedAssetRequest?.assetRequestNumber?.trim() ?? ''
  }
  return computeIcs215Need(value.required, resolveHaveDisplayValue(value))
}

export function canOpenNeedAssetRequest(value: Ics215ResourceValue | undefined): boolean {
  if (isNeedLinkedToAssetRequest(value)) return true
  return parseNumericNeedValue(value?.required ?? '', value?.have ?? '') > 0
}

export function normalizeIcs215NeedLinkRef(raw: unknown): Ics215NeedLinkRef | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const assetRequestStorageRecordId = String(record.assetRequestStorageRecordId ?? '').trim()
  const assetRequestNumber = String(record.assetRequestNumber ?? '').trim()
  const linkedAt = String(record.linkedAt ?? '').trim()
  if (!assetRequestStorageRecordId || !assetRequestNumber) return null
  return {
    assetRequestStorageRecordId,
    assetRequestNumber,
    linkedAt: linkedAt || new Date().toISOString(),
  }
}

export function normalizeNeedLinkFields(value: Ics215ResourceValue): Ics215ResourceValue {
  const linkedNeedAssetRequest = normalizeIcs215NeedLinkRef(value.linkedNeedAssetRequest)
  const needSource =
    value.needSource === 'linked-asset-request' || linkedNeedAssetRequest
      ? 'linked-asset-request'
      : 'computed'
  const next: Ics215ResourceValue = {
    ...value,
    linkedNeedAssetRequest,
    needSource,
  }
  if (linkedNeedAssetRequest) {
    return applyIcs215NeedRecalc(next)
  }
  return next
}

export function applyNeedAssetRequestLink(
  value: Ics215ResourceValue,
  request: Pick<ResourceRequestItem, 'storageRecordId' | 'requestNumber'>
): Ics215ResourceValue {
  const storageRecordId = request.storageRecordId?.trim()
  if (!storageRecordId) return value
  return normalizeNeedLinkFields({
    ...value,
    linkedNeedAssetRequest: {
      assetRequestStorageRecordId: storageRecordId,
      assetRequestNumber: request.requestNumber.trim(),
      linkedAt: new Date().toISOString(),
    },
    needSource: 'linked-asset-request',
  })
}

export function clearNeedAssetRequestLink(value: Ics215ResourceValue): Ics215ResourceValue {
  return normalizeNeedLinkFields({
    ...value,
    linkedNeedAssetRequest: null,
    needSource: 'computed',
  })
}

export function buildNeedLinkIndex(
  workAssignments: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[],
  resolveAssigneeLabel: (assigneeKey: string) => string,
  exclude?: { rowId: number; columnId: string }
): Map<string, Ics215NeedLinkLocation> {
  const columnLabelById = new Map(resourceColumns.map((column) => [column.id, column.label]))
  const index = new Map<string, Ics215NeedLinkLocation>()

  for (const row of workAssignments) {
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      if (exclude && exclude.rowId === row.id && exclude.columnId === columnId) continue
      const storageRecordId = value?.linkedNeedAssetRequest?.assetRequestStorageRecordId?.trim()
      if (!storageRecordId || index.has(storageRecordId)) continue
      index.set(storageRecordId, {
        rowId: row.id,
        columnId,
        columnLabel: columnLabelById.get(columnId) ?? columnId,
        assigneeKey: row.assignee,
        assigneeLabel: resolveAssigneeLabel(row.assignee),
        workAssignment: row.workAssignment,
      })
    }
  }

  return index
}

export function getConflictingNeedRequestIds(
  storageRecordId: string,
  dialogState: { rowId: number; columnId: string },
  index: Map<string, Ics215NeedLinkLocation>
): Ics215NeedLinkLocation[] {
  const trimmed = storageRecordId.trim()
  if (!trimmed) return []
  const location = index.get(trimmed)
  if (!location) return []
  if (location.rowId === dialogState.rowId && location.columnId === dialogState.columnId) {
    return []
  }
  return [location]
}

export function formatNeedLinkLocation(location: Ics215NeedLinkLocation): string {
  return `${location.assigneeLabel} · ${location.columnLabel}`
}

export function parseColumnLabelToKindType(columnLabel: string): { kind: string; type: string } {
  const trimmed = columnLabel.trim()
  if (!trimmed) return { kind: '', type: '' }
  const parts = trimmed.split(/\s*[·/|]\s*/).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { kind: parts[0] ?? trimmed, type: parts.slice(1).join(' · ') }
  }
  return { kind: trimmed, type: '' }
}

export function buildNeedCellContext(
  row: Ics215WorkAssignmentRow,
  columnId: string,
  columnLabel: string,
  assigneeLabel: string,
  value: Ics215ResourceValue
): Ics215NeedCellContext {
  const haveDisplay = resolveHaveDisplayValue(value)
  return {
    rowId: row.id,
    columnId,
    columnLabel,
    assigneeKey: row.assignee,
    assigneeLabel,
    workAssignment: row.workAssignment,
    reportingLocation: row.reportingLocation,
    required: value.required,
    have: haveDisplay,
    need: computeIcs215Need(value.required, haveDisplay),
  }
}

export function applyNeedAssetRequestLinkToWorkAssignmentsDraft(
  draft: { resourceColumns: Ics215ResourceColumn[]; workAssignments: Ics215WorkAssignmentRow[] },
  link: { rowId: number; columnId: string },
  request: Pick<ResourceRequestItem, 'storageRecordId' | 'requestNumber'>
): typeof draft {
  return {
    ...draft,
    workAssignments: draft.workAssignments.map((row) => {
      if (row.id !== link.rowId) return row
      return {
        ...row,
        resourceValues: Object.fromEntries(
          Object.entries(row.resourceValues ?? {}).map(([columnId, value]) => [
            columnId,
            columnId === link.columnId
              ? applyNeedAssetRequestLink(
                  value ?? { required: '', have: '', need: '' },
                  request
                )
              : value,
          ])
        ),
      }
    }),
  }
}

export function applyNeedAssetRequestLinkToForm(
  form: Ics215FormState,
  link: { rowId: number; columnId: string },
  request: Pick<ResourceRequestItem, 'storageRecordId' | 'requestNumber'>
): Ics215FormState {
  return {
    ...form,
    ...applyNeedAssetRequestLinkToWorkAssignmentsDraft(
      { resourceColumns: form.resourceColumns, workAssignments: form.workAssignments },
      link,
      request
    ),
  }
}
