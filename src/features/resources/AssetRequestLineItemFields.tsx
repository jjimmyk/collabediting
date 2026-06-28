import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { OrganizationAssetPicker } from '@/features/resources/OrganizationAssetPicker'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  computeLineItemTotalCost,
  fromDatetimeLocalInputValue,
  isStandardLineItemPriority,
  parseAssetRequestLineItemQuantity,
  toDatetimeLocalInputValue,
  type AssetRequestLineItem,
} from '@/lib/ics-213rr-resource-request'

export type AssetRequestLineItemFieldsProps = {
  index: number
  value: AssetRequestLineItem
  onChange: (next: AssetRequestLineItem) => void
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses?: string
  idPrefix?: string
  compact?: boolean
}

export function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function AssetRequestLineItemFields({
  index,
  value,
  onChange,
  organizationAssets,
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  glassItemBorderClasses = '',
  idPrefix = 'asset-request-item',
  compact = false,
}: AssetRequestLineItemFieldsProps) {
  const fieldPrefix = `${idPrefix}-${index}`
  const priorityPreset = isStandardLineItemPriority(value.priority) ? value.priority : 'other'

  const patch = (patchValue: Partial<AssetRequestLineItem>) => {
    onChange({ ...value, ...patchValue })
  }

  const handleCostPerUnitBlur = (raw: string) => {
    const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
    const costPerUnit = parsed != null && Number.isFinite(parsed) ? parsed : null
    patch({
      costPerUnit,
      totalCost: computeLineItemTotalCost(value.quantity, costPerUnit) ?? value.totalCost,
    })
  }

  const inputClass = compact ? 'h-8 text-xs' : 'h-9 text-xs'

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Quantity" htmlFor={`${fieldPrefix}-quantity`}>
          <Input
            id={`${fieldPrefix}-quantity`}
            type="number"
            min={0}
            step="any"
            value={value.quantity}
            onChange={(event) => {
              const quantity = parseAssetRequestLineItemQuantity(event.target.value)
              patch({
                quantity,
                totalCost: computeLineItemTotalCost(quantity, value.costPerUnit) ?? value.totalCost,
              })
            }}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="Priority" htmlFor={`${fieldPrefix}-priority`}>
          <Select
            value={priorityPreset}
            onValueChange={(next) => {
              if (next === 'other') {
                patch({ priority: isStandardLineItemPriority(value.priority) ? '' : value.priority })
                return
              }
              patch({ priority: next })
            }}
          >
            <SelectTrigger id={`${fieldPrefix}-priority`} className={inputClass}>
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
        </FieldRow>
      </div>

      {priorityPreset === 'other' ? (
        <FieldRow label="Custom priority" htmlFor={`${fieldPrefix}-priority-custom`}>
          <Input
            id={`${fieldPrefix}-priority-custom`}
            value={isStandardLineItemPriority(value.priority) ? '' : value.priority}
            onChange={(event) => patch({ priority: event.target.value })}
            className={inputClass}
            placeholder="Enter priority"
          />
        </FieldRow>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Kind" htmlFor={`${fieldPrefix}-kind`}>
          <Input
            id={`${fieldPrefix}-kind`}
            value={value.kind}
            onChange={(event) => patch({ kind: event.target.value })}
            className={inputClass}
            placeholder="Teams, Equipment, etc."
          />
        </FieldRow>
        <FieldRow label="Type" htmlFor={`${fieldPrefix}-type`}>
          <Input
            id={`${fieldPrefix}-type`}
            value={value.type}
            onChange={(event) => patch({ type: event.target.value })}
            className={inputClass}
            placeholder="Resource type"
          />
        </FieldRow>
      </div>

      <FieldRow label="Detailed item description" htmlFor={`${fieldPrefix}-description`}>
        <Textarea
          id={`${fieldPrefix}-description`}
          value={value.detailedItemDescription}
          onChange={(event) => patch({ detailedItemDescription: event.target.value })}
          className={compact ? 'min-h-16 text-xs' : 'min-h-20 text-xs'}
        />
      </FieldRow>

      <FieldRow label="Requested reporting location" htmlFor={`${fieldPrefix}-reporting-location`}>
        <Input
          id={`${fieldPrefix}-reporting-location`}
          value={value.requestedReportingLocation}
          onChange={(event) => patch({ requestedReportingLocation: event.target.value })}
          className={inputClass}
        />
      </FieldRow>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Date/time" htmlFor={`${fieldPrefix}-datetime`}>
          <Input
            id={`${fieldPrefix}-datetime`}
            type="datetime-local"
            value={toDatetimeLocalInputValue(value.dateTime)}
            onChange={(event) => patch({ dateTime: fromDatetimeLocalInputValue(event.target.value) })}
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="Order number" htmlFor={`${fieldPrefix}-order-number`}>
          <Input
            id={`${fieldPrefix}-order-number`}
            value={value.orderNumber}
            onChange={(event) => patch({ orderNumber: event.target.value })}
            className={inputClass}
          />
        </FieldRow>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldRow label="Estimated time of arrival" htmlFor={`${fieldPrefix}-eta`}>
          <Input
            id={`${fieldPrefix}-eta`}
            type="datetime-local"
            value={toDatetimeLocalInputValue(value.estimatedTimeOfArrival)}
            onChange={(event) =>
              patch({ estimatedTimeOfArrival: fromDatetimeLocalInputValue(event.target.value) })
            }
            className={inputClass}
          />
        </FieldRow>
        <FieldRow label="Cost per unit" htmlFor={`${fieldPrefix}-cost-per-unit`}>
          <Input
            id={`${fieldPrefix}-cost-per-unit`}
            type="number"
            min={0}
            step="0.01"
            value={value.costPerUnit ?? ''}
            onChange={(event) => {
              const raw = event.target.value
              const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
              patch({
                costPerUnit: parsed != null && Number.isFinite(parsed) ? parsed : null,
              })
            }}
            onBlur={(event) => handleCostPerUnitBlur(event.target.value)}
            className={inputClass}
          />
        </FieldRow>
      </div>

      <FieldRow label="Total cost" htmlFor={`${fieldPrefix}-total-cost`}>
        <Input
          id={`${fieldPrefix}-total-cost`}
          type="number"
          min={0}
          step="0.01"
          value={value.totalCost ?? ''}
          onChange={(event) => {
            const raw = event.target.value
            const parsed = raw.trim() === '' ? null : Number.parseFloat(raw)
            patch({
              totalCost: parsed != null && Number.isFinite(parsed) ? parsed : null,
            })
          }}
          className={inputClass}
        />
      </FieldRow>

      <FieldRow
        label="Suggested sources of supply & substitutes"
        htmlFor={`${fieldPrefix}-sources`}
      >
        <Textarea
          id={`${fieldPrefix}-sources`}
          value={value.suggestedSourcesOfSupplyAndSubstitutes}
          onChange={(event) =>
            patch({ suggestedSourcesOfSupplyAndSubstitutes: event.target.value })
          }
          className={compact ? 'min-h-12 text-xs' : 'min-h-16 text-xs'}
        />
      </FieldRow>

      <OrganizationAssetPicker
        assets={organizationAssets}
        orgAssetIdsByKey={orgAssetIdsByKey}
        glassItemBorderClasses={glassItemBorderClasses}
        selected={value.assetsToTransfer}
        onChange={(assetsToTransfer) => patch({ assetsToTransfer })}
        workspaceOptions={workspaceOptions}
        positionCatalog={positionCatalog}
        idPrefix={`${fieldPrefix}-transfer`}
      />
    </div>
  )
}
