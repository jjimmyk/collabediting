import { Badge } from '@/components/ui/badge'
import {
  formatLegacyOrderCostLsc,
  getLineItemPriorityLabel,
  getResourceRequestLineItems,
  type AssetRequestLineItem,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium">{label}:</span> {value.trim() || '—'}
    </p>
  )
}

function AssetRequestLineItemDetail({ item, index }: { item: AssetRequestLineItem; index: number }) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/10 p-3 text-xs">
      <p className="font-semibold text-muted-foreground">Line item {index + 1}</p>
      <div className="grid grid-cols-2 gap-2">
        <DetailField label="Quantity" value={String(item.quantity)} />
        <DetailField label="Priority" value={getLineItemPriorityLabel(item.priority)} />
        <DetailField label="Kind" value={item.kind} />
        <DetailField label="Type" value={item.type} />
        <DetailField label="Order number" value={item.orderNumber} />
        <DetailField label="Date/time" value={item.dateTime} />
        <DetailField label="ETA" value={item.estimatedTimeOfArrival} />
        <DetailField
          label="Cost"
          value={formatLegacyOrderCostLsc(item.costPerUnit, item.totalCost)}
        />
        <p className="col-span-2">
          <span className="font-medium">Description:</span> {item.detailedItemDescription || '—'}
        </p>
        <p className="col-span-2">
          <span className="font-medium">Reporting location:</span>{' '}
          {item.requestedReportingLocation || '—'}
        </p>
        <p className="col-span-2">
          <span className="font-medium">Suggested sources:</span>{' '}
          {item.suggestedSourcesOfSupplyAndSubstitutes || '—'}
        </p>
      </div>
      {item.assetsToTransfer.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs font-medium">Assets to transfer:</span>
          {item.assetsToTransfer.map((ref) => (
            <Badge key={ref.assetKey} variant="outline" className="text-[10px]">
              {ref.name} · {ref.type}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AssetRequestDetailPanel({ request }: { request: ResourceRequestItem }) {
  const lineItems = getResourceRequestLineItems(request)

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <DetailField label="Incident" value={request.incidentName} />
        <DetailField label="Date/time initiated" value={request.dateTimeInitiated} />
        <DetailField label="Request number" value={request.requestNumber} />
        <DetailField label="Status" value={request.status} />
        <DetailField label="Requested by" value={request.requestedByName} />
        <DetailField label="Position" value={request.requestedByPosition} />
        <DetailField label="Requested date/time" value={request.requestedByDateTime} />
        <DetailField label="Items" value={String(lineItems.length)} />
        <p className="col-span-2">
          <span className="font-medium">Notes:</span> {request.notes || '—'}
        </p>
      </div>
      <div className="space-y-2">
        {lineItems.map((item, index) => (
          <AssetRequestLineItemDetail key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}
