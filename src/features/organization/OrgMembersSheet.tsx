import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { OrganizationMemberRecord } from '@/lib/organization-types'

type OrgMembersSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationName: string
  canManage: boolean
  members: OrganizationMemberRecord[]
  isLoading: boolean
  isInviting: boolean
  onRefresh: () => Promise<void>
  onInvite: (email: string) => Promise<boolean>
}

export function OrgMembersSheet({
  open,
  onOpenChange,
  organizationName,
  canManage,
  members,
  isLoading,
  isInviting,
  onRefresh,
  onInvite,
}: OrgMembersSheetProps) {
  const [emailDraft, setEmailDraft] = useState('')

  useEffect(() => {
    if (!open) {
      setEmailDraft('')
      return
    }
    void onRefresh()
  }, [open, onRefresh])

  const handleInvite = async () => {
    const email = emailDraft.trim().toLowerCase()
    if (!email) return
    const ok = await onInvite(email)
    if (ok) {
      setEmailDraft('')
      await onRefresh()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] !max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Organization members</SheetTitle>
          <SheetDescription>{organizationName}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {canManage ? (
            <div className="space-y-2 rounded-md border p-3">
              <Label htmlFor="org-member-invite-email">Invite by email</Label>
              <Input
                id="org-member-invite-email"
                value={emailDraft}
                onChange={(event) => setEmailDraft(event.target.value)}
                placeholder="person@example.gov"
              />
              <Button
                type="button"
                size="sm"
                disabled={isInviting || emailDraft.trim().length === 0}
                onClick={() => {
                  void handleInvite()
                }}
              >
                {isInviting ? 'Inviting…' : 'Invite member'}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.email}</p>
                    {member.fullName ? (
                      <p className="truncate text-xs text-muted-foreground">{member.fullName}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {member.role}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
