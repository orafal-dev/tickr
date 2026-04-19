import { z } from "zod"

/** Matches Better Auth default `minPasswordLength` (8) when not overridden. */
export const PROFILE_PASSWORD_MIN_LEN = 8

export const profileSetPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        PROFILE_PASSWORD_MIN_LEN,
        `Use at least ${PROFILE_PASSWORD_MIN_LEN} characters.`
      ),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
