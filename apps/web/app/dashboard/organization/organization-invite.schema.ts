import { z } from "zod"

export const organizationInviteRoleSchema = z.enum(["member", "admin"])

export const organizationInviteSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  role: organizationInviteRoleSchema,
})
