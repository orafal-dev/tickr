"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { organizationInviteSchema } from "@/app/dashboard/organization/organization-invite.schema"
import type {
  OrganizationInvitationRow,
  OrganizationMemberRow,
  OrganizationWorkspacePermissions,
} from "@/app/dashboard/organization/organization-management-view.types"
import { authClient } from "@/lib/auth-client"
import { fieldErrorsFromZodError } from "@/lib/zod-field-errors"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { buttonVariants } from "@workspace/ui/components/button.variants"
import { cn } from "@workspace/ui/lib/utils"

const ORG_ROLE_OPTIONS = ["member", "admin", "owner"] as const

const readPermissionSuccess = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return false
  }
  const record = value as Record<string, unknown>
  if (typeof record.success === "boolean") {
    return record.success
  }
  if (typeof record.hasPermission === "boolean") {
    return record.hasPermission
  }
  return false
}

const parsePrimaryRole = (role: string) => {
  const first = role.split(",")[0]?.trim()
  return first || "member"
}

const isOwnerRole = (role: string) =>
  role.split(",").map((r) => r.trim()).includes("owner")

export const OrganizationManagementView = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const organizations = authClient.useListOrganizations()

  const activeOrganizationId = session?.session.activeOrganizationId ?? ""
  const actorUserId = session?.user.id ?? ""

  const activeOrganization = useMemo(() => {
    if (!organizations.data || !activeOrganizationId) {
      return null
    }
    return organizations.data.find((row) => row.id === activeOrganizationId) ?? null
  }, [activeOrganizationId, organizations.data])

  const [orgName, setOrgName] = useState("")
  const [orgFormError, setOrgFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrganization) {
      setOrgName("")
      return
    }
    setOrgName(activeOrganization.name)
    setOrgFormError(null)
  }, [activeOrganization])

  const permissionsQuery = useQuery({
    queryKey: ["organization", "permissions", activeOrganizationId],
    queryFn: async (): Promise<OrganizationWorkspacePermissions> => {
      const organizationId = activeOrganizationId
      const checks = await Promise.all([
        authClient.organization.hasPermission({
          organizationId,
          permissions: { invitation: ["create"] },
        }),
        authClient.organization.hasPermission({
          organizationId,
          permissions: { invitation: ["cancel"] },
        }),
        authClient.organization.hasPermission({
          organizationId,
          permissions: { member: ["delete"] },
        }),
        authClient.organization.hasPermission({
          organizationId,
          permissions: { member: ["update"] },
        }),
        authClient.organization.hasPermission({
          organizationId,
          permissions: { organization: ["update"] },
        }),
        authClient.organization.hasPermission({
          organizationId,
          permissions: { organization: ["delete"] },
        }),
      ])
      const pick = (index: number) =>
        readPermissionSuccess(checks[index]?.data) && !checks[index]?.error
      return {
        canInvite: pick(0),
        canCancelInvitation: pick(1),
        canRemoveMember: pick(2),
        canUpdateMemberRole: pick(3),
        canUpdateOrganization: pick(4),
        canDeleteOrganization: pick(5),
      }
    },
    enabled: Boolean(activeOrganizationId),
  })

  const membersQuery = useQuery({
    queryKey: ["organization", "members", activeOrganizationId],
    queryFn: async () => {
      const response = await authClient.organization.listMembers({
        query: { organizationId: activeOrganizationId },
      })
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data.members as OrganizationMemberRow[]
    },
    enabled: Boolean(activeOrganizationId),
  })

  const invitationsQuery = useQuery({
    queryKey: ["organization", "invitations", activeOrganizationId],
    queryFn: async () => {
      const response = await authClient.organization.listInvitations({
        query: { organizationId: activeOrganizationId },
      })
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data as OrganizationInvitationRow[]
    },
    enabled: Boolean(activeOrganizationId),
  })

  const permissions = permissionsQuery.data

  const actorMember = useMemo(() => {
    const members = membersQuery.data ?? []
    return members.find((row) => row.user.id === actorUserId) ?? null
  }, [actorUserId, membersQuery.data])

  const actorIsOwner = actorMember ? isOwnerRole(actorMember.role) : false

  const [inviteFieldErrors, setInviteFieldErrors] = useState<
    Record<string, string | string[]>
  >({})
  const [inviteRole, setInviteRole] = useState<"member" | "admin" | "owner">(
    "member"
  )

  const invalidateOrgQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["organization", "members", activeOrganizationId],
    })
    void queryClient.invalidateQueries({
      queryKey: ["organization", "invitations", activeOrganizationId],
    })
    void queryClient.invalidateQueries({
      queryKey: ["organization", "permissions", activeOrganizationId],
    })
    organizations.refetch()
    void queryClient.invalidateQueries({ queryKey: ["pm"] })
  }, [activeOrganizationId, organizations, queryClient])

  const updateOrganizationMutation = useMutation({
    mutationFn: async (input: { name: string }) => {
      const response = await authClient.organization.update({
        organizationId: activeOrganizationId,
        data: {
          name: input.name.trim(),
        },
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not update workspace.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
      router.refresh()
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (input: {
      email: string
      role: "member" | "admin" | "owner"
    }) => {
      const response = await authClient.organization.inviteMember({
        email: input.email.trim().toLowerCase(),
        role: input.role,
        organizationId: activeOrganizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Invitation could not be sent.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const response = await authClient.organization.cancelInvitation({
        invitationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not cancel invitation.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberIdOrEmail: string) => {
      const response = await authClient.organization.removeMember({
        memberIdOrEmail,
        organizationId: activeOrganizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not remove member.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
      router.refresh()
    },
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: async (input: { memberId: string; role: string }) => {
      const response = await authClient.organization.updateMemberRole({
        memberId: input.memberId,
        role: input.role,
        organizationId: activeOrganizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not update role.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
    },
  })

  const leaveOrganizationMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.organization.leave({
        organizationId: activeOrganizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not leave workspace.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
      router.replace("/dashboard")
      router.refresh()
    },
  })

  const deleteOrganizationMutation = useMutation({
    mutationFn: async () => {
      const response = await authClient.organization.delete({
        organizationId: activeOrganizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? "Could not delete workspace.")
      }
      return response.data
    },
    onSuccess: () => {
      invalidateOrgQueries()
      router.replace("/dashboard")
      router.refresh()
    },
  })

  const handleOrganizationSave = () => {
    setOrgFormError(null)
    const name = orgName.trim()
    if (!name) {
      setOrgFormError("Name is required.")
      return
    }
    updateOrganizationMutation.mutate({ name })
  }

  const handleInviteSubmit = async (values: Record<string, unknown>) => {
    inviteMutation.reset()
    setInviteFieldErrors({})
    const roleRaw = inviteRole
    if (roleRaw === "owner" && !actorIsOwner) {
      setInviteFieldErrors({
        role: "Only owners can invite someone with the owner role.",
      })
      return
    }
    if (roleRaw === "owner") {
      const emailOnly = z
        .object({
          email: z.string().min(1).email("Enter a valid email address."),
        })
        .safeParse({ email: values.email })
      if (!emailOnly.success) {
        setInviteFieldErrors(fieldErrorsFromZodError(emailOnly.error))
        return
      }
      try {
        await inviteMutation.mutateAsync({
          email: emailOnly.data.email.trim().toLowerCase(),
          role: "owner",
        })
        setInviteRole("member")
      } catch {
        return
      }
      return
    }
    const parsed = organizationInviteSchema.safeParse({
      email: values.email,
      role: roleRaw,
    })
    if (!parsed.success) {
      setInviteFieldErrors(fieldErrorsFromZodError(parsed.error))
      return
    }
    try {
      await inviteMutation.mutateAsync(parsed.data)
      setInviteRole("member")
    } catch {
      return
    }
  }

  useEffect(() => {
    if (!actorIsOwner && inviteRole === "owner") {
      setInviteRole("member")
    }
  }, [actorIsOwner, inviteRole])

  const pendingInvitations = useMemo(() => {
    const rows = invitationsQuery.data ?? []
    return rows.filter((row) => row.status === "pending")
  }, [invitationsQuery.data])

  const membersList = membersQuery.data ?? []
  const isOnlyMemberInWorkspace = membersList.length === 1

  if (!session?.user) {
    return null
  }

  if (!activeOrganizationId || !activeOrganization) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-medium">Workspace</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Select or create a workspace to manage members and invitations.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No active workspace. Finish{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-2"
            href="/onboarding/organization"
          >
            onboarding
          </Link>{" "}
          or pick a workspace from the sidebar switcher.
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          href="/dashboard"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Workspace</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Members, invitations, and settings for{" "}
          <span className="font-medium text-foreground">
            {activeOrganization.name}
          </span>
          .
        </p>
      </div>

      <section
        aria-labelledby="workspace-details-heading"
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <h2
          className="font-heading text-lg font-medium"
          id="workspace-details-heading"
        >
          Details
        </h2>
        {!permissions?.canUpdateOrganization ? (
          <p className="text-sm text-muted-foreground">
            You can view this workspace but not edit its name.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-mgmt-name">Name</Label>
            <Input
              disabled={
                !permissions?.canUpdateOrganization ||
                updateOrganizationMutation.isPending
              }
              id="org-mgmt-name"
              onChange={(e) => {
                setOrgName(e.target.value)
              }}
              value={orgName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-mgmt-slug-readonly">URL slug</Label>
            <Input
              aria-label="Workspace URL slug, cannot be changed"
              className="bg-muted/40 font-mono text-muted-foreground"
              id="org-mgmt-slug-readonly"
              readOnly
              tabIndex={0}
              value={activeOrganization.slug ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              The slug is fixed and cannot be changed.
            </p>
          </div>
        </div>
        {orgFormError ? (
          <p className="text-sm text-destructive" role="alert">
            {orgFormError}
          </p>
        ) : null}
        {updateOrganizationMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {updateOrganizationMutation.error.message}
          </p>
        ) : null}
        {permissions?.canUpdateOrganization ? (
          <div className="flex flex-wrap gap-2">
            <Button
              loading={updateOrganizationMutation.isPending}
              onClick={() => {
                handleOrganizationSave()
              }}
              type="button"
            >
              Save changes
            </Button>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="workspace-members-heading"
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className="font-heading text-lg font-medium"
            id="workspace-members-heading"
          >
            Members
          </h2>
          {membersQuery.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {membersQuery.error.message}
            </p>
          ) : null}
        </div>
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[1%] text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersList.map((member) => {
              const primary = parsePrimaryRole(member.role)
              const isSelf = member.user.id === actorUserId
              const isOwnOwner = isSelf && isOwnerRole(member.role)
              const canEditRole =
                permissions?.canUpdateMemberRole && !isOwnOwner
              const canRemove =
                permissions?.canRemoveMember && !isSelf
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.user.name?.trim() || member.user.email}
                      </span>
                      {member.user.name?.trim() ? (
                        <span className="text-xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {canEditRole ? (
                        <Select
                          disabled={updateMemberRoleMutation.isPending}
                          onValueChange={(next) => {
                            if (typeof next !== "string" || next === primary) {
                              return
                            }
                            updateMemberRoleMutation.mutate({
                              memberId: member.id,
                              role: next,
                            })
                          }}
                          value={primary}
                        >
                          <SelectTrigger
                            aria-label={`Role for ${member.user.email}`}
                            nativeButton
                            size="sm"
                            type="button"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectPopup align="start" className="min-w-36">
                            {ORG_ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectPopup>
                        </Select>
                      ) : (
                        <span className="text-sm capitalize">{primary}</span>
                      )}
                      {isOwnOwner ? (
                        <p className="text-xs text-muted-foreground">
                          Your owner role cannot be changed from this page.
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    {canRemove ? (
                      <Button
                        disabled={removeMemberMutation.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Remove ${member.user.email} from this workspace?`
                            )
                          ) {
                            return
                          }
                          removeMemberMutation.mutate(member.id)
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </section>

      <section
        aria-labelledby="workspace-invite-heading"
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <h2
          className="font-heading text-lg font-medium"
          id="workspace-invite-heading"
        >
          Invite people
        </h2>
        {!permissions?.canInvite ? (
          <p className="text-sm text-muted-foreground">
            You do not have permission to invite users to this workspace.
          </p>
        ) : (
          <Form
            className="flex max-w-md flex-col gap-3"
            errors={inviteFieldErrors}
            noValidate
            onFormSubmit={(values) => {
              void handleInviteSubmit(values)
            }}
          >
            <Field name="email">
              <FieldLabel>Email</FieldLabel>
              <Input
                autoComplete="email"
                id="org-invite-email"
                name="email"
                placeholder="colleague@company.com"
                required
                type="email"
              />
              <FieldError />
            </Field>
            <Field name="role">
              <FieldLabel id="org-invite-role-label">Role</FieldLabel>
              <Select
                onValueChange={(next) => {
                  if (
                    next === "member" ||
                    next === "admin" ||
                    next === "owner"
                  ) {
                    setInviteRole(next)
                  }
                }}
                value={inviteRole}
              >
                <SelectTrigger
                  aria-labelledby="org-invite-role-label"
                  aria-label="Invitation role"
                  nativeButton
                  type="button"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup align="start" className="min-w-36">
                  <SelectItem value="member">member</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  {actorIsOwner ? (
                    <SelectItem value="owner">owner</SelectItem>
                  ) : null}
                </SelectPopup>
              </Select>
              <FieldError />
            </Field>
            {inviteMutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {inviteMutation.error.message}
              </p>
            ) : null}
            <Button
              className="w-fit"
              loading={inviteMutation.isPending}
              type="submit"
            >
              Send invitation
            </Button>
          </Form>
        )}
      </section>

      <section
        aria-labelledby="workspace-pending-heading"
        className="flex flex-col gap-3 rounded-lg border border-border p-4"
      >
        <h2
          className="font-heading text-lg font-medium"
          id="workspace-pending-heading"
        >
          Pending invitations
        </h2>
        {invitationsQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {invitationsQuery.error.message}
          </p>
        ) : null}
        {pendingInvitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[1%] text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell className="capitalize">
                    {parsePrimaryRole(invitation.role)}
                  </TableCell>
                  <TableCell className="text-end">
                    {permissions?.canCancelInvitation ? (
                      <Button
                        disabled={cancelInvitationMutation.isPending}
                        onClick={() => {
                          cancelInvitationMutation.mutate(invitation.id)
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section
        aria-labelledby="workspace-danger-heading"
        className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      >
        <h2
          className="font-heading text-lg font-medium text-destructive"
          id="workspace-danger-heading"
        >
          Leave or delete workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          Leaving removes you from this workspace. Deleting removes the
          workspace for everyone and cannot be undone.
        </p>
        {isOnlyMemberInWorkspace ? (
          <p className="text-sm text-muted-foreground" role="status">
            You are the only member, so you cannot leave this workspace. Invite
            someone else or delete the workspace instead.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={
              leaveOrganizationMutation.isPending || isOnlyMemberInWorkspace
            }
            onClick={() => {
              if (isOnlyMemberInWorkspace) {
                return
              }
              if (
                !window.confirm(
                  "Leave this workspace? You will need another member to invite you back."
                )
              ) {
                return
              }
              leaveOrganizationMutation.mutate()
            }}
            type="button"
            variant="outline"
          >
            Leave workspace
          </Button>
          {permissions?.canDeleteOrganization ? (
            <Button
              disabled={deleteOrganizationMutation.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `Permanently delete workspace "${activeOrganization.name}"? This cannot be undone.`
                  )
                ) {
                  return
                }
                deleteOrganizationMutation.mutate()
              }}
              type="button"
              variant="destructive"
            >
              Delete workspace
            </Button>
          ) : null}
        </div>
        {leaveOrganizationMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {leaveOrganizationMutation.error.message}
          </p>
        ) : null}
        {deleteOrganizationMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {deleteOrganizationMutation.error.message}
          </p>
        ) : null}
      </section>

      <Link
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        href="/dashboard"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
