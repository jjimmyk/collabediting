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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { AssignAssetToWorkspacePicker } from '@/features/resources/AssignAssetToWorkspacePicker'
import { ASSET_STATUS_OPTIONS } from '@/features/resources/types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { CreateOrganizationAssetInput } from '@/lib/organization-asset-catalog'

type AddWorkspaceAssetDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  unassignedAssets: ResourceListItemData[]
  isSubmitting: boolean
  onAssignExisting: (assetKey: string) => Promise<boolean>
  onCreateAndAssign: (input: CreateOrganizationAssetInput) => Promise<boolean>
}

export function AddWorkspaceAssetDialog({
  open,
  onOpenChange,
  unassignedAssets,
  isSubmitting,
  onAssignExisting,
  onCreateAndAssign,
}: AddWorkspaceAssetDialogProps) {
  const [mode, setMode] = useState<'catalog' | 'create'>('catalog')
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [owner, setOwner] = useState('')
  const [assetStatus, setAssetStatus] = useState<(typeof ASSET_STATUS_OPTIONS)[number]>('FMC')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      setMode(unassignedAssets.length > 0 ? 'catalog' : 'create')
      setName('')
      setType('')
      setOwner('')
      setAssetStatus('FMC')
      setLocation('')
      setNotes('')
    }
  }, [open, unassignedAssets.length])

  const handleAssignExisting = async (assetKey: string) => {
    const ok = await onAssignExisting(assetKey)
    if (ok) {
      onOpenChange(false)
    }
  }

  const handleCreate = async () => {
    const ok = await onCreateAndAssign({
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
      <DialogContent className="!w-[30rem] !max-w-[30rem] sm:!max-w-[30rem]">
        <DialogHeader>
          <DialogTitle>Add asset to workspace</DialogTitle>
          <DialogDescription>
            Assign an existing catalog asset or create a new one for this workspace.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'catalog' | 'create')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">From catalog</TabsTrigger>
            <TabsTrigger value="create">Create new</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog" className="space-y-3 pt-3">
            {unassignedAssets.length > 0 ? (
              <AssignAssetToWorkspacePicker
                assets={unassignedAssets}
                disabled={isSubmitting}
                label="Unassigned asset"
                onAssign={(assetKey) => {
                  void handleAssignExisting(assetKey)
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                All catalog assets are already assigned. Create a new asset instead.
              </p>
            )}
          </TabsContent>
          <TabsContent value="create" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-asset-name">Name</Label>
              <Input
                id="workspace-asset-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspace-asset-type">Type</Label>
              <Input
                id="workspace-asset-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="workspace-asset-owner">Owner</Label>
                <Input
                  id="workspace-asset-owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
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
              <Label htmlFor="workspace-asset-location">Location</Label>
              <Input
                id="workspace-asset-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspace-asset-notes">Notes</Label>
              <Textarea
                id="workspace-asset-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting || !name.trim() || !type.trim()}
              onClick={() => void handleCreate()}
            >
              {isSubmitting ? 'Creating…' : 'Create and assign'}
            </Button>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
