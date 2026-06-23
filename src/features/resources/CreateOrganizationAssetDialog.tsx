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
import { ASSET_STATUS_OPTIONS } from '@/features/resources/types'
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
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [owner, setOwner] = useState('')
  const [assetStatus, setAssetStatus] = useState<(typeof ASSET_STATUS_OPTIONS)[number]>('FMC')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setType('')
      setOwner('')
      setAssetStatus('FMC')
      setLocation('')
      setNotes('')
    }
  }, [open])

  const handleSubmit = async () => {
    const ok = await onSubmit({
      name,
      type,
      owner,
      assetStatus,
      location,
      notes,
    })
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[28rem] !max-w-[28rem] sm:!max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Create asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your organization catalog. You can assign it to a workspace after
            creation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. USCGC Forward"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-type">Type</Label>
            <Input
              id="asset-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="e.g. Medium Endurance Cutter"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-owner">Owner</Label>
              <Input
                id="asset-owner"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="Owning unit"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={assetStatus}
                onValueChange={(value) =>
                  setAssetStatus(value as (typeof ASSET_STATUS_OPTIONS)[number])
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-location">Location</Label>
            <Input
              id="asset-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Current location"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-notes">Notes</Label>
            <Textarea
              id="asset-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !name.trim() || !type.trim()}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? 'Creating…' : 'Create asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
