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
import {
  createEmptyOrganizationAssetInput,
  OrganizationAssetFieldsForm,
} from '@/features/resources/OrganizationAssetFieldsForm'
import type { CreateOrganizationAssetInput } from '@/lib/organization-asset-catalog'

type CreateOrganizationAssetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onSubmit: (input: CreateOrganizationAssetInput) => Promise<boolean>
}

export function CreateOrganizationAssetDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: CreateOrganizationAssetDialogProps) {
  const [formValue, setFormValue] = useState<CreateOrganizationAssetInput>(
    createEmptyOrganizationAssetInput()
  )

  useEffect(() => {
    if (!open) {
      setFormValue(createEmptyOrganizationAssetInput())
    }
  }, [open])

  const handleSubmit = async () => {
    const ok = await onSubmit(formValue)
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex !max-h-[90vh] !w-[36rem] !max-w-[36rem] flex-col overflow-hidden sm:!max-w-[36rem]">
        <DialogHeader>
          <DialogTitle>Create asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your organization catalog. Define all fields now and assign it to a
            workspace after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <OrganizationAssetFieldsForm value={formValue} onChange={setFormValue} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !formValue.name.trim() || !formValue.type.trim()}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? 'Creating…' : 'Create asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
