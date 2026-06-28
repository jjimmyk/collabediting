import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  OrganizationAssetPicker,
  type OrganizationAssetPickerMode,
} from '@/features/resources/OrganizationAssetPicker'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type { AssetRequestTransferRef } from '@/lib/ics-213rr-resource-request'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'

export const ORG_ASSET_PICKER_DIALOG_CONTENT_CLASS =
  'flex max-h-[90vh] w-[min(98vw,128rem)] !max-w-[min(98vw,128rem)] sm:!max-w-[min(98vw,128rem)] flex-col gap-0 overflow-hidden p-0'

type OrganizationAssetPickerDialogProps = {
  assets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  glassItemBorderClasses?: string
  selected: AssetRequestTransferRef[]
  onChange: (next: AssetRequestTransferRef[]) => void
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  idPrefix: string
  triggerLabel?: string
  dialogTitle?: string
  dialogDescription?: string
  mode?: OrganizationAssetPickerMode
  excludeAssetKeys?: string[]
  onReplaceSelect?: (asset: ResourceListItemData) => void
  showSelectedSection?: boolean
  targetWorkspaceId?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function OrganizationAssetPickerDialog({
  assets,
  orgAssetIdsByKey = {},
  glassItemBorderClasses = '',
  selected,
  onChange,
  workspaceOptions = [],
  positionCatalog = null,
  idPrefix,
  triggerLabel = 'Add assets',
  dialogTitle = 'Asset to transfer',
  dialogDescription = 'Search organization assets, expand each row to review details, then add assets to transfer.',
  mode = 'multi',
  excludeAssetKeys = [],
  onReplaceSelect,
  showSelectedSection,
  targetWorkspaceId = null,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: OrganizationAssetPickerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen

  const handleReplaceSelect = (asset: ResourceListItemData) => {
    onReplaceSelect?.(asset)
    setOpen(false)
  }

  return (
    <>
      {!hideTrigger ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 whitespace-nowrap px-2 text-xs"
          aria-label={triggerLabel}
          onClick={() => setOpen(true)}
        >
          <Package className="h-3.5 w-3.5" />
          {mode === 'replace-single' ? (
            triggerLabel
          ) : selected.length === 0 ? (
            triggerLabel
          ) : (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {selected.length}
            </Badge>
          )}
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(ORG_ASSET_PICKER_DIALOG_CONTENT_CLASS)}>
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <OrganizationAssetPicker
              assets={assets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              glassItemBorderClasses={glassItemBorderClasses}
              selected={selected}
              onChange={onChange}
              workspaceOptions={workspaceOptions}
              positionCatalog={positionCatalog}
              idPrefix={idPrefix}
              mode={mode}
              excludeAssetKeys={excludeAssetKeys}
              onReplaceSelect={handleReplaceSelect}
              showSelectedSection={showSelectedSection ?? mode === 'multi'}
              targetWorkspaceId={targetWorkspaceId}
            />
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
