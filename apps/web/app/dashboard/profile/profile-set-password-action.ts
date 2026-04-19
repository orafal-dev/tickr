"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/better-auth-instance"

import { profileSetPasswordFormSchema } from "./profile-set-password.schema"
import type { SetProfilePasswordResult } from "./profile-set-password-form.types"

export const setProfilePassword = async (input: {
  newPassword: string
  confirmPassword: string
}): Promise<SetProfilePasswordResult> => {
  const parsed = profileSetPasswordFormSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      message: first?.message ?? "Invalid password.",
    }
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: parsed.data.newPassword },
      headers: await headers(),
    })
    return { ok: true }
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Unable to set password."
    return { ok: false, message }
  }
}
