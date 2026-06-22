import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserOrganization } from '@/lib/organization-types'
import { cn } from '@/lib/utils'

type OrganizationSwitcherProps = {
  organizations: UserOrganization[]
  activeOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
  onCreateOrganization: () => void
  onManageMembers: () => void
  canManageMembers: boolean
}

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
  onSelectOrganization,
  onCreateOrganization,
  onManageMembers,
  canManageMembers,
}: OrganizationSwitcherProps) {
  const activeOrganization =
    organizations.find((org) => org.organizationId === activeOrganizationId) ?? organizations[0] ?? null

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {activeOrganization?.name ?? 'Select organization'}
              </span>
              {activeOrganization ? (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {activeOrganization.slug}
                </span>
              ) : null}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[288px]">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((organization) => (
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
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateOrganization}>
            <Plus className="h-4 w-4" />
            Create organization
          </DropdownMenuItem>
          {canManageMembers ? (
            <DropdownMenuItem onClick={onManageMembers}>
              <Users className="h-4 w-4" />
              Manage members
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {activeOrganization ? (
        <p className={cn('px-1 text-[11px] text-muted-foreground')}>
          Active organization · {activeOrganization.role === 'admin' ? 'Admin' : 'Member'}
        </p>
      ) : null}
    </div>
  )
}
