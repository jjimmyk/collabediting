import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AssetRequestFinanceForm } from '@/features/resources/AssetRequestFinanceForm'
import {
  AssetRequestIncidentDetailsForm,
  type ResourceRequestIncidentOption,
} from '@/features/resources/AssetRequestIncidentDetailsForm'
import { AssetRequestLogisticsForm } from '@/features/resources/AssetRequestLogisticsForm'
import {
  AssetRequestLineItemsSection,
  type AssetRequestItemsView,
} from '@/features/resources/AssetRequestLineItemsSection'
import { AssetRequestPlansForm } from '@/features/resources/AssetRequestPlansForm'
import { AssetRequestRequestedByForm } from '@/features/resources/AssetRequestRequestedByForm'
import { AssetRequestSectionChiefApprovalForm } from '@/features/resources/AssetRequestSectionChiefApprovalForm'
import { AssetRequestTransferSection } from '@/features/resources/AssetRequestTransferSection'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import {
  buildInitialTransferConfirmations,
  createEmptyResourceRequestInput,
  generateResourceRequestNumber,
  validateCreateResourceRequestInput,
  type AssetRequestWorkspaceContext,
  type AssetTransferConfirmation,
  type AssetTransferResolveAsset,
  type CreateResourceRequestInput,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

type CreateAssetRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  defaultRequestedByName?: string
  incidentOptions?: ResourceRequestIncidentOption[]
  existingRequests?: ResourceRequestItem[]
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  glassItemBorderClasses?: string
  workspaceContext?: AssetRequestWorkspaceContext | null
  resolveAsset?: AssetTransferResolveAsset
  onSubmit: (input: CreateResourceRequestInput) => Promise<boolean>
}

export function CreateAssetRequestDialog({
  open,
  onOpenChange,
  isSubmitting,
  defaultRequestedByName = '',
  incidentOptions = [],
  existingRequests = [],
  organizationAssets = [],
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  glassItemBorderClasses = '',
  workspaceContext = null,
  resolveAsset,
  onSubmit,
}: CreateAssetRequestDialogProps) {
  const [formValue, setFormValue] = useState<CreateResourceRequestInput>(
    createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName })
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [requestedItemsView, setRequestedItemsView] = useState<AssetRequestItemsView>('list')
  const [transferConfirmations, setTransferConfirmations] = useState<AssetTransferConfirmation[]>(
    []
  )

  const previewRequestNumber = useMemo(
    () => generateResourceRequestNumber(existingRequests),
    [existingRequests, open]
  )

  const assetResolver = useMemo<AssetTransferResolveAsset>(
    () =>
      resolveAsset ??
      ((assetKey) => organizationAssets.find((asset) => asset.assetKey === assetKey) ?? null),
    [organizationAssets, resolveAsset]
  )

  useEffect(() => {
    if (!open) {
      setFormValue(createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName }))
      setValidationError(null)
      setRequestedItemsView('list')
      setTransferConfirmations([])
      return
    }

    if (!workspaceContext) return

    setFormValue(
      createEmptyResourceRequestInput({
        requestedByName: defaultRequestedByName,
        incidentName: workspaceContext.workspaceName,
        mapLocation: workspaceContext.mapLocation ?? undefined,
        sourceWorkspaceId: workspaceContext.workspaceId,
        sourceWorkspaceKind: workspaceContext.workspaceKind,
        sourceWorkspaceName: workspaceContext.workspaceName,
      })
    )
  }, [defaultRequestedByName, open, workspaceContext])

  useEffect(() => {
    if (!open || !workspaceContext) {
      setTransferConfirmations([])
      return
    }

    setTransferConfirmations((previous) => {
      const next = buildInitialTransferConfirmations(
        formValue.items,
        workspaceContext.workspaceId,
        assetResolver
      )
      return next.map((confirmation) => {
        const existing = previous.find((entry) => entry.assetKey === confirmation.assetKey)
        if (!existing) return confirmation
        if (confirmation.previousWorkspaceId === confirmation.targetWorkspaceId) {
          return confirmation
        }
        return { ...confirmation, confirmed: existing.confirmed }
      })
    })
  }, [assetResolver, formValue.items, open, workspaceContext])

  const handleTransferConfirmationChange = (assetKey: string, confirmed: boolean) => {
    setTransferConfirmations((previous) =>
      previous.map((entry) => (entry.assetKey === assetKey ? { ...entry, confirmed } : entry))
    )
  }

  const handleSubmit = async () => {
    const payload: CreateResourceRequestInput = workspaceContext
      ? {
          ...formValue,
          incidentName: workspaceContext.workspaceName,
          sourceWorkspaceId: workspaceContext.workspaceId,
          sourceWorkspaceKind: workspaceContext.workspaceKind,
          sourceWorkspaceName: workspaceContext.workspaceName,
          assetTransferConfirmations:
            transferConfirmations.length > 0 ? transferConfirmations : undefined,
        }
      : {
          ...formValue,
          assetTransferConfirmations: undefined,
        }

    const error = validateCreateResourceRequestInput(payload)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    const ok = await onSubmit(payload)
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
            Complete an ICS 213RR-CG resource request with incident details, requested items, and
            approval sections.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <AssetRequestIncidentDetailsForm
              value={formValue}
              onChange={setFormValue}
              incidentOptions={incidentOptions}
              previewRequestNumber={previewRequestNumber}
              workspaceContext={workspaceContext}
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
            <AssetRequestRequestedByForm value={formValue} onChange={setFormValue} />
            <AssetRequestSectionChiefApprovalForm value={formValue} onChange={setFormValue} />
            <AssetRequestPlansForm value={formValue} onChange={setFormValue} />
            <AssetRequestLogisticsForm value={formValue} onChange={setFormValue} />
            <AssetRequestFinanceForm value={formValue} onChange={setFormValue} />
            {workspaceContext ? (
              <AssetRequestTransferSection
                mode="create"
                lineItems={formValue.items}
                workspaceContext={workspaceContext}
                organizationAssets={organizationAssets}
                workspaceOptions={workspaceOptions}
                confirmations={transferConfirmations}
                onConfirmationChange={handleTransferConfirmationChange}
                resolveAsset={assetResolver}
              />
            ) : null}
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
