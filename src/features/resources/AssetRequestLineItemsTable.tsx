import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrganizationAssetPickerPopover } from '@/features/resources/OrganizationAssetPickerPopover'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  computeLineItemTotalCost,
  fromDatetimeLocalInputValue,
  isStandardLineItemPriority,
  toDatetimeLocalInputValue,
  type AssetRequestLineItem,
} from '@/lib/ics-213rr-resource-request'
import { Trash2 } from 'lucide-react'

type AssetRequestLineItemsTableProps = {
  items: AssetRequestLineItem[]
  onChangeItem: (index: number, next: AssetRequestLineItem) => void
  onRemoveItem: (index: number) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
}

export function AssetRequestLineItemsTable({
  items,
  onChangeItem,
  onRemoveItem,
  organizationAssets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
}: AssetRequestLineItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[3000px] border-collapse text-xs">
        <thead>
          <tr className="sticky top-0 z-10 border-b bg-muted/30 text-left text-muted-foreground">
            <th className="sticky left-0 z-20 bg-muted/30 px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">Qty</th>
            <th className="min-w-[7rem] px-2 py-2 font-semibold">Kind</th>
            <th className="min-w-[7rem] px-2 py-2 font-semibold">Type</th>
            <th className="min-w-[8rem] px-2 py-2 font-semibold">Priority</th>
            <th className="min-w-[12rem] px-2 py-2 font-semibold">Custom priority</th>
            <th className="min-w-[14rem] px-2 py-2 font-semibold">Description</th>
            <th className="min-w-[12rem] px-2 py-2 font-semibold">Reporting location</th>
            <th className="min-w-[11rem] px-2 py-2 font-semibold">Date/time</th>
            <th className="min-w-[8rem] px-2 py-2 font-semibold">Order #</th>
            <th className="min-w-[11rem] px-2 py-2 font-semibold">ETA</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Cost / unit</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Total</th>
            <th className="min-w-[12rem] px-2 py-2 font-semibold">Suggested sources</th>
            <th className="min-w-[9rem] px-2 py-2 font-semibold">Asset to transfer</th>
            <th className="sticky right-0 z-20 bg-muted/30 px-2 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const priorityPreset = isStandardLineItemPriority(item.priority) ? item.priority : 'other'

            const patch = (patchValue: Partial<AssetRequestLineItem>) => {
              onChangeItem(index, { ...item, ...patchValue })
            }

            return (
              <tr key={item.id} className="border-b">
                <td className="sticky left-0 z-10 bg-background px-2 py-2">{index + 1}</td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => {
                      const quantity = Math.max(1, Number.parseInt(event.target.value, 10) || 1)
                      patch({
                        quantity,
                        totalCost:
                          computeLineItemTotalCost(quantity, item.costPerUnit) ?? item.totalCost,
                      })
                    }}
                    className="h-8 w-16 text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.kind}
                    onChange={(event) => patch({ kind: event.target.value })}
                    className="h-8 min-w-[6rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.type}
                    onChange={(event) => patch({ type: event.target.value })}
                    className="h-8 min-w-[6rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Select
                    value={priorityPreset}
                    onValueChange={(next) => {
                      if (next === 'other') {
                        patch({
                          priority: isStandardLineItemPriority(item.priority) ? '' : item.priority,
                        })
                        return
                      }
                      patch({ priority: next })
                    }}
                  >
                    <SelectTrigger className="h-8 w-[7.5rem] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R" className="text-xs">
                        Routine (R)
                      </SelectItem>
                      <SelectItem value="U" className="text-xs">
                        Urgent (U)
                      </SelectItem>
                      <SelectItem value="other" className="text-xs">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={isStandardLineItemPriority(item.priority) ? '' : item.priority}
                    disabled={priorityPreset !== 'other'}
                    onChange={(event) => patch({ priority: event.target.value })}
                    className="h-8 min-w-[8rem] text-xs"
                    placeholder="Custom priority"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.detailedItemDescription}
                    onChange={(event) => patch({ detailedItemDescription: event.target.value })}
                    className="h-8 min-w-[12rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.requestedReportingLocation}
                    onChange={(event) => patch({ requestedReportingLocation: event.target.value })}
                    className="h-8 min-w-[10rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocalInputValue(item.dateTime)}
                    onChange={(event) =>
                      patch({ dateTime: fromDatetimeLocalInputValue(event.target.value) })
                    }
                    className="h-8 min-w-[10rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.orderNumber}
                    onChange={(event) => patch({ orderNumber: event.target.value })}
                    className="h-8 min-w-[7rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="datetime-local"
                    value={toDatetimeLocalInputValue(item.estimatedTimeOfArrival)}
                    onChange={(event) =>
                      patch({
                        estimatedTimeOfArrival: fromDatetimeLocalInputValue(event.target.value),
                      })
                    }
                    className="h-8 min-w-[10rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.costPerUnit ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value
                      const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
                      patch({
                        costPerUnit: parsed != null && Number.isFinite(parsed) ? parsed : null,
                      })
                    }}
                    onBlur={(event) => {
                      const raw = event.target.value
                      const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
                      const costPerUnit = parsed != null && Number.isFinite(parsed) ? parsed : null
                      patch({
                        costPerUnit,
                        totalCost:
                          computeLineItemTotalCost(item.quantity, costPerUnit) ?? item.totalCost,
                      })
                    }}
                    className="h-8 w-24 text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.totalCost ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value
                      const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
                      patch({
                        totalCost: parsed != null && Number.isFinite(parsed) ? parsed : null,
                      })
                    }}
                    className="h-8 w-24 text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <Input
                    value={item.suggestedSourcesOfSupplyAndSubstitutes}
                    onChange={(event) =>
                      patch({ suggestedSourcesOfSupplyAndSubstitutes: event.target.value })
                    }
                    className="h-8 min-w-[10rem] text-xs"
                  />
                </td>
                <td className="px-2 py-2">
                  <OrganizationAssetPickerPopover
                    assets={organizationAssets}
                    orgAssetIdsByKey={orgAssetIdsByKey}
                    glassItemBorderClasses={glassItemBorderClasses}
                    selected={item.assetsToTransfer}
                    onChange={(assetsToTransfer) => patch({ assetsToTransfer })}
                    idPrefix={`asset-request-table-item-${index}`}
                  />
                </td>
                <td className="sticky right-0 z-10 bg-background px-2 py-2">
                  {items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
