export type Ics213rrOrderPriority = 'U' | 'R'

export type ResourceRequestItem = {
  id: number
  mapLocation: [number, number]
  status: 'Pending' | 'Approved' | 'Filled' | 'Denied'
  incidentName: string
  dateTimeInitiated: string
  requestNumber: string
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
      return String(item.orderQuantity)
    case 'orderKind':
      return item.orderKind
    case 'orderType':
      return item.orderType
    case 'orderPriority':
      return getIcs213rrPriorityLabel(item.orderPriority)
    case 'orderDetailedDescription':
      return item.orderDetailedDescription
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

export const getResourceRequestSearchValues = (item: ResourceRequestItem) =>
  [
    item.incidentName,
    item.dateTimeInitiated,
    item.requestNumber,
    String(item.orderQuantity),
    item.orderKind,
    item.orderType,
    getIcs213rrPriorityLabel(item.orderPriority),
    item.orderDetailedDescription,
    item.orderRequestedReportingLocation,
    item.orderLocationDateTime,
    item.orderNumberLsc,
    item.orderEtaLsc,
    item.orderCostLsc,
    item.suggestedSourcesAndSubstitutes,
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
    text: 'U.S. Coast Guard · Department of Homeland Security · ICS 213RR-CG (07/25)',
  })

  pushHeading('1. Incident Name')
  pushParagraph(request.incidentName)

  pushHeading('2. Date/Time')
  pushParagraph(request.dateTimeInitiated)

  pushHeading('3. Resource Request Number')
  pushParagraph(request.requestNumber)

  pushHeading('4. Order')
  pushParagraph(`Quantity: ${request.orderQuantity}`)
  pushParagraph(`Kind: ${request.orderKind}`)
  pushParagraph(`Type: ${request.orderType}`)
  pushParagraph(`Priority: ${getIcs213rrPriorityLabel(request.orderPriority)}`)
  pushParagraph(`Detailed Item Description: ${request.orderDetailedDescription}`)
  pushParagraph(`Requested Reporting Location: ${request.orderRequestedReportingLocation}`)
  pushParagraph(`Location Date/Time: ${request.orderLocationDateTime}`)
  pushParagraph(`Order # (LSC): ${request.orderNumberLsc}`)
  pushParagraph(`ETA (LSC): ${request.orderEtaLsc}`)
  pushParagraph(`Cost (LSC): ${request.orderCostLsc}`)

  pushHeading('5. Suggested Source(s) of Supply and Suitable Substitutes')
  pushParagraph(request.suggestedSourcesAndSubstitutes)

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
  <div class="subtitle">U.S. Coast Guard · Department of Homeland Security · ICS 213RR-CG (07/25)</div>

  <h2>1. Incident Name</h2>
  <table>${fieldRow('Incident Name', request.incidentName)}</table>

  <h2>2. Date/Time</h2>
  <table>${fieldRow('Date/Time Initiated', request.dateTimeInitiated)}</table>

  <h2>3. Resource Request Number</h2>
  <table>${fieldRow('Resource Request Number', request.requestNumber)}</table>

  <h2>4. Order</h2>
  <table>
    ${fieldRow('a. Quantity', String(request.orderQuantity))}
    ${fieldRow('b. Kind', request.orderKind)}
    ${fieldRow('c. Type', request.orderType)}
    ${fieldRow('d. Priority', getIcs213rrPriorityLabel(request.orderPriority))}
    ${fieldRow('e. Detailed Item Description', request.orderDetailedDescription)}
    ${fieldRow('f. Requested Reporting Location', request.orderRequestedReportingLocation)}
    ${fieldRow('Location Date/Time', request.orderLocationDateTime)}
    ${fieldRow('g. Order # (LSC)', request.orderNumberLsc)}
    ${fieldRow('h. ETA (LSC)', request.orderEtaLsc)}
    ${fieldRow('i. Cost (LSC)', request.orderCostLsc)}
  </table>

  <h2>5. Suggested Source(s) of Supply and Suitable Substitutes</h2>
  <table>${fieldRow('Suggested Sources / Substitutes', request.suggestedSourcesAndSubstitutes)}</table>

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
]
