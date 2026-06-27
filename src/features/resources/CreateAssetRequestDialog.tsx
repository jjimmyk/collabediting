import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AssetRequestHeaderForm } from '@/features/resources/AssetRequestHeaderForm'
import { AssetRequestLineItemForm } from '@/features/resources/AssetRequestLineItemForm'
import type { ResourceRequestIncidentOption } from '@/features/resources/AssetRequestHeaderForm'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  createEmptyAssetRequestLineItem,
  createEmptyResourceRequestInput,
  validateCreateResourceRequestInput,
  type AssetRequestLineItem,
  type CreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'
import { Plus } from 'lucide-react'

type CreateAssetRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  defaultRequestedByName?: string
  incidentOptions?: ResourceRequestIncidentOption[]
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  onSubmit: (input: CreateResourceRequestInput) => Promise<boolean>
}

export function CreateAssetRequestDialog({
  open,
  onOpenChange,
  isSubmitting,
  defaultRequestedByName = '',
  incidentOptions = [],
  organizationAssets = [],
  orgAssetIdsByKey = {},
  onSubmit,
}: CreateAssetRequestDialogProps) {
  const [formValue, setFormValue] = useState<CreateResourceRequestInput>(
    createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName })
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFormValue(createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName }))
      setValidationError(null)
    }
  }, [defaultRequestedByName, open])

  const updateLineItem = (index: number, next: AssetRequestLineItem) => {
    setFormValue((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => (itemIndex === index ? next : item)),
    }))
  }

  const addLineItem = () => {
    setFormValue((previous) => ({
      ...previous,
      items: [...previous.items, createEmptyAssetRequestLineItem()],
    }))
  }

  const removeLineItem = (index: number) => {
    setFormValue((previous) => ({
      ...previous,
      items: previous.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async () => {
    const error = validateCreateResourceRequestInput(formValue)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    const ok = await onSubmit(formValue)
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex !max-h-[90vh] !w-[48rem] !max-w-[48rem] flex-col overflow-hidden sm:!max-w-[48rem]">
        <DialogHeader>
          <DialogTitle>Create asset request</DialogTitle>
          <DialogDescription>
            Add one or more requested items to an ICS 213RR-CG resource request. Core header and
            line-item details are required.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <AssetRequestHeaderForm
            value={formValue}
            onChange={setFormValue}
            incidentOptions={incidentOptions}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requested items
              </p>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={addLineItem}>
                <Plus className="h-3.5 w-3.5" />
                Add requested item
              </Button>
            </div>
            {formValue.items.map((item, index) => (
              <AssetRequestLineItemForm
                key={item.id}
                index={index}
                value={item}
                onChange={(next) => updateLineItem(index, next)}
                onRemove={() => removeLineItem(index)}
                canRemove={formValue.items.length > 1}
                organizationAssets={organizationAssets}
                orgAssetIdsByKey={orgAssetIdsByKey}
              />
            ))}
          </div>
        </div>
        {validationError ? (
          <p className="text-xs text-destructive">{validationError}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? 'Creating…' : 'Create asset request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
