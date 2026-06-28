import type { AssetRequestIcs215NeedLink } from '@/lib/ics-213rr-resource-request'
import type { Ics215NeedCellContext } from '@/features/ics215/ics215-need-asset-request-link'
import { parseColumnLabelToKindType } from '@/features/ics215/ics215-need-asset-request-link'
import {
  createEmptyAssetRequestLineItem,
  type AssetRequestLineItem,
  type CreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'

export type AssetRequestNeedSeed = {
  needContext: Ics215NeedCellContext
  workspaceId: string
}

export function buildIcs215NeedLinkFromContext(
  context: Ics215NeedCellContext,
  workspaceId: string
): AssetRequestIcs215NeedLink {
  return {
    workspaceId,
    rowId: context.rowId,
    columnId: context.columnId,
    assigneeKey: context.assigneeKey,
    columnLabel: context.columnLabel,
    workAssignment: context.workAssignment,
    reportingLocation: context.reportingLocation,
  }
}

export function buildPrefilledLineItemFromNeedContext(
  context: Ics215NeedCellContext
): AssetRequestLineItem {
  const { kind, type } = parseColumnLabelToKindType(context.columnLabel)
  const quantityRaw = Number.parseFloat(context.need.trim())
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1
  const descriptionParts = [context.workAssignment.trim(), context.columnLabel.trim()].filter(Boolean)

  return {
    ...createEmptyAssetRequestLineItem(),
    kind,
    type,
    quantity,
    detailedItemDescription: descriptionParts.join(' — ') || context.columnLabel,
    requestedReportingLocation: context.reportingLocation.trim() || 'TBD',
  }
}

export function applyNeedSeedToCreateInput(
  input: CreateResourceRequestInput,
  seed: AssetRequestNeedSeed
): CreateResourceRequestInput {
  const lineItem = buildPrefilledLineItemFromNeedContext(seed.needContext)
  return {
    ...input,
    items: [lineItem],
    ics215NeedLink: buildIcs215NeedLinkFromContext(seed.needContext, seed.workspaceId),
  }
}
