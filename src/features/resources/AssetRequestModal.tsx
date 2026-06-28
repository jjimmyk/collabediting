import { useEffect, useMemo, useState } from 'react'
import { DownloadIcon, Eye, FileText, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AssetRequestDetailPanel } from '@/features/resources/AssetRequestDetailPanel'
import { AssetRequestFormBody } from '@/features/resources/AssetRequestFormBody'
import type { ResourceRequestIncidentOption } from '@/features/resources/AssetRequestIncidentDetailsForm'
import { workspaceContextFromAssetRequest } from '@/features/resources/asset-request-workspace-context'
import type { AssetRequestItemsView } from '@/features/resources/AssetRequestLineItemsSection'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import {
  buildInitialTransferConfirmations,
  mergeTransferConfirmationsForUpdate,
  resourceRequestToEditInput,
  validateCreateResourceRequestInput,
  type AssetRequestWorkspaceContext,
  type AssetTransferResolveAsset,
  type CreateResourceRequestInput,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type AssetRequestModalMode = 'view' | 'edit'

type AssetRequestModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ResourceRequestItem | null
  mode?: AssetRequestModalMode
  canEdit?: boolean
  isSubmitting?: boolean
  incidentOptions?: ResourceRequestIncidentOption[]
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses?: string
  workspaceContext?: AssetRequestWorkspaceContext | null
  roster?: WorkspaceRosterMember[]
  resolveAsset?: AssetTransferResolveAsset
  onSave?: (input: CreateResourceRequestInput, existing: ResourceRequestItem) => Promise<boolean>
  onPreview?: (request: ResourceRequestItem) => void
  onExportWord?: (request: ResourceRequestItem) => void
  onExportPdf?: (request: ResourceRequestItem) => void
  onApplyTransfers?: (request: ResourceRequestItem) => void
  onReplaceTransferAsset?: (
    request: ResourceRequestItem,
    oldAssetKey: string,
    newAsset: ResourceListItemData
  ) => void
  isApplyingTransfers?: boolean
  isReplacingTransferAsset?: boolean
}

export function AssetRequestModal({
  open,
  onOpenChange,
  request,
  mode: controlledMode,
  canEdit = true,
  isSubmitting = false,
  incidentOptions = [],
  organizationAssets = [],
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  glassItemBorderClasses = '',
  workspaceContext = null,
  roster = [],
  resolveAsset,
  onSave,
  onPreview,
  onExportWord,
  onExportPdf,
  onApplyTransfers,
  onReplaceTransferAsset,
  isApplyingTransfers = false,
  isReplacingTransferAsset = false,
}: AssetRequestModalProps) {
  const [internalMode, setInternalMode] = useState<AssetRequestModalMode>('view')
  const [formValue, setFormValue] = useState<CreateResourceRequestInput | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [requestedItemsView, setRequestedItemsView] = useState<AssetRequestItemsView>('list')

  const mode = controlledMode ?? internalMode

  const effectiveWorkspaceContext = useMemo(
    () => (request ? workspaceContextFromAssetRequest(request, workspaceContext) : null),
    [request, workspaceContext]
  )

  const assetResolver = useMemo<AssetTransferResolveAsset>(
    () =>
      resolveAsset ??
      ((assetKey) => organizationAssets.find((asset) => asset.assetKey === assetKey) ?? null),
    [organizationAssets, resolveAsset]
  )

  useEffect(() => {
    if (!open) {
      setInternalMode('view')
      setFormValue(null)
      setValidationError(null)
      setRequestedItemsView('list')
      return
    }

    if (request) {
      setFormValue(resourceRequestToEditInput(request))
    }
  }, [open, request])

  const transferConfirmations = useMemo(() => {
    if (!formValue || !effectiveWorkspaceContext) return []
    if (request?.assetTransferConfirmations?.length) {
      return mergeTransferConfirmationsForUpdate(
        request.assetTransferConfirmations,
        formValue.items,
        effectiveWorkspaceContext.workspaceId,
        assetResolver
      )
    }
    return buildInitialTransferConfirmations(
      formValue.items,
      effectiveWorkspaceContext.workspaceId,
      assetResolver
    )
  }, [assetResolver, effectiveWorkspaceContext, formValue, request?.assetTransferConfirmations])

  const handleEnterEdit = () => {
    if (!request) return
    setFormValue(resourceRequestToEditInput(request))
    setValidationError(null)
    setInternalMode('edit')
  }

  const handleCancelEdit = () => {
    if (!request) return
    setFormValue(resourceRequestToEditInput(request))
    setValidationError(null)
    setInternalMode('view')
  }

  const handleSave = async () => {
    if (!request || !formValue || !onSave) return

    const payload: CreateResourceRequestInput = effectiveWorkspaceContext
      ? {
          ...formValue,
          ics215NeedLink: request.ics215NeedLink ?? formValue.ics215NeedLink,
          incidentName: effectiveWorkspaceContext.workspaceName,
          sourceWorkspaceId: effectiveWorkspaceContext.workspaceId,
          sourceWorkspaceKind: effectiveWorkspaceContext.workspaceKind,
          sourceWorkspaceName: effectiveWorkspaceContext.workspaceName,
          assetTransferConfirmations:
            transferConfirmations.length > 0 ? transferConfirmations : undefined,
        }
      : {
          ...formValue,
          ics215NeedLink: request.ics215NeedLink ?? formValue.ics215NeedLink,
          assetTransferConfirmations: formValue.assetTransferConfirmations,
        }

    const error = validateCreateResourceRequestInput(payload)
    if (error) {
      setValidationError(error)
      return
    }

    setValidationError(null)
    const ok = await onSave(payload, request)
    if (ok) {
      setInternalMode('view')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!flex !h-[92vh] !max-h-[92vh] !w-[96vw] !max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[96vw]"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 border-b px-6 py-4 sm:flex-row">
          <div className="min-w-0 text-left">
            <DialogTitle className="truncate text-base">
              {request ? request.requestNumber : 'Asset request'}
            </DialogTitle>
            <DialogDescription className="truncate">
              {request
                ? `${request.incidentName}${mode === 'edit' ? ' · Editing' : ''}`
                : 'Asset request details'}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {request && mode === 'view' ? (
              <>
                {onPreview ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={() => onPreview(request)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview 213RR
                  </Button>
                ) : null}
                {onExportWord ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={() => onExportWord(request)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Export Word
                  </Button>
                ) : null}
                {onExportPdf ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={() => onExportPdf(request)}
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Export PDF
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 text-xs"
                    onClick={handleEnterEdit}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null}
              </>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Close asset request"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {request && mode === 'view' ? (
            <AssetRequestDetailPanel
              request={request}
              organizationAssets={organizationAssets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              workspaceOptions={workspaceOptions}
              positionCatalog={positionCatalog}
              roster={roster}
              resolveAsset={resolveAsset}
              onApplyTransfers={onApplyTransfers}
              onReplaceTransferAsset={onReplaceTransferAsset}
              isApplyingTransfers={isApplyingTransfers}
              isReplacingTransferAsset={isReplacingTransferAsset}
            />
          ) : null}
          {request && mode === 'edit' && formValue ? (
            <AssetRequestFormBody
              formValue={formValue}
              onChange={setFormValue}
              requestedItemsView={requestedItemsView}
              onRequestedItemsViewChange={setRequestedItemsView}
              incidentOptions={incidentOptions}
              previewRequestNumber={request.requestNumber}
              workspaceContext={effectiveWorkspaceContext}
              organizationAssets={organizationAssets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              workspaceOptions={workspaceOptions}
              positionCatalog={positionCatalog}
              glassItemBorderClasses={glassItemBorderClasses}
              resolveAsset={resolveAsset}
              transferConfirmations={transferConfirmations}
            />
          ) : null}
        </div>

        {mode === 'edit' ? (
          <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-between">
            <div className="flex min-h-5 flex-1 items-center">
              {validationError ? (
                <p className="text-xs text-destructive">{validationError}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
