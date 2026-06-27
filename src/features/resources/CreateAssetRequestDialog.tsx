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
import {
  AssetRequestLineItemsSection,
  type AssetRequestItemsView,
} from '@/features/resources/AssetRequestLineItemsSection'
import type { ResourceRequestIncidentOption } from '@/features/resources/AssetRequestHeaderForm'
import type { ResourceListItemData } from '@/features/resources/types'
import {
  createEmptyResourceRequestInput,
  validateCreateResourceRequestInput,
  type CreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'

type CreateAssetRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  defaultRequestedByName?: string
  incidentOptions?: ResourceRequestIncidentOption[]
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
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
  glassItemBorderClasses = '',
  onSubmit,
}: CreateAssetRequestDialogProps) {
  const [formValue, setFormValue] = useState<CreateResourceRequestInput>(
    createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName })
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [requestedItemsView, setRequestedItemsView] = useState<AssetRequestItemsView>('list')

  useEffect(() => {
    if (!open) {
      setFormValue(createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName }))
      setValidationError(null)
      setRequestedItemsView('list')
    }
  }, [defaultRequestedByName, open])

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
      <DialogContent className="!flex !h-[92vh] !max-h-[92vh] !w-[96vw] !max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[96vw]">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Create asset request</DialogTitle>
          <DialogDescription>
            Add one or more requested items to an ICS 213RR-CG resource request. Core header and
            line-item details are required.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
            <AssetRequestHeaderForm
              value={formValue}
              onChange={setFormValue}
              incidentOptions={incidentOptions}
            />
            <AssetRequestLineItemsSection
              items={formValue.items}
              view={requestedItemsView}
              onViewChange={setRequestedItemsView}
              onChangeItems={(items) => setFormValue((previous) => ({ ...previous, items }))}
              organizationAssets={organizationAssets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              glassItemBorderClasses={glassItemBorderClasses}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-between">
          <div className="flex min-h-5 flex-1 items-center">
            {validationError ? (
              <p className="text-xs text-destructive">{validationError}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Creating…' : 'Create asset request'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
