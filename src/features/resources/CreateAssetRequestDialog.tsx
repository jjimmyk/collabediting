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
import { AssetRequestFormBody } from '@/features/resources/AssetRequestFormBody'
import type { ResourceRequestIncidentOption } from '@/features/resources/AssetRequestIncidentDetailsForm'
import type { AssetRequestItemsView } from '@/features/resources/AssetRequestLineItemsSection'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  applyNeedSeedToCreateInput,
  buildIcs215NeedLinkFromContext,
  type AssetRequestNeedSeed,
} from '@/lib/asset-request-ics215-prefill'
import {
  buildInitialTransferConfirmations,
  createEmptyResourceRequestInput,
  generateResourceRequestNumber,
  validateCreateResourceRequestInput,
  type AssetRequestWorkspaceContext,
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
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses?: string
  workspaceContext?: AssetRequestWorkspaceContext | null
  resolveAsset?: AssetTransferResolveAsset
  needSeed?: AssetRequestNeedSeed | null
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
  positionCatalog = null,
  glassItemBorderClasses = '',
  workspaceContext = null,
  resolveAsset,
  needSeed = null,
  onSubmit,
}: CreateAssetRequestDialogProps) {
  const [formValue, setFormValue] = useState<CreateResourceRequestInput>(
    createEmptyResourceRequestInput({ requestedByName: defaultRequestedByName })
  )
  const [validationError, setValidationError] = useState<string | null>(null)
  const [requestedItemsView, setRequestedItemsView] = useState<AssetRequestItemsView>('list')

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
      return
    }

    if (!workspaceContext) return

    const base = createEmptyResourceRequestInput({
      requestedByName: defaultRequestedByName,
      incidentName: workspaceContext.workspaceName,
      mapLocation: workspaceContext.mapLocation ?? undefined,
      sourceWorkspaceId: workspaceContext.workspaceId,
      sourceWorkspaceKind: workspaceContext.workspaceKind,
      sourceWorkspaceName: workspaceContext.workspaceName,
    })

    setFormValue(needSeed ? applyNeedSeedToCreateInput(base, needSeed) : base)
  }, [defaultRequestedByName, needSeed, open, workspaceContext])

  const transferConfirmations = useMemo(
    () =>
      workspaceContext
        ? buildInitialTransferConfirmations(
            formValue.items,
            workspaceContext.workspaceId,
            assetResolver
          )
        : [],
    [assetResolver, formValue.items, workspaceContext]
  )

  const handleSubmit = async () => {
    const ics215NeedLink =
      formValue.ics215NeedLink ??
      (needSeed
        ? buildIcs215NeedLinkFromContext(needSeed.needContext, needSeed.workspaceId)
        : undefined)

    const payload: CreateResourceRequestInput = workspaceContext
      ? {
          ...formValue,
          ics215NeedLink,
          incidentName: workspaceContext.workspaceName,
          sourceWorkspaceId: workspaceContext.workspaceId,
          sourceWorkspaceKind: workspaceContext.workspaceKind,
          sourceWorkspaceName: workspaceContext.workspaceName,
          assetTransferConfirmations:
            transferConfirmations.length > 0 ? transferConfirmations : undefined,
        }
      : {
          ...formValue,
          ics215NeedLink,
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
      <DialogContent
        showCloseButton={false}
        className="!flex !h-[92vh] !max-h-[92vh] !w-[96vw] !max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[96vw]"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Create asset request</DialogTitle>
          <DialogDescription>
            Complete an ICS 213RR-CG resource request with incident details, requested items, and
            approval sections.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <AssetRequestFormBody
            formValue={formValue}
            onChange={setFormValue}
            requestedItemsView={requestedItemsView}
            onRequestedItemsViewChange={setRequestedItemsView}
            incidentOptions={incidentOptions}
            previewRequestNumber={previewRequestNumber}
            workspaceContext={workspaceContext}
            organizationAssets={organizationAssets}
            orgAssetIdsByKey={orgAssetIdsByKey}
            workspaceOptions={workspaceOptions}
            positionCatalog={positionCatalog}
            glassItemBorderClasses={glassItemBorderClasses}
            resolveAsset={resolveAsset}
            transferConfirmations={transferConfirmations}
          />
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
