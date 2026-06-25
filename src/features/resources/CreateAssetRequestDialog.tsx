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
  ResourceRequestFieldsForm,
  type ResourceRequestIncidentOption,
} from '@/features/resources/ResourceRequestFieldsForm'
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
  onSubmit: (input: CreateResourceRequestInput) => Promise<boolean>
}

export function CreateAssetRequestDialog({
  open,
  onOpenChange,
  isSubmitting,
  defaultRequestedByName = '',
  incidentOptions = [],
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
      <DialogContent className="!flex !max-h-[90vh] !w-[42rem] !max-w-[42rem] flex-col overflow-hidden sm:!max-w-[42rem]">
        <DialogHeader>
          <DialogTitle>Create asset request</DialogTitle>
          <DialogDescription>
            Submit an ICS 213RR-CG resource request. Core order details are required; approval fields
            can be completed later.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ResourceRequestFieldsForm
            value={formValue}
            onChange={setFormValue}
            incidentOptions={incidentOptions}
          />
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
