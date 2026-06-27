import { Fragment, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssetRequestLineItemFields } from '@/features/resources/AssetRequestLineItemFields'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  computeLineItemTotalCost,
  getLineItemPriorityLabel,
  isStandardLineItemPriority,
  type AssetRequestLineItem,
} from '@/lib/ics-213rr-resource-request'
import { cn } from '@/lib/utils'
import { ChevronDown, Trash2 } from 'lucide-react'

type AssetRequestLineItemsTableProps = {
  items: AssetRequestLineItem[]
  onChangeItem: (index: number, next: AssetRequestLineItem) => void
  onRemoveItem: (index: number) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
}

function truncate(value: string, max = 48) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export function AssetRequestLineItemsTable({
  items,
  onChangeItem,
  onRemoveItem,
  organizationAssets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
}: AssetRequestLineItemsTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[1400px] border-collapse text-xs">
        <thead>
          <tr className="border-b bg-muted/30 text-left text-muted-foreground">
            <th className="px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">Qty</th>
            <th className="px-2 py-2 font-semibold">Kind</th>
            <th className="px-2 py-2 font-semibold">Type</th>
            <th className="px-2 py-2 font-semibold">Priority</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Description</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Reporting location</th>
            <th className="px-2 py-2 font-semibold">Cost / unit</th>
            <th className="px-2 py-2 font-semibold">Total</th>
            <th className="px-2 py-2 font-semibold">Transfer</th>
            <th className="px-2 py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isExpanded = expandedIndex === index
            const priorityPreset = isStandardLineItemPriority(item.priority) ? item.priority : 'other'

            const patch = (patchValue: Partial<AssetRequestLineItem>) => {
              onChangeItem(index, { ...item, ...patchValue })
            }

            return (
              <Fragment key={item.id}>
                <tr className={cn('border-b', isExpanded && 'bg-muted/20')}>
                  <td className="px-2 py-2">{index + 1}</td>
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
                  <td className="max-w-[12rem] px-2 py-2" title={item.detailedItemDescription}>
                    {truncate(item.detailedItemDescription)}
                  </td>
                  <td className="max-w-[12rem] px-2 py-2" title={item.requestedReportingLocation}>
                    {truncate(item.requestedReportingLocation)}
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
                    <Badge variant="outline" className="text-[10px]">
                      {item.assetsToTransfer.length} asset
                      {item.assetsToTransfer.length === 1 ? '' : 's'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} item ${index + 1}`}
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      >
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                        />
                      </Button>
                      {items.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() => {
                            setExpandedIndex((previous) =>
                              previous === index ? null : previous != null && previous > index ? previous - 1 : previous
                            )
                            onRemoveItem(index)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="border-b bg-muted/10">
                    <td colSpan={11} className="px-3 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Item {index + 1} · {getLineItemPriorityLabel(item.priority)}
                        </p>
                      </div>
                      <AssetRequestLineItemFields
                        index={index}
                        value={item}
                        onChange={(next) => onChangeItem(index, next)}
                        organizationAssets={organizationAssets}
                        orgAssetIdsByKey={orgAssetIdsByKey}
                        glassItemBorderClasses={glassItemBorderClasses}
                        idPrefix="asset-request-table-item"
                        compact
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
