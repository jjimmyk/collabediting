export type Ics213rrOrderPriority = 'U' | 'R'

export type AssetRequestTransferRef = {
  assetKey: string
  organizationAssetId: string
  name: string
  type: string
}

export type AssetRequestLineItem = {
  id: string
  quantity: number
  kind: string
  type: string
  priority: string
  detailedItemDescription: string
  requestedReportingLocation: string
  dateTime: string
  orderNumber: string
  estimatedTimeOfArrival: string
  costPerUnit: number | null
  totalCost: number | null
  suggestedSourcesOfSupplyAndSubstitutes: string
  assetsToTransfer: AssetRequestTransferRef[]
}

export type ResourceRequestItem = {
  id: number
  mapLocation: [number, number]
  status: 'Pending' | 'Approved' | 'Filled' | 'Denied'
  incidentName: string
  dateTimeInitiated: string
  requestNumber: string
  items: AssetRequestLineItem[]
  orderQuantity: number
  orderKind: string
  orderType: string
  orderPriority: Ics213rrOrderPriority
  orderDetailedDescription: string
  orderRequestedReportingLocation: string
  orderLocationDateTime: string
  orderNumberLsc: string
  orderEtaLsc: string
  orderCostLsc: string
  suggestedSourcesAndSubstitutes: string
  requestedByName: string
  requestedByPosition: string
  requestedByDateTime: string
  sectionChiefApprovalName: string
  sectionChiefApprovalPosition: string
  sectionChiefApprovalSignature: string
  sectionChiefApprovalDateTime: string
  reslTacticalResources: boolean
  reslResourceAvailable: boolean
  reslResourceNotAvailable: boolean
  reslReviewName: string
  reslReviewSignature: string
  reslReviewDateTime: string
  requisitionPurchaseOrderNumber: string
  supplierNamePhoneFaxEmail: string
  notes: string
  logisticsApprovalName: string
  logisticsApprovalPosition: string
  logisticsApprovalSignature: string
  logisticsApprovalDateTime: string
  orderPlacedBySpul: boolean
  orderPlacedByProc: boolean
  orderPlacedByOther: boolean
  orderPlacedByOtherText: string
  orderPlacedSignature: string
  orderPlacedDateTime: string
  financeReplyComments: string
  financeApprovalName: string
  financeApprovalPosition: string
  financeApprovalSignature: string
  financeApprovalDateTime: string
}

export type DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }

const checkboxLabel = (checked: boolean) => (checked ? '[X]' : '[ ]')

export const getIcs213rrPriorityLabel = (priority: Ics213rrOrderPriority) =>
  priority === 'U' ? 'Urgent (U)' : 'Routine (R)'

export const getLineItemPriorityLabel = (priority: string) => {
  if (priority === 'U') return 'Urgent (U)'
  if (priority === 'R') return 'Routine (R)'
  return priority.trim() || '—'
}

export const isStandardLineItemPriority = (priority: string): priority is Ics213rrOrderPriority =>
  priority === 'U' || priority === 'R'

export function createAssetRequestLineItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyAssetRequestLineItem(): AssetRequestLineItem {
  return {
    id: createAssetRequestLineItemId(),
    quantity: 1,
    kind: '',
    type: '',
    priority: 'R',
    detailedItemDescription: '',
    requestedReportingLocation: '',
    dateTime: '',
    orderNumber: '',
    estimatedTimeOfArrival: '',
    costPerUnit: null,
    totalCost: null,
    suggestedSourcesOfSupplyAndSubstitutes: '',
    assetsToTransfer: [],
  }
}

export function computeLineItemTotalCost(
  quantity: number,
  costPerUnit: number | null
): number | null {
  if (costPerUnit == null || !Number.isFinite(costPerUnit)) return null
  if (!Number.isFinite(quantity) || quantity < 1) return null
  return Math.round(quantity * costPerUnit * 100) / 100
}

export function formatLegacyOrderCostLsc(
  costPerUnit: number | null,
  totalCost: number | null
): string {
  const parts: string[] = []
  if (costPerUnit != null && Number.isFinite(costPerUnit)) {
    parts.push(`$${costPerUnit.toLocaleString()} per unit`)
  }
  if (totalCost != null && Number.isFinite(totalCost)) {
    parts.push(`$${totalCost.toLocaleString()} total`)
  }
  return parts.join('; ')
}

function lineItemFromLegacyFields(source: Partial<ResourceRequestItem>): AssetRequestLineItem {
  const priority =
    typeof source.orderPriority === 'string'
      ? source.orderPriority
      : source.orderPriority === 'U'
        ? 'U'
        : 'R'

  return {
    id: createAssetRequestLineItemId(),
    quantity:
      typeof source.orderQuantity === 'number' && Number.isFinite(source.orderQuantity)
        ? source.orderQuantity
        : 1,
    kind: source.orderKind ?? '',
    type: source.orderType ?? '',
    priority,
    detailedItemDescription: source.orderDetailedDescription ?? '',
    requestedReportingLocation: source.orderRequestedReportingLocation ?? '',
    dateTime: source.orderLocationDateTime ?? '',
    orderNumber: source.orderNumberLsc ?? '',
    estimatedTimeOfArrival: source.orderEtaLsc ?? '',
    costPerUnit: null,
    totalCost: null,
    suggestedSourcesOfSupplyAndSubstitutes: source.suggestedSourcesAndSubstitutes ?? '',
    assetsToTransfer: [],
  }
}

function normalizeAssetRequestLineItem(raw: Partial<AssetRequestLineItem>): AssetRequestLineItem {
  const quantity =
    typeof raw.quantity === 'number' && Number.isFinite(raw.quantity)
      ? Math.max(1, Math.round(raw.quantity))
      : 1
  const costPerUnit =
    typeof raw.costPerUnit === 'number' && Number.isFinite(raw.costPerUnit)
      ? raw.costPerUnit
      : null
  const totalCost =
    typeof raw.totalCost === 'number' && Number.isFinite(raw.totalCost)
      ? raw.totalCost
      : null

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : createAssetRequestLineItemId(),
    quantity,
    kind: String(raw.kind ?? '').trim(),
    type: String(raw.type ?? '').trim(),
    priority: String(raw.priority ?? 'R').trim() || 'R',
    detailedItemDescription: String(raw.detailedItemDescription ?? '').trim(),
    requestedReportingLocation: String(raw.requestedReportingLocation ?? '').trim(),
    dateTime: String(raw.dateTime ?? '').trim(),
    orderNumber: String(raw.orderNumber ?? '').trim(),
    estimatedTimeOfArrival: String(raw.estimatedTimeOfArrival ?? '').trim(),
    costPerUnit,
    totalCost,
    suggestedSourcesOfSupplyAndSubstitutes: String(
      raw.suggestedSourcesOfSupplyAndSubstitutes ?? ''
    ).trim(),
    assetsToTransfer: Array.isArray(raw.assetsToTransfer)
      ? raw.assetsToTransfer
          .filter(
            (ref): ref is AssetRequestTransferRef =>
              ref != null &&
              typeof ref === 'object' &&
              typeof (ref as AssetRequestTransferRef).assetKey === 'string' &&
              (ref as AssetRequestTransferRef).assetKey.trim().length > 0
          )
          .map((ref) => ({
            assetKey: ref.assetKey.trim(),
            organizationAssetId: String(ref.organizationAssetId ?? '').trim(),
            name: String(ref.name ?? '').trim(),
            type: String(ref.type ?? '').trim(),
          }))
      : [],
  }
}

export function syncLegacyOrderFieldsFromLineItems(
  items: AssetRequestLineItem[]
): Pick<
  ResourceRequestItem,
  | 'orderQuantity'
  | 'orderKind'
  | 'orderType'
  | 'orderPriority'
  | 'orderDetailedDescription'
  | 'orderRequestedReportingLocation'
  | 'orderLocationDateTime'
  | 'orderNumberLsc'
  | 'orderEtaLsc'
  | 'orderCostLsc'
  | 'suggestedSourcesAndSubstitutes'
> {
  const first = items[0]
  if (!first) {
    return {
      orderQuantity: 1,
      orderKind: '',
      orderType: '',
      orderPriority: 'R',
      orderDetailedDescription: '',
      orderRequestedReportingLocation: '',
      orderLocationDateTime: '',
      orderNumberLsc: '',
      orderEtaLsc: '',
      orderCostLsc: '',
      suggestedSourcesAndSubstitutes: '',
    }
  }

  return {
    orderQuantity: first.quantity,
    orderKind: first.kind,
    orderType: first.type,
    orderPriority: isStandardLineItemPriority(first.priority) ? first.priority : 'R',
    orderDetailedDescription: first.detailedItemDescription,
    orderRequestedReportingLocation: first.requestedReportingLocation,
    orderLocationDateTime: first.dateTime,
    orderNumberLsc: first.orderNumber,
    orderEtaLsc: first.estimatedTimeOfArrival,
    orderCostLsc: formatLegacyOrderCostLsc(first.costPerUnit, first.totalCost),
    suggestedSourcesAndSubstitutes: first.suggestedSourcesOfSupplyAndSubstitutes,
  }
}

export function normalizeResourceRequestItem(raw: Partial<ResourceRequestItem>): ResourceRequestItem {
  const items =
    Array.isArray(raw.items) && raw.items.length > 0
      ? raw.items.map((item) => normalizeAssetRequestLineItem(item))
      : [lineItemFromLegacyFields(raw)]

  const legacy = syncLegacyOrderFieldsFromLineItems(items)
  const mapLocation = Array.isArray(raw.mapLocation) ? raw.mapLocation : [0, 0]

  return {
    id: typeof raw.id === 'number' ? raw.id : 0,
    mapLocation: [
      typeof mapLocation[0] === 'number' ? mapLocation[0] : 0,
      typeof mapLocation[1] === 'number' ? mapLocation[1] : 0,
    ],
    status:
      raw.status === 'Approved' ||
      raw.status === 'Filled' ||
      raw.status === 'Denied' ||
      raw.status === 'Pending'
        ? raw.status
        : 'Pending',
    incidentName: String(raw.incidentName ?? '').trim(),
    dateTimeInitiated: String(raw.dateTimeInitiated ?? '').trim(),
    requestNumber: String(raw.requestNumber ?? '').trim(),
    items,
    ...legacy,
    requestedByName: String(raw.requestedByName ?? '').trim(),
    requestedByPosition: String(raw.requestedByPosition ?? '').trim(),
    requestedByDateTime: String(raw.requestedByDateTime ?? '').trim(),
    sectionChiefApprovalName: String(raw.sectionChiefApprovalName ?? '').trim(),
    sectionChiefApprovalPosition: String(raw.sectionChiefApprovalPosition ?? '').trim(),
    sectionChiefApprovalSignature: String(raw.sectionChiefApprovalSignature ?? '').trim(),
    sectionChiefApprovalDateTime: String(raw.sectionChiefApprovalDateTime ?? '').trim(),
    reslTacticalResources: Boolean(raw.reslTacticalResources),
    reslResourceAvailable: Boolean(raw.reslResourceAvailable),
    reslResourceNotAvailable: Boolean(raw.reslResourceNotAvailable),
    reslReviewName: String(raw.reslReviewName ?? '').trim(),
    reslReviewSignature: String(raw.reslReviewSignature ?? '').trim(),
    reslReviewDateTime: String(raw.reslReviewDateTime ?? '').trim(),
    requisitionPurchaseOrderNumber: String(raw.requisitionPurchaseOrderNumber ?? '').trim(),
    supplierNamePhoneFaxEmail: String(raw.supplierNamePhoneFaxEmail ?? '').trim(),
    notes: String(raw.notes ?? '').trim(),
    logisticsApprovalName: String(raw.logisticsApprovalName ?? '').trim(),
    logisticsApprovalPosition: String(raw.logisticsApprovalPosition ?? '').trim(),
    logisticsApprovalSignature: String(raw.logisticsApprovalSignature ?? '').trim(),
    logisticsApprovalDateTime: String(raw.logisticsApprovalDateTime ?? '').trim(),
    orderPlacedBySpul: Boolean(raw.orderPlacedBySpul),
    orderPlacedByProc: Boolean(raw.orderPlacedByProc),
    orderPlacedByOther: Boolean(raw.orderPlacedByOther),
    orderPlacedByOtherText: String(raw.orderPlacedByOtherText ?? '').trim(),
    orderPlacedSignature: String(raw.orderPlacedSignature ?? '').trim(),
    orderPlacedDateTime: String(raw.orderPlacedDateTime ?? '').trim(),
    financeReplyComments: String(raw.financeReplyComments ?? '').trim(),
    financeApprovalName: String(raw.financeApprovalName ?? '').trim(),
    financeApprovalPosition: String(raw.financeApprovalPosition ?? '').trim(),
    financeApprovalSignature: String(raw.financeApprovalSignature ?? '').trim(),
    financeApprovalDateTime: String(raw.financeApprovalDateTime ?? '').trim(),
  }
}

export function getResourceRequestLineItems(request: ResourceRequestItem): AssetRequestLineItem[] {
  if (Array.isArray(request.items) && request.items.length > 0) {
    return request.items
  }
  return [lineItemFromLegacyFields(request)]
}

export function getResourceRequestItemCount(request: ResourceRequestItem): number {
  return getResourceRequestLineItems(request).length
}

export function getResourceRequestTotalQuantity(request: ResourceRequestItem): number {
  return getResourceRequestLineItems(request).reduce((sum, item) => sum + item.quantity, 0)
}

export function getResourceRequestKindTypeSummary(request: ResourceRequestItem): string {
  const items = getResourceRequestLineItems(request)
  if (items.length === 0) return '—'
  const first = items[0]
  if (items.length === 1) {
    return `${first.kind || '—'} · ${first.type || '—'}`
  }
  const allSame = items.every((item) => item.kind === first.kind && item.type === first.type)
  if (allSame) {
    return `${first.kind || '—'} · ${first.type || '—'}`
  }
  return `${items.length} items (mixed)`
}

export function getResourceRequestPrioritySummary(request: ResourceRequestItem): string {
  const items = getResourceRequestLineItems(request)
  if (items.some((item) => item.priority === 'U')) {
    return getLineItemPriorityLabel('U')
  }
  if (items.every((item) => item.priority === 'R')) {
    return getLineItemPriorityLabel('R')
  }
  return 'Mixed'
}

export function getResourceRequestPrimaryDescription(request: ResourceRequestItem): string {
  const items = getResourceRequestLineItems(request)
  if (items.length === 1) {
    return items[0].detailedItemDescription || items[0].type || request.orderDetailedDescription
  }
  if (items.length > 1) {
    return `${items.length} requested items`
  }
  return request.orderDetailedDescription || request.orderType || 'Asset request'
}

export function toDatetimeLocalInputValue(stored: string): string {
  const trimmed = stored.trim()
  if (!trimmed) return ''

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4]}:${isoMatch[5]}`
  }

  const legacyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
  if (legacyMatch) {
    const month = legacyMatch[1].padStart(2, '0')
    const day = legacyMatch[2].padStart(2, '0')
    const year = legacyMatch[3]
    const hour = legacyMatch[4].padStart(2, '0')
    const minute = legacyMatch[5]
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  }

  return ''
}

export function fromDatetimeLocalInputValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return trimmed
  return formatResourceRequestDateTime(parsed)
}

export const getResourceRequestDocFilename = (request: ResourceRequestItem, extension: 'docx' | 'pdf') => {
  const safeIncident =
    request.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'Incident'
  const safeNumber =
    request.requestNumber.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || `RR-${request.id}`
  return `ICS-213RR-CG_${safeNumber}_${safeIncident}.${extension}`
}

export const getResourceRequestItemFieldValue = (item: ResourceRequestItem, field: string) => {
  switch (field) {
    case 'incidentName':
      return item.incidentName
    case 'dateTimeInitiated':
      return item.dateTimeInitiated
    case 'requestNumber':
      return item.requestNumber
    case 'orderQuantity':
      return String(getResourceRequestTotalQuantity(item))
    case 'orderKind':
    case 'orderType':
      return getResourceRequestKindTypeSummary(item)
    case 'orderPriority':
      return getResourceRequestPrioritySummary(item)
    case 'orderDetailedDescription':
      return getResourceRequestPrimaryDescription(item)
    case 'itemCount':
      return String(getResourceRequestItemCount(item))
    case 'orderRequestedReportingLocation':
      return item.orderRequestedReportingLocation
    case 'orderLocationDateTime':
      return item.orderLocationDateTime
    case 'orderNumberLsc':
      return item.orderNumberLsc
    case 'orderEtaLsc':
      return item.orderEtaLsc
    case 'orderCostLsc':
      return item.orderCostLsc
    case 'suggestedSourcesAndSubstitutes':
      return item.suggestedSourcesAndSubstitutes
    case 'requestedByName':
      return item.requestedByName
    case 'requestedByPosition':
      return item.requestedByPosition
    case 'requestedByDateTime':
      return item.requestedByDateTime
    case 'sectionChiefApprovalName':
      return item.sectionChiefApprovalName
    case 'sectionChiefApprovalPosition':
      return item.sectionChiefApprovalPosition
    case 'sectionChiefApprovalSignature':
      return item.sectionChiefApprovalSignature
    case 'sectionChiefApprovalDateTime':
      return item.sectionChiefApprovalDateTime
    case 'reslReviewName':
      return item.reslReviewName
    case 'reslReviewSignature':
      return item.reslReviewSignature
    case 'reslReviewDateTime':
      return item.reslReviewDateTime
    case 'requisitionPurchaseOrderNumber':
      return item.requisitionPurchaseOrderNumber
    case 'supplierNamePhoneFaxEmail':
      return item.supplierNamePhoneFaxEmail
    case 'notes':
      return item.notes
    case 'logisticsApprovalName':
      return item.logisticsApprovalName
    case 'logisticsApprovalPosition':
      return item.logisticsApprovalPosition
    case 'logisticsApprovalSignature':
      return item.logisticsApprovalSignature
    case 'logisticsApprovalDateTime':
      return item.logisticsApprovalDateTime
    case 'orderPlacedByOtherText':
      return item.orderPlacedByOtherText
    case 'orderPlacedSignature':
      return item.orderPlacedSignature
    case 'orderPlacedDateTime':
      return item.orderPlacedDateTime
    case 'financeReplyComments':
      return item.financeReplyComments
    case 'financeApprovalName':
      return item.financeApprovalName
    case 'financeApprovalPosition':
      return item.financeApprovalPosition
    case 'financeApprovalSignature':
      return item.financeApprovalSignature
    case 'financeApprovalDateTime':
      return item.financeApprovalDateTime
    case 'status':
      return item.status
    default:
      return ''
  }
}

export const getResourceRequestSearchValues = (item: ResourceRequestItem) => {
  const lineItems = getResourceRequestLineItems(item)
  const lineItemValues = lineItems.flatMap((lineItem) => [
    String(lineItem.quantity),
    lineItem.kind,
    lineItem.type,
    getLineItemPriorityLabel(lineItem.priority),
    lineItem.detailedItemDescription,
    lineItem.requestedReportingLocation,
    lineItem.dateTime,
    lineItem.orderNumber,
    lineItem.estimatedTimeOfArrival,
    lineItem.costPerUnit != null ? String(lineItem.costPerUnit) : '',
    lineItem.totalCost != null ? String(lineItem.totalCost) : '',
    lineItem.suggestedSourcesOfSupplyAndSubstitutes,
    ...lineItem.assetsToTransfer.flatMap((ref) => [ref.name, ref.type, ref.assetKey]),
  ])

  return [
    item.incidentName,
    item.dateTimeInitiated,
    item.requestNumber,
    ...lineItemValues,
    item.requestedByName,
    item.requestedByPosition,
    item.requestedByDateTime,
    item.sectionChiefApprovalName,
    item.sectionChiefApprovalPosition,
    item.sectionChiefApprovalSignature,
    item.sectionChiefApprovalDateTime,
    item.reslReviewName,
    item.reslReviewSignature,
    item.reslReviewDateTime,
    item.requisitionPurchaseOrderNumber,
    item.supplierNamePhoneFaxEmail,
    item.notes,
    item.logisticsApprovalName,
    item.logisticsApprovalPosition,
    item.logisticsApprovalSignature,
    item.logisticsApprovalDateTime,
    item.orderPlacedByOtherText,
    item.orderPlacedSignature,
    item.orderPlacedDateTime,
    item.financeReplyComments,
    item.financeApprovalName,
    item.financeApprovalPosition,
    item.financeApprovalSignature,
    item.financeApprovalDateTime,
    item.status,
  ].join(' ')
}

export function buildIcs213rrDocxBlocks(request: ResourceRequestItem): DocxBlock[] {
  const blocks: DocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'paragraph', text: trimmed })
  }

  blocks.push({ kind: 'title', text: 'Resource Request (ICS 213RR-CG)' })
  blocks.push({
    kind: 'subtitle',
    text: 'United States Coast Guard · Department of Homeland Security · ICS 213RR-CG (07/25)',
  })

  pushHeading('1. Incident Name')
  pushParagraph(request.incidentName)

  pushHeading('2. Date/Time')
  pushParagraph(request.dateTimeInitiated)

  pushHeading('3. Resource Request Number')
  pushParagraph(request.requestNumber)

  pushHeading('4. Order')
  const lineItems = getResourceRequestLineItems(request)
  lineItems.forEach((lineItem, index) => {
    if (lineItems.length > 1) {
      pushHeading(`4.${index + 1} Line Item ${index + 1}`)
    }
    pushParagraph(`Quantity: ${lineItem.quantity}`)
    pushParagraph(`Kind: ${lineItem.kind}`)
    pushParagraph(`Type: ${lineItem.type}`)
    pushParagraph(`Priority: ${getLineItemPriorityLabel(lineItem.priority)}`)
    pushParagraph(`Detailed Item Description: ${lineItem.detailedItemDescription}`)
    pushParagraph(`Requested Reporting Location: ${lineItem.requestedReportingLocation}`)
    pushParagraph(`Location Date/Time: ${lineItem.dateTime}`)
    pushParagraph(`Order # (LSC): ${lineItem.orderNumber}`)
    pushParagraph(`ETA (LSC): ${lineItem.estimatedTimeOfArrival}`)
    pushParagraph(
      `Cost (LSC): ${formatLegacyOrderCostLsc(lineItem.costPerUnit, lineItem.totalCost)}`
    )
    if (lineItem.assetsToTransfer.length > 0) {
      pushParagraph(
        `Asset(s) to Transfer: ${lineItem.assetsToTransfer.map((ref) => `${ref.name} (${ref.type})`).join(', ')}`
      )
    }
    if (lineItem.suggestedSourcesOfSupplyAndSubstitutes.trim()) {
      pushParagraph(
        `Suggested Source(s) of Supply and Suitable Substitutes: ${lineItem.suggestedSourcesOfSupplyAndSubstitutes}`
      )
    }
  })

  if (lineItems.length === 1 && lineItems[0].suggestedSourcesOfSupplyAndSubstitutes.trim()) {
    pushHeading('5. Suggested Source(s) of Supply and Suitable Substitutes')
    pushParagraph(lineItems[0].suggestedSourcesOfSupplyAndSubstitutes)
  } else if (lineItems.length > 1) {
    pushHeading('5. Suggested Source(s) of Supply and Suitable Substitutes')
    lineItems.forEach((lineItem, index) => {
      if (!lineItem.suggestedSourcesOfSupplyAndSubstitutes.trim()) return
      pushParagraph(
        `Line ${index + 1}: ${lineItem.suggestedSourcesOfSupplyAndSubstitutes}`
      )
    })
  } else {
    pushHeading('5. Suggested Source(s) of Supply and Suitable Substitutes')
    pushParagraph(request.suggestedSourcesAndSubstitutes)
  }

  pushHeading('6. Requested By')
  pushParagraph(`Name: ${request.requestedByName}`)
  pushParagraph(`Position: ${request.requestedByPosition}`)
  pushParagraph(`Date/Time: ${request.requestedByDateTime}`)

  pushHeading('7. Section Chief / Command Staff Approval')
  pushParagraph(`Name: ${request.sectionChiefApprovalName}`)
  pushParagraph(`Position: ${request.sectionChiefApprovalPosition}`)
  pushParagraph(`Signature: ${request.sectionChiefApprovalSignature}`)
  pushParagraph(`Date/Time: ${request.sectionChiefApprovalDateTime}`)

  pushHeading('8. RESL')
  pushParagraph(
    `${checkboxLabel(request.reslTacticalResources)} a. Tactical resources or personnel`
  )
  pushParagraph(`${checkboxLabel(request.reslResourceAvailable)} b. Resource available`)
  pushParagraph(`${checkboxLabel(request.reslResourceNotAvailable)} c. Resource not available`)

  pushHeading('9. RESL Review/Signature')
  pushParagraph(`Name: ${request.reslReviewName}`)
  pushParagraph(`Signature: ${request.reslReviewSignature}`)
  pushParagraph(`Date/Time: ${request.reslReviewDateTime}`)

  pushHeading('10. Requisition / Purchase Order #')
  pushParagraph(request.requisitionPurchaseOrderNumber)

  pushHeading('11. Supplier (Name/Phone/Fax/Email)')
  pushParagraph(request.supplierNamePhoneFaxEmail)

  pushHeading('12. Notes')
  pushParagraph(request.notes)

  pushHeading('13. Logistics Section Approval')
  pushParagraph(`Name: ${request.logisticsApprovalName}`)
  pushParagraph(`Position: ${request.logisticsApprovalPosition}`)
  pushParagraph(`Signature: ${request.logisticsApprovalSignature}`)
  pushParagraph(`Date/Time: ${request.logisticsApprovalDateTime}`)

  pushHeading('14. Order Placed By')
  pushParagraph(`${checkboxLabel(request.orderPlacedBySpul)} SPUL`)
  pushParagraph(`${checkboxLabel(request.orderPlacedByProc)} PROC`)
  pushParagraph(
    `${checkboxLabel(request.orderPlacedByOther)} Other${request.orderPlacedByOtherText ? `: ${request.orderPlacedByOtherText}` : ''}`
  )
  pushParagraph(`Signature: ${request.orderPlacedSignature}`)
  pushParagraph(`Date/Time: ${request.orderPlacedDateTime}`)

  pushHeading('15. Reply / Comments from Finance')
  pushParagraph(request.financeReplyComments)

  pushHeading('16. Finance Section Approval')
  pushParagraph(`Name: ${request.financeApprovalName}`)
  pushParagraph(`Position: ${request.financeApprovalPosition}`)
  pushParagraph(`Signature: ${request.financeApprovalSignature}`)
  pushParagraph(`Date/Time: ${request.financeApprovalDateTime}`)

  return blocks
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const fieldRow = (label: string, value: string) =>
  `<tr><td class="label">${escapeHtml(label)}</td><td>${escapeHtml(value || '—')}</td></tr>`

export function buildIcs213rrPrintHtml(request: ResourceRequestItem) {
  const orderPlacedBy = [
    request.orderPlacedBySpul ? 'SPUL' : null,
    request.orderPlacedByProc ? 'PROC' : null,
    request.orderPlacedByOther
      ? `Other${request.orderPlacedByOtherText ? `: ${request.orderPlacedByOtherText}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(', ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(getResourceRequestDocFilename(request, 'pdf'))}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; font-size: 12px; }
    h1 { font-size: 18px; margin: 0 0 4px; text-transform: uppercase; }
    h2 { font-size: 13px; margin: 18px 0 8px; color: #1F4E79; }
    .subtitle { font-size: 11px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td { border: 1px solid #bbb; padding: 6px 8px; vertical-align: top; }
    td.label { width: 34%; font-weight: 600; background: #f5f7fa; }
    .checkbox-line { margin: 4px 0; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Resource Request (ICS 213RR-CG)</h1>
  <div class="subtitle">United States Coast Guard · Department of Homeland Security · ICS 213RR-CG (07/25)</div>

  <h2>1. Incident Name</h2>
  <table>${fieldRow('Incident Name', request.incidentName)}</table>

  <h2>2. Date/Time</h2>
  <table>${fieldRow('Date/Time Initiated', request.dateTimeInitiated)}</table>

  <h2>3. Resource Request Number</h2>
  <table>${fieldRow('Resource Request Number', request.requestNumber)}</table>

  <h2>4. Order</h2>
  ${getResourceRequestLineItems(request)
    .map((lineItem, index, items) => {
      const title =
        items.length > 1
          ? `<h3 style="font-size:12px;margin:12px 0 6px;color:#1F4E79;">Line Item ${index + 1}</h3>`
          : ''
      return `${title}<table>
    ${fieldRow('a. Quantity', String(lineItem.quantity))}
    ${fieldRow('b. Kind', lineItem.kind)}
    ${fieldRow('c. Type', lineItem.type)}
    ${fieldRow('d. Priority', getLineItemPriorityLabel(lineItem.priority))}
    ${fieldRow('e. Detailed Item Description', lineItem.detailedItemDescription)}
    ${fieldRow('f. Requested Reporting Location', lineItem.requestedReportingLocation)}
    ${fieldRow('Location Date/Time', lineItem.dateTime)}
    ${fieldRow('g. Order # (LSC)', lineItem.orderNumber)}
    ${fieldRow('h. ETA (LSC)', lineItem.estimatedTimeOfArrival)}
    ${fieldRow('i. Cost (LSC)', formatLegacyOrderCostLsc(lineItem.costPerUnit, lineItem.totalCost))}
    ${fieldRow(
      'Asset(s) to Transfer',
      lineItem.assetsToTransfer.map((ref) => `${ref.name} (${ref.type})`).join(', ')
    )}
  </table>`
    })
    .join('')}

  <h2>5. Suggested Source(s) of Supply and Suitable Substitutes</h2>
  <table>${fieldRow(
    'Suggested Sources / Substitutes',
    getResourceRequestLineItems(request)
      .map((lineItem, index, items) =>
        items.length > 1
          ? `Line ${index + 1}: ${lineItem.suggestedSourcesOfSupplyAndSubstitutes}`
          : lineItem.suggestedSourcesOfSupplyAndSubstitutes
      )
      .filter(Boolean)
      .join(' · ')
  )}</table>

  <h2>6. Requested By</h2>
  <table>
    ${fieldRow('Name', request.requestedByName)}
    ${fieldRow('Position', request.requestedByPosition)}
    ${fieldRow('Date/Time', request.requestedByDateTime)}
  </table>

  <h2>7. Section Chief / Command Staff Approval</h2>
  <table>
    ${fieldRow('Name', request.sectionChiefApprovalName)}
    ${fieldRow('Position', request.sectionChiefApprovalPosition)}
    ${fieldRow('Signature', request.sectionChiefApprovalSignature)}
    ${fieldRow('Date/Time', request.sectionChiefApprovalDateTime)}
  </table>

  <h2>8. RESL</h2>
  <div class="checkbox-line">${checkboxLabel(request.reslTacticalResources)} a. Tactical resources or personnel</div>
  <div class="checkbox-line">${checkboxLabel(request.reslResourceAvailable)} b. Resource available</div>
  <div class="checkbox-line">${checkboxLabel(request.reslResourceNotAvailable)} c. Resource not available</div>

  <h2>9. RESL Review/Signature</h2>
  <table>
    ${fieldRow('Name', request.reslReviewName)}
    ${fieldRow('Signature', request.reslReviewSignature)}
    ${fieldRow('Date/Time', request.reslReviewDateTime)}
  </table>

  <h2>10. Requisition / Purchase Order #</h2>
  <table>${fieldRow('Requisition / Purchase Order #', request.requisitionPurchaseOrderNumber)}</table>

  <h2>11. Supplier (Name/Phone/Fax/Email)</h2>
  <table>${fieldRow('Supplier', request.supplierNamePhoneFaxEmail)}</table>

  <h2>12. Notes</h2>
  <table>${fieldRow('Notes', request.notes)}</table>

  <h2>13. Logistics Section Approval</h2>
  <table>
    ${fieldRow('Name', request.logisticsApprovalName)}
    ${fieldRow('Position', request.logisticsApprovalPosition)}
    ${fieldRow('Signature', request.logisticsApprovalSignature)}
    ${fieldRow('Date/Time', request.logisticsApprovalDateTime)}
  </table>

  <h2>14. Order Placed By</h2>
  <table>
    ${fieldRow('Order Placed By', orderPlacedBy || '—')}
    ${fieldRow('Signature', request.orderPlacedSignature)}
    ${fieldRow('Date/Time', request.orderPlacedDateTime)}
  </table>

  <h2>15. Reply / Comments from Finance</h2>
  <table>${fieldRow('Finance Reply / Comments', request.financeReplyComments)}</table>

  <h2>16. Finance Section Approval</h2>
  <table>
    ${fieldRow('Name', request.financeApprovalName)}
    ${fieldRow('Position', request.financeApprovalPosition)}
    ${fieldRow('Signature', request.financeApprovalSignature)}
    ${fieldRow('Date/Time', request.financeApprovalDateTime)}
  </table>
</body>
</html>`
}

export function printResourceRequestPdf(request: ResourceRequestItem) {
  const html = buildIcs213rrPrintHtml(request)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export const DEFAULT_ICS213RR_RESOURCE_REQUESTS: ResourceRequestItem[] = [
  {
    id: 1,
    mapLocation: [-122.7589, 48.862],
    status: 'Pending',
    incidentName: 'Cherry Point Refinery Fire — Process Unit Response',
    dateTimeInitiated: '05/09/2026 07:30',
    requestNumber: 'RR-2026-0142',
    items: [],
    orderQuantity: 2,
    orderKind: 'Teams',
    orderType: 'Industrial Firefighting Support',
    orderPriority: 'U',
    orderDetailedDescription:
      'Additional Northwest Regional Foam Strike Team units for crude processing unit perimeter cooling and high-expansion foam application at BP Cherry Point Refinery.',
    orderRequestedReportingLocation: 'BP Cherry Point Refinery — unified command staging',
    orderLocationDateTime: '05/09/2026 12:00 PST',
    orderNumberLsc: '',
    orderEtaLsc: '',
    orderCostLsc: '',
    suggestedSourcesAndSubstitutes:
      'Whatcom County Fire District 7 primary; Skagit County industrial mutual-aid roster as substitute.',
    requestedByName: 'John Smith',
    requestedByPosition: 'BP Cherry Point Operations Duty Manager',
    requestedByDateTime: '05/09/2026 07:30 PST',
    sectionChiefApprovalName: '',
    sectionChiefApprovalPosition: '',
    sectionChiefApprovalSignature: '',
    sectionChiefApprovalDateTime: '',
    reslTacticalResources: true,
    reslResourceAvailable: false,
    reslResourceNotAvailable: true,
    reslReviewName: '',
    reslReviewSignature: '',
    reslReviewDateTime: '',
    requisitionPurchaseOrderNumber: '',
    supplierNamePhoneFaxEmail: '',
    notes: 'Coordinate foam stock drawdown with refinery logistics before second team arrival.',
    logisticsApprovalName: '',
    logisticsApprovalPosition: '',
    logisticsApprovalSignature: '',
    logisticsApprovalDateTime: '',
    orderPlacedBySpul: false,
    orderPlacedByProc: false,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: '',
    orderPlacedDateTime: '',
    financeReplyComments: '',
    financeApprovalName: '',
    financeApprovalPosition: '',
    financeApprovalSignature: '',
    financeApprovalDateTime: '',
  },
  {
    id: 2,
    mapLocation: [-90.78, 27.53],
    status: 'Approved',
    incidentName: 'BP Mad Dog Process Area Gas Release',
    dateTimeInitiated: '05/09/2026 05:45',
    requestNumber: 'RR-2026-0143',
    items: [],
    orderQuantity: 1,
    orderKind: 'Teams',
    orderType: 'Process Safety Response',
    orderPriority: 'U',
    orderDetailedDescription:
      'BP CCMER field response team with portable gas detection and process area assessment capability for Mad Dog gas release monitoring.',
    orderRequestedReportingLocation: 'BP Mad Dog Platform — Green Canyon 782',
    orderLocationDateTime: '05/09/2026 09:00 CST',
    orderNumberLsc: 'ORD-88421',
    orderEtaLsc: '05/09/2026 08:30 CST',
    orderCostLsc: '$42,800',
    suggestedSourcesAndSubstitutes:
      'BP Westlake ERT primary; contract process safety consultant as backup if weather limits helicopter access.',
    requestedByName: 'C. Landry',
    requestedByPosition: 'BP CCMER Advisor on Duty',
    requestedByDateTime: '05/09/2026 05:45 CST',
    sectionChiefApprovalName: 'M. Hartman',
    sectionChiefApprovalPosition: 'Unified Command Incident Commander',
    sectionChiefApprovalSignature: 'M. Hartman',
    sectionChiefApprovalDateTime: '05/09/2026 06:10 CST',
    reslTacticalResources: true,
    reslResourceAvailable: false,
    reslResourceNotAvailable: true,
    reslReviewName: 'S. Ortiz',
    reslReviewSignature: 'S. Ortiz',
    reslReviewDateTime: '05/09/2026 06:45 CST',
    requisitionPurchaseOrderNumber: 'REQ-2026-1187',
    supplierNamePhoneFaxEmail: 'BP Emergency Response · (281) 555-0142 · gom-ert@example.bp.com',
    notes: 'BSEE District New Orleans copied on request; maintain gas monitoring logs for 24 hr.',
    logisticsApprovalName: 'M. Torres',
    logisticsApprovalPosition: 'BP Logistics Section Chief',
    logisticsApprovalSignature: 'M. Torres',
    logisticsApprovalDateTime: '05/09/2026 07:00 CST',
    orderPlacedBySpul: false,
    orderPlacedByProc: true,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: 'M. Torres',
    orderPlacedDateTime: '05/09/2026 07:15 CST',
    financeReplyComments: 'Approved under BP GOM emergency response cost center.',
    financeApprovalName: 'M. Patel',
    financeApprovalPosition: 'Finance Section Chief',
    financeApprovalSignature: 'M. Patel',
    financeApprovalDateTime: '05/09/2026 07:30 CST',
  },
  {
    id: 3,
    mapLocation: [-88.5, 28.3],
    status: 'Filled',
    incidentName: 'BP NaKika Production Curtailment Watch',
    dateTimeInitiated: '05/09/2026 06:30',
    requestNumber: 'RR-2026-0144',
    items: [],
    orderQuantity: 1,
    orderKind: 'Vessel',
    orderType: 'Marine Logistics Support',
    orderPriority: 'R',
    orderDetailedDescription:
      'Standby offshore vessel for NaKika export curtailment — equipment transfer and weather hold support during EDGAR approach.',
    orderRequestedReportingLocation: 'NaKika floating production hub — Mississippi Canyon 474',
    orderLocationDateTime: '05/09/2026 10:00 CST',
    orderNumberLsc: 'ORD-77302',
    orderEtaLsc: '05/09/2026 09:30 CST',
    orderCostLsc: '$18,600',
    suggestedSourcesAndSubstitutes:
      'M/V BP Responder primary; Gulf offshore supply vessel from Port Fourchon roster as substitute.',
    requestedByName: 'M. Torres',
    requestedByPosition: 'BP Marine Logistics Coordinator',
    requestedByDateTime: '05/09/2026 06:30 CST',
    sectionChiefApprovalName: 'M. Hartman',
    sectionChiefApprovalPosition: 'Unified Command Incident Commander',
    sectionChiefApprovalSignature: 'M. Hartman',
    sectionChiefApprovalDateTime: '05/09/2026 07:00 CST',
    reslTacticalResources: false,
    reslResourceAvailable: true,
    reslResourceNotAvailable: false,
    reslReviewName: 'K. Brooks',
    reslReviewSignature: 'K. Brooks',
    reslReviewDateTime: '05/09/2026 07:30 CST',
    requisitionPurchaseOrderNumber: 'PO-2026-5521',
    supplierNamePhoneFaxEmail: 'BP Marine Logistics · (985) 555-0198',
    notes: 'Vessel on station; export tanker loading suspended per EDGAR watch.',
    logisticsApprovalName: 'M. Torres',
    logisticsApprovalPosition: 'Logistics Unit Leader',
    logisticsApprovalSignature: 'M. Torres',
    logisticsApprovalDateTime: '05/09/2026 08:00 CST',
    orderPlacedBySpul: true,
    orderPlacedByProc: false,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: 'M. Torres',
    orderPlacedDateTime: '05/09/2026 08:15 CST',
    financeReplyComments: 'Routine marine logistics within pre-approved GOM weather response budget.',
    financeApprovalName: 'A. Ruiz',
    financeApprovalPosition: 'Finance Unit Leader',
    financeApprovalSignature: 'A. Ruiz',
    financeApprovalDateTime: '05/09/2026 08:30 CST',
  },
  {
    id: 4,
    mapLocation: [-122.7589, 48.862],
    status: 'Denied',
    incidentName: 'Cherry Point Refinery Fire — Process Unit Response',
    dateTimeInitiated: '05/09/2026 08:00',
    requestNumber: 'RR-2026-0145',
    items: [],
    orderQuantity: 1,
    orderKind: 'Vehicle',
    orderType: 'Mobile Command Post',
    orderPriority: 'R',
    orderDetailedDescription:
      'Additional mobile command post for Ferndale forward staging area communications redundancy.',
    orderRequestedReportingLocation: 'Grandview Rd — Ferndale forward staging',
    orderLocationDateTime: '05/09/2026 14:00 PST',
    orderNumberLsc: '',
    orderEtaLsc: '',
    orderCostLsc: '',
    suggestedSourcesAndSubstitutes:
      'Whatcom County OEM virtual bridge; existing Cherry Point refinery EOC footprint may satisfy requirement.',
    requestedByName: 'M. Patel',
    requestedByPosition: 'Finance/Administration Section Chief',
    requestedByDateTime: '05/09/2026 08:00 PST',
    sectionChiefApprovalName: 'M. Hartman',
    sectionChiefApprovalPosition: 'Unified Command Incident Commander',
    sectionChiefApprovalSignature: 'M. Hartman',
    sectionChiefApprovalDateTime: '05/09/2026 08:30 CST',
    reslTacticalResources: false,
    reslResourceAvailable: true,
    reslResourceNotAvailable: false,
    reslReviewName: 'P. Allen',
    reslReviewSignature: 'P. Allen',
    reslReviewDateTime: '05/09/2026 09:00 CST',
    requisitionPurchaseOrderNumber: '',
    supplierNamePhoneFaxEmail: '',
    notes: 'Request superseded by Cherry Point refinery EOC; alternate comms plan approved.',
    logisticsApprovalName: '',
    logisticsApprovalPosition: '',
    logisticsApprovalSignature: '',
    logisticsApprovalDateTime: '',
    orderPlacedBySpul: false,
    orderPlacedByProc: false,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: '',
    orderPlacedDateTime: '',
    financeReplyComments: 'Denied — duplicate capability already on incident.',
    financeApprovalName: 'M. Patel',
    financeApprovalPosition: 'Finance Section Chief',
    financeApprovalSignature: 'M. Patel',
    financeApprovalDateTime: '05/09/2026 09:30 CST',
  },
].map((item) => normalizeResourceRequestItem(item as unknown as Partial<ResourceRequestItem>))

export type CreateResourceRequestInput = Omit<ResourceRequestItem, 'id'>

export type CreateResourceRequestDefaults = {
  requestedByName?: string
  incidentName?: string
  mapLocation?: [number, number]
}

export function formatResourceRequestDateTime(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function generateResourceRequestNumber(existing: ResourceRequestItem[]): string {
  const year = new Date().getFullYear()
  const prefix = `RR-${year}-`
  let maxSequence = 0

  for (const item of existing) {
    const match = item.requestNumber.trim().match(/^RR-(\d{4})-(\d+)$/i)
    if (!match) continue
    if (Number(match[1]) !== year) continue
    maxSequence = Math.max(maxSequence, Number.parseInt(match[2], 10))
  }

  return `${prefix}${String(maxSequence + 1).padStart(4, '0')}`
}

export function nextResourceRequestId(existing: ResourceRequestItem[]): number {
  if (existing.length === 0) return 1
  return Math.max(...existing.map((item) => item.id)) + 1
}

export function createEmptyResourceRequestInput(
  defaults: CreateResourceRequestDefaults = {}
): CreateResourceRequestInput {
  const now = formatResourceRequestDateTime()
  const mapLocation = defaults.mapLocation ?? [0, 0]

  return {
    mapLocation,
    status: 'Pending',
    incidentName: defaults.incidentName ?? '',
    dateTimeInitiated: now,
    requestNumber: '',
    items: [createEmptyAssetRequestLineItem()],
    orderQuantity: 1,
    orderKind: '',
    orderType: '',
    orderPriority: 'R',
    orderDetailedDescription: '',
    orderRequestedReportingLocation: '',
    orderLocationDateTime: '',
    orderNumberLsc: '',
    orderEtaLsc: '',
    orderCostLsc: '',
    suggestedSourcesAndSubstitutes: '',
    requestedByName: defaults.requestedByName ?? '',
    requestedByPosition: '',
    requestedByDateTime: now,
    sectionChiefApprovalName: '',
    sectionChiefApprovalPosition: '',
    sectionChiefApprovalSignature: '',
    sectionChiefApprovalDateTime: '',
    reslTacticalResources: false,
    reslResourceAvailable: false,
    reslResourceNotAvailable: false,
    reslReviewName: '',
    reslReviewSignature: '',
    reslReviewDateTime: '',
    requisitionPurchaseOrderNumber: '',
    supplierNamePhoneFaxEmail: '',
    notes: '',
    logisticsApprovalName: '',
    logisticsApprovalPosition: '',
    logisticsApprovalSignature: '',
    logisticsApprovalDateTime: '',
    orderPlacedBySpul: false,
    orderPlacedByProc: false,
    orderPlacedByOther: false,
    orderPlacedByOtherText: '',
    orderPlacedSignature: '',
    orderPlacedDateTime: '',
    financeReplyComments: '',
    financeApprovalName: '',
    financeApprovalPosition: '',
    financeApprovalSignature: '',
    financeApprovalDateTime: '',
  }
}

export function validateAssetRequestLineItem(
  item: AssetRequestLineItem,
  index: number
): string | null {
  const label = `Item ${index + 1}`
  if (!item.kind.trim()) {
    return `${label}: Kind is required.`
  }
  if (!item.type.trim()) {
    return `${label}: Type is required.`
  }
  if (!item.detailedItemDescription.trim()) {
    return `${label}: Detailed description is required.`
  }
  if (!item.requestedReportingLocation.trim()) {
    return `${label}: Reporting location is required.`
  }
  if (!Number.isFinite(item.quantity) || item.quantity < 1) {
    return `${label}: Quantity must be at least 1.`
  }
  return null
}

export function validateCreateResourceRequestInput(
  input: CreateResourceRequestInput
): string | null {
  if (!input.incidentName.trim()) {
    return 'Incident name is required.'
  }
  if (!input.requestedByName.trim()) {
    return 'Requested by name is required.'
  }
  const items = Array.isArray(input.items) ? input.items : []
  if (items.length === 0) {
    return 'Add at least one requested item.'
  }
  for (let index = 0; index < items.length; index += 1) {
    const lineError = validateAssetRequestLineItem(items[index], index)
    if (lineError) return lineError
  }
  return null
}

function normalizeCreateLineItems(items: AssetRequestLineItem[]): AssetRequestLineItem[] {
  return items.map((item) => {
    const normalized = normalizeAssetRequestLineItem(item)
    const totalCost =
      normalized.totalCost ??
      computeLineItemTotalCost(normalized.quantity, normalized.costPerUnit)
    return {
      ...normalized,
      totalCost,
    }
  })
}

export function buildResourceRequestFromInput(
  input: CreateResourceRequestInput,
  params: { id: number; requestNumber: string }
): ResourceRequestItem {
  const items = normalizeCreateLineItems(
    Array.isArray(input.items) && input.items.length > 0
      ? input.items
      : [createEmptyAssetRequestLineItem()]
  )
  const legacy = syncLegacyOrderFieldsFromLineItems(items)

  return normalizeResourceRequestItem({
    id: params.id,
    mapLocation: input.mapLocation ?? [0, 0],
    status: input.status ?? 'Pending',
    incidentName: input.incidentName.trim(),
    dateTimeInitiated: input.dateTimeInitiated.trim() || formatResourceRequestDateTime(),
    requestNumber: params.requestNumber,
    items,
    ...legacy,
    requestedByName: input.requestedByName.trim(),
    requestedByPosition: input.requestedByPosition.trim(),
    requestedByDateTime: input.requestedByDateTime.trim() || formatResourceRequestDateTime(),
    sectionChiefApprovalName: input.sectionChiefApprovalName.trim(),
    sectionChiefApprovalPosition: input.sectionChiefApprovalPosition.trim(),
    sectionChiefApprovalSignature: input.sectionChiefApprovalSignature.trim(),
    sectionChiefApprovalDateTime: input.sectionChiefApprovalDateTime.trim(),
    reslTacticalResources: input.reslTacticalResources,
    reslResourceAvailable: input.reslResourceAvailable,
    reslResourceNotAvailable: input.reslResourceNotAvailable,
    reslReviewName: input.reslReviewName.trim(),
    reslReviewSignature: input.reslReviewSignature.trim(),
    reslReviewDateTime: input.reslReviewDateTime.trim(),
    requisitionPurchaseOrderNumber: input.requisitionPurchaseOrderNumber.trim(),
    supplierNamePhoneFaxEmail: input.supplierNamePhoneFaxEmail.trim(),
    notes: input.notes.trim(),
    logisticsApprovalName: input.logisticsApprovalName.trim(),
    logisticsApprovalPosition: input.logisticsApprovalPosition.trim(),
    logisticsApprovalSignature: input.logisticsApprovalSignature.trim(),
    logisticsApprovalDateTime: input.logisticsApprovalDateTime.trim(),
    orderPlacedBySpul: input.orderPlacedBySpul,
    orderPlacedByProc: input.orderPlacedByProc,
    orderPlacedByOther: input.orderPlacedByOther,
    orderPlacedByOtherText: input.orderPlacedByOtherText.trim(),
    orderPlacedSignature: input.orderPlacedSignature.trim(),
    orderPlacedDateTime: input.orderPlacedDateTime.trim(),
    financeReplyComments: input.financeReplyComments.trim(),
    financeApprovalName: input.financeApprovalName.trim(),
    financeApprovalPosition: input.financeApprovalPosition.trim(),
    financeApprovalSignature: input.financeApprovalSignature.trim(),
    financeApprovalDateTime: input.financeApprovalDateTime.trim(),
  })
}
