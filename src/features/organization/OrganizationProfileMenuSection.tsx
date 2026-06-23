import { Check, Plus, Users } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { resolveDisplayOrganization } from '@/lib/organization-service'
import type { UserOrganization } from '@/lib/organization-types'

type OrganizationProfileMenuSectionProps = {
  organizations: UserOrganization[]
  activeOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
  onCreateOrganization: () => void
  onManageMembers: () => void
  canManageMembers: boolean
}

export function OrganizationProfileMenuSection({
  organizations,
  activeOrganizationId,
  onSelectOrganization,
  onCreateOrganization,
  onManageMembers,
  canManageMembers,
}: OrganizationProfileMenuSectionProps) {
  const activeOrganization = resolveDisplayOrganization(
    organizations,
    activeOrganizationId
  )

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
        Organization
        {activeOrganization
          ? ` · ${activeOrganization.role === 'admin' ? 'Admin' : 'Member'}`
          : ''}
      </DropdownMenuLabel>
      {organizations.length === 0 ? (
        <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
      ) : (
        organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.organizationId}
            onClick={() => onSelectOrganization(organization.organizationId)}
            className="flex items-center justify-between gap-2"
          >
            <span className="min-w-0 truncate">{organization.name}</span>
            {organization.organizationId === activeOrganizationId ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : null}
          </DropdownMenuItem>
        ))
      )}
      <DropdownMenuItem onClick={onCreateOrganization}>
        <Plus className="mr-2 h-4 w-4" />
        Create organization
      </DropdownMenuItem>
      {canManageMembers ? (
        <DropdownMenuItem onClick={onManageMembers}>
          <Users className="mr-2 h-4 w-4" />
          Manage members
        </DropdownMenuItem>
      ) : null}
    </>
  )
}
