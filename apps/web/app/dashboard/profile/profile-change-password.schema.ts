import { z } from "zod"

import { PROFILE_PASSWORD_MIN_LEN } from "@/app/dashboard/profile/profile-set-password.schema"

export const profileChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(
        PROFILE_PASSWORD_MIN_LEN,
        `Use at least ${PROFILE_PASSWORD_MIN_LEN} characters.`
      ),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from your current password.",
    path: ["newPassword"],
  })
