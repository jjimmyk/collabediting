export type OrganizationMemberRole = 'admin' | 'member'
export type OrganizationMemberStatus = 'invited' | 'active' | 'removed'

export type UserOrganization = {
  organizationId: string
  name: string
  slug: string
  role: OrganizationMemberRole
  status: OrganizationMemberStatus
}

export type OrganizationMemberRecord = {
  id: string
  userId: string | null
  email: string
  fullName: string | null
  role: OrganizationMemberRole
  status: OrganizationMemberStatus
  joinedAt: string | null
}

export type OrganizationMemberProfile = {
  organizationMemberId: string
  phone: string | null
  address: string | null
  defaultRadioContact: string | null
  homeAorNodeId: string | null
  qualifications: string[]
}

export type OrganizationMemberProfileUpdateInput = {
  phone?: string | null
  address?: string | null
  defaultRadioContact?: string | null
  homeAorNodeId?: string | null
  qualifications?: string[]
}

export type CreatedOrganization = {
  organizationId: string
  name: string
  slug: string
}
