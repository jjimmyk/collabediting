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

type CreateOrganizationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onSubmit: (input: { name: string; slug: string }) => Promise<boolean>
}

function slugifyOrganizationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setSlug('')
      setSlugTouched(false)
    }
  }, [open])

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyOrganizationName(name))
    }
  }, [name, slugTouched])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedSlug = slug.trim().toLowerCase()
    if (!trimmedName || !trimmedSlug) return

    const ok = await onSubmit({ name: trimmedName, slug: trimmedSlug })
    if (ok) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[26rem] !max-w-[26rem] sm:!max-w-[26rem]">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            New organizations start empty. You will be the organization admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="organization-name">Organization name</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Emergency Response"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="organization-slug">Slug</Label>
            <Input
              id="organization-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(event.target.value)
              }}
              placeholder="acme-emergency-response"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || name.trim().length === 0 || slug.trim().length === 0}
            onClick={() => {
              void handleSubmit()
            }}
          >
            {isSubmitting ? 'Creating…' : 'Create organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
