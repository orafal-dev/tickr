"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { profileChangePasswordFormSchema } from "@/app/dashboard/profile/profile-change-password.schema"
import { setProfilePassword } from "@/app/dashboard/profile/profile-set-password-action"
import {
  PROFILE_PASSWORD_MIN_LEN,
  profileSetPasswordFormSchema,
} from "@/app/dashboard/profile/profile-set-password.schema"
import { authClient } from "@/lib/auth-client"
import { fieldErrorsFromZodError } from "@/lib/zod-field-errors"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"

type ProfilePasswordFormProps = {
  /** When true, user already has email/password and should use change-password flow. */
  hasCredentialAccount: boolean
  onPasswordSaved?: () => void
}

export const ProfilePasswordForm = ({
  hasCredentialAccount,
  onPasswordSaved,
}: ProfilePasswordFormProps) => {
  const router = useRouter()
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | string[]>
  >({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSetPasswordSubmit = async (values: Record<string, unknown>) => {
    setFieldErrors({})
    setFormError(null)
    const parsed = profileSetPasswordFormSchema.safeParse({
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    })
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodError(parsed.error))
      return
    }

    setIsSubmitting(true)
    try {
      const result = await setProfilePassword(parsed.data)
      if (!result.ok) {
        setFormError(result.message)
        return
      }
      onPasswordSaved?.()
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong."
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePasswordSubmit = async (values: Record<string, unknown>) => {
    setFieldErrors({})
    setFormError(null)
    const parsed = profileChangePasswordFormSchema.safeParse({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    })
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodError(parsed.error))
      return
    }

    setIsSubmitting(true)
    try {
      const result = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) {
        setFormError(result.error.message ?? "Unable to change password.")
        return
      }
      onPasswordSaved?.()
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong."
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasCredentialAccount) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Change password</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Enter your current password, then choose a new one.
        </p>
        <Form
          className="flex flex-col gap-4"
          errors={fieldErrors}
          noValidate
          onFormSubmit={(values) => {
            void handleChangePasswordSubmit(values)
          }}
        >
          <Field name="currentPassword">
            <FieldLabel>Current password</FieldLabel>
            <Input
              autoComplete="current-password"
              id="profile-current-password"
              name="currentPassword"
              required
              type="password"
            />
            <FieldError />
          </Field>
          <Field name="newPassword">
            <FieldLabel>New password</FieldLabel>
            <Input
              autoComplete="new-password"
              id="profile-change-new-password"
              minLength={PROFILE_PASSWORD_MIN_LEN}
              name="newPassword"
              required
              type="password"
            />
            <FieldError />
          </Field>
          <Field name="confirmPassword">
            <FieldLabel>Confirm new password</FieldLabel>
            <Input
              autoComplete="new-password"
              id="profile-change-confirm-password"
              minLength={PROFILE_PASSWORD_MIN_LEN}
              name="confirmPassword"
              required
              type="password"
            />
            <FieldError />
          </Field>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button className="w-fit" loading={isSubmitting} type="submit">
            Update password
          </Button>
        </Form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">Set password</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        You signed up with a social account. Add a password if you want to sign
        in with your email as well.
      </p>
      <Form
        className="flex flex-col gap-4"
        errors={fieldErrors}
        noValidate
        onFormSubmit={(values) => {
          void handleSetPasswordSubmit(values)
        }}
      >
        <Field name="newPassword">
          <FieldLabel>New password</FieldLabel>
          <Input
            autoComplete="new-password"
            id="profile-new-password"
            minLength={PROFILE_PASSWORD_MIN_LEN}
            name="newPassword"
            required
            type="password"
          />
          <FieldError />
        </Field>
        <Field name="confirmPassword">
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            autoComplete="new-password"
            id="profile-confirm-password"
            minLength={PROFILE_PASSWORD_MIN_LEN}
            name="confirmPassword"
            required
            type="password"
          />
          <FieldError />
        </Field>
        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
        <Button className="w-fit" loading={isSubmitting} type="submit">
          Save password
        </Button>
      </Form>
    </div>
  )
}
