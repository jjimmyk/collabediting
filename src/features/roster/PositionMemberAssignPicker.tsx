import { useEffect, useMemo, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  dedupeOrgSearchResultsAgainstDraftMembers,
  dedupeOrgSearchResultsAgainstRoster,
  filterMembersBySearchQuery,
  formatMemberPositionSummary,
  isSelectableOrgMember,
  type OrgMemberPickerMode,
} from '@/features/roster/position-member-assign-picker'
import { PersonPickerQualificationsLine } from '@/features/roster/PersonPickerQualificationsLine'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { BuildTeamDraftMember } from '@/features/roster/roster-template-types'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

type PositionMemberAssignPickerProps = {
  label?: string
  disabled: boolean
  position: string
  assignableMembers: WorkspaceRosterMember[]
  rosterMembersForDedupe?: WorkspaceRosterMember[]
  draftMembersForDedupe?: BuildTeamDraftMember[]
  onSelectRosterMember: (memberId: string) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onSelectOrgMember?: (userId: string, email: string) => void
  orgPickerMode?: OrgMemberPickerMode
}

function MemberResultButton({
  email,
  detail,
  qualifications,
  onClick,
}: {
  email: string
  detail?: string | null
  qualifications?: string[] | null
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto min-h-8 w-full flex-col items-start justify-start gap-0.5 px-2 py-1.5 text-left text-xs"
      onClick={onClick}
    >
      <span className="truncate font-medium">{email}</span>
      {detail ? (
        <span className="truncate text-[11px] text-muted-foreground">{detail}</span>
      ) : null}
      <PersonPickerQualificationsLine qualifications={qualifications} />
    </Button>
  )
}

export function PositionMemberAssignPicker({
  label = 'Existing user',
  disabled,
  position,
  assignableMembers,
  rosterMembersForDedupe = assignableMembers,
  draftMembersForDedupe = [],
  onSelectRosterMember,
  onSearchOrgMembers,
  onSelectOrgMember,
  orgPickerMode = 'assign_to_position',
}: PositionMemberAssignPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [orgResults, setOrgResults] = useState<OrgMemberSearchResult[]>([])
  const [isSearchingOrg, setIsSearchingOrg] = useState(false)
  const orgSearchEnabled = Boolean(onSearchOrgMembers && onSelectOrgMember)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setOrgResults([])
      return
    }

    if (!orgSearchEnabled || !onSearchOrgMembers) {
      setOrgResults([])
      return
    }

    const trimmed = query.trim()
    const timeout = window.setTimeout(() => {
      setIsSearchingOrg(true)
      void onSearchOrgMembers(trimmed, position)
        .then((results) => {
          if (orgPickerMode === 'pre_workspace') {
            setOrgResults(
              dedupeOrgSearchResultsAgainstDraftMembers(results, draftMembersForDedupe, position)
            )
            return
          }
          setOrgResults(dedupeOrgSearchResultsAgainstRoster(results, rosterMembersForDedupe))
        })
        .catch(() => {
          setOrgResults([])
        })
        .finally(() => {
          setIsSearchingOrg(false)
        })
    }, trimmed.length > 0 ? 250 : 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    draftMembersForDedupe,
    onSearchOrgMembers,
    open,
    orgPickerMode,
    orgSearchEnabled,
    position,
    query,
    rosterMembersForDedupe,
  ])

  const filteredRosterMembers = useMemo(
    () => filterMembersBySearchQuery(assignableMembers, query),
    [assignableMembers, query]
  )

  const filteredOrgResults = useMemo(
    () =>
      filterMembersBySearchQuery(orgResults, query, (result) => result.fullName).filter((result) =>
        isSelectableOrgMember(result, orgPickerMode)
      ),
    [orgPickerMode, orgResults, query]
  )

  const hasResults = filteredRosterMembers.length > 0 || filteredOrgResults.length > 0
  const pickerDisabled = disabled || (!orgSearchEnabled && assignableMembers.length === 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 min-w-[6.5rem] flex-1 gap-1 px-2 text-[11px]"
          disabled={pickerDisabled}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 p-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or email"
          className="h-8 text-xs"
          autoFocus
        />
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {isSearchingOrg ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading people…
            </div>
          ) : !hasResults ? (
            <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
              {query.trim()
                ? 'No matching members found.'
                : orgSearchEnabled
                  ? 'No roster or organization members are available for this position.'
                  : 'No roster members are available for this position.'}
            </p>
          ) : (
            <>
              {filteredRosterMembers.length > 0 ? (
                <div className="space-y-1">
                  {orgSearchEnabled ? (
                    <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      On roster
                    </p>
                  ) : null}
                  {filteredRosterMembers.map((member) => (
                    <MemberResultButton
                      key={`roster-${member.id}`}
                      email={member.email}
                      detail={formatMemberPositionSummary(member.icsPositions)}
                      qualifications={member.qualifications}
                      onClick={() => {
                        onSelectRosterMember(member.id)
                        setOpen(false)
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {orgSearchEnabled && filteredOrgResults.length > 0 ? (
                <div className="space-y-1">
                  <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    From organization
                  </p>
                  {filteredOrgResults.map((result) => (
                    <MemberResultButton
                      key={`org-${result.id ?? result.email}`}
                      email={result.email}
                      detail={result.fullName}
                      qualifications={result.qualifications}
                      onClick={() => {
                        if (!result.id) return
                        onSelectOrgMember?.(result.id, result.email)
                        setOpen(false)
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
