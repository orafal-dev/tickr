export type OrganizationMemberRow = {
  id: string
  userId: string
  organizationId: string
  role: string
  user: {
    id: string
    email: string
    name?: string | null
  }
}

export type OrganizationInvitationRow = {
  id: string
  email: string
  role: string
  organizationId: string
  status: string
  expiresAt: string | Date
  createdAt?: string | Date
}

export type OrganizationWorkspacePermissions = {
  canInvite: boolean
  canCancelInvitation: boolean
  canRemoveMember: boolean
  canUpdateMemberRole: boolean
  canUpdateOrganization: boolean
  canDeleteOrganization: boolean
}
