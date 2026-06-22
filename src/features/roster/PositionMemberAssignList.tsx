import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  dedupeOrgSearchResultsAgainstRoster,
  filterMembersBySearchQuery,
  formatMemberPositionSummary,
  isSelectableOrgMember,
  orgMemberStatusLabel,
  type OrgMemberPickerMode,
} from '@/features/roster/position-member-assign-picker'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

export type PositionMemberAssignSelection = {
  rosterMemberId: string | null
  userId: string | null
  email: string
}

type PositionMemberAssignListProps = {
  position: string
  query: string
  assignableMembers: WorkspaceRosterMember[]
  rosterMembersForDedupe: WorkspaceRosterMember[]
  selection: PositionMemberAssignSelection | null
  onSelectionChange: (selection: PositionMemberAssignSelection | null) => void
  onSearchOrgMembers?: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  orgPickerMode?: OrgMemberPickerMode
  disabled?: boolean
}

function AssignListButton({
  email,
  detail,
  statusLabel,
  selected,
  disabled,
  onClick,
}: {
  email: string
  detail?: string | null
  statusLabel?: string | null
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs',
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-muted',
        selected && !disabled && 'bg-primary/10 ring-1 ring-primary'
      )}
      onClick={onClick}
    >
      <span className="font-medium">{email}</span>
      {detail ? <span className="text-[11px] text-muted-foreground">{detail}</span> : null}
      {statusLabel ? (
        <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
      ) : null}
    </button>
  )
}

export function PositionMemberAssignList({
  position,
  query,
  assignableMembers,
  rosterMembersForDedupe,
  selection,
  onSelectionChange,
  onSearchOrgMembers,
  orgPickerMode = 'assign_to_position',
  disabled = false,
}: PositionMemberAssignListProps) {
  const [orgResults, setOrgResults] = useState<OrgMemberSearchResult[]>([])
  const [isSearchingOrg, setIsSearchingOrg] = useState(false)
  const orgSearchEnabled = Boolean(onSearchOrgMembers)

  useEffect(() => {
    if (!orgSearchEnabled || !onSearchOrgMembers) {
      setOrgResults([])
      return
    }

    const trimmed = query.trim()
    const timeout = window.setTimeout(() => {
      setIsSearchingOrg(true)
      void onSearchOrgMembers(trimmed, position)
        .then((results) => {
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
  }, [onSearchOrgMembers, orgSearchEnabled, position, query, rosterMembersForDedupe])

  const filteredRosterMembers = useMemo(
    () => filterMembersBySearchQuery(assignableMembers, query),
    [assignableMembers, query]
  )

  const filteredOrgResults = useMemo(
    () =>
      filterMembersBySearchQuery(orgResults, query, (result) => result.fullName).filter((result) =>
        isSelectableOrgMember(result, orgPickerMode)
      ),
    [orgResults, orgPickerMode, query]
  )

  const hasResults = filteredRosterMembers.length > 0 || filteredOrgResults.length > 0

  if (isSearchingOrg) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading people…
      </div>
    )
  }

  if (!hasResults) {
    return (
      <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
        {query.trim()
          ? 'No matching members found.'
          : orgSearchEnabled
            ? 'No roster or organization members are available for this position.'
            : 'No roster members are available for this position.'}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {filteredRosterMembers.length > 0 ? (
        <div className="space-y-1">
          {orgSearchEnabled ? (
            <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              On roster
            </p>
          ) : null}
          {filteredRosterMembers.map((member) => (
            <AssignListButton
              key={`roster-${member.id}`}
              email={member.email}
              detail={formatMemberPositionSummary(member.icsPositions)}
              selected={selection?.rosterMemberId === member.id}
              disabled={disabled}
              onClick={() => {
                onSelectionChange({
                  rosterMemberId: member.id,
                  userId: member.userId ?? null,
                  email: member.email,
                })
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
            <AssignListButton
              key={`org-${result.id ?? result.email}`}
              email={result.email}
              detail={result.fullName}
              statusLabel={orgMemberStatusLabel(result, orgPickerMode, position)}
              selected={selection?.userId === result.id && selection.rosterMemberId === null}
              disabled={disabled || !result.id}
              onClick={() => {
                if (!result.id) return
                onSelectionChange({
                  rosterMemberId: null,
                  userId: result.id,
                  email: result.email,
                })
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function isPositionAssignSelectionValid(
  selection: PositionMemberAssignSelection | null
): boolean {
  return Boolean(selection && (selection.rosterMemberId || selection.userId))
}
