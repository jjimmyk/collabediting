import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  buildHubAorProfileOptions,
  filterHubAorProfileOptions,
  resolveHubAorProfileNodeLabel,
} from '@/features/hub/aor/hub-aor-profile-options'
import { normalizeQualificationLabels } from '@/features/roster/person-picker-qualifications'
import {
  fetchOrganizationMemberProfile,
  updateOrganizationMemberProfile,
} from '@/lib/organization-member-profile-service'
import type { OrganizationMemberProfile } from '@/lib/organization-types'
import { cn } from '@/lib/utils'

type OrgMemberProfileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationMemberId: string | null
  memberEmail: string
  memberFullName: string | null
  canEdit: boolean
  getAccessToken: () => Promise<string | null>
  onSaved?: () => void
}

const emptyProfile = (organizationMemberId: string): OrganizationMemberProfile => ({
  organizationMemberId,
  phone: null,
  address: null,
  defaultRadioContact: null,
  homeAorNodeId: null,
  qualifications: [],
})

export function OrgMemberProfileSheet({
  open,
  onOpenChange,
  organizationMemberId,
  memberEmail,
  memberFullName,
  canEdit,
  getAccessToken,
  onSaved,
}: OrgMemberProfileSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<OrganizationMemberProfile | null>(null)
  const [qualificationDraft, setQualificationDraft] = useState('')
  const [homeAorQuery, setHomeAorQuery] = useState('')

  const aorOptions = useMemo(() => buildHubAorProfileOptions(), [])
  const filteredAorOptions = useMemo(
    () => filterHubAorProfileOptions(aorOptions, homeAorQuery),
    [aorOptions, homeAorQuery]
  )

  useEffect(() => {
    if (!open || !organizationMemberId) {
      setProfile(null)
      setQualificationDraft('')
      setHomeAorQuery('')
      return
    }

    let cancelled = false
    setIsLoading(true)
    void (async () => {
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('Sign in again to load this profile.')
        }
        const loaded =
          (await fetchOrganizationMemberProfile({
            accessToken,
            organizationMemberId,
          })) ?? emptyProfile(organizationMemberId)
        if (!cancelled) {
          setProfile(loaded)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load profile.')
          setProfile(emptyProfile(organizationMemberId))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, organizationMemberId, getAccessToken])

  const addQualification = () => {
    const trimmed = qualificationDraft.trim()
    if (!trimmed || !profile) return
    setProfile({
      ...profile,
      qualifications: normalizeQualificationLabels([...profile.qualifications, trimmed]),
    })
    setQualificationDraft('')
  }

  const removeQualification = (label: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      qualifications: profile.qualifications.filter((entry) => entry !== label),
    })
  }

  const handleSave = async () => {
    if (!organizationMemberId || !profile || !canEdit) return

    setIsSaving(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Sign in again to save this profile.')
      }

      await updateOrganizationMemberProfile({
        accessToken,
        organizationMemberId,
        input: {
          phone: profile.phone,
          address: profile.address,
          defaultRadioContact: profile.defaultRadioContact,
          homeAorNodeId: profile.homeAorNodeId,
          qualifications: profile.qualifications,
        },
      })

      toast.success('Profile saved.')
      onSaved?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = memberFullName?.trim() || memberEmail

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[440px] !max-w-[440px] flex-col">
        <SheetHeader>
          <SheetTitle>Member profile</SheetTitle>
          <SheetDescription>{displayName}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {isLoading || !profile ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading profile…
            </div>
          ) : (
            <>
              <div className="space-y-1 rounded-md border px-3 py-2">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{memberEmail}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-profile-phone">Phone</Label>
                <Input
                  id="member-profile-phone"
                  value={profile.phone ?? ''}
                  disabled={!canEdit}
                  placeholder="(555) 010-0100"
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-profile-address">Address</Label>
                <Textarea
                  id="member-profile-address"
                  value={profile.address ?? ''}
                  disabled={!canEdit}
                  placeholder="Street, city, state, ZIP"
                  className="min-h-20 text-sm"
                  onChange={(event) =>
                    setProfile({ ...profile, address: event.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-profile-radio">Default radio contact</Label>
                <Input
                  id="member-profile-radio"
                  value={profile.defaultRadioContact ?? ''}
                  disabled={!canEdit}
                  placeholder="Command Net 1"
                  onChange={(event) =>
                    setProfile({ ...profile, defaultRadioContact: event.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Home AOR</Label>
                {profile.homeAorNodeId ? (
                  <div className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs">
                    <span className="min-w-0 truncate">
                      {resolveHubAorProfileNodeLabel(profile.homeAorNodeId) ??
                        profile.homeAorNodeId}
                    </span>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        aria-label="Clear Home AOR"
                        onClick={() => setProfile({ ...profile, homeAorNodeId: null })}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No Home AOR selected.</p>
                )}
                {canEdit ? (
                  <>
                    <Input
                      value={homeAorQuery}
                      placeholder="Search Areas of Responsibility"
                      className="h-8 text-xs"
                      onChange={(event) => setHomeAorQuery(event.target.value)}
                    />
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                      {filteredAorOptions.length === 0 ? (
                        <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                          No matching AOR entries.
                        </p>
                      ) : (
                        filteredAorOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              'flex w-full flex-col rounded px-2 py-1.5 text-left text-xs hover:bg-muted',
                              profile.homeAorNodeId === option.value && 'bg-primary/10 ring-1 ring-primary'
                            )}
                            onClick={() =>
                              setProfile({ ...profile, homeAorNodeId: option.value })
                            }
                          >
                            <span className="font-medium">{option.label}</span>
                            <span className="text-[10px] text-muted-foreground">{option.group}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Qualifications</Label>
                <div className="flex flex-wrap gap-1.5">
                  {profile.qualifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No qualifications recorded.</p>
                  ) : (
                    profile.qualifications.map((label) => (
                      <Badge key={label} variant="secondary" className="gap-1 pr-1 text-[11px]">
                        {label}
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded-sm p-0.5 hover:bg-muted"
                            aria-label={`Remove ${label}`}
                            onClick={() => removeQualification(label)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </Badge>
                    ))
                  )}
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Input
                      value={qualificationDraft}
                      placeholder="Add qualification"
                      className="h-8 text-xs"
                      onChange={(event) => setQualificationDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addQualification()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 px-2"
                      disabled={qualificationDraft.trim().length === 0}
                      onClick={addQualification}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit ? (
            <Button
              type="button"
              disabled={isSaving || isLoading || !profile}
              onClick={() => {
                void handleSave()
              }}
            >
              {isSaving ? 'Saving…' : 'Save profile'}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
