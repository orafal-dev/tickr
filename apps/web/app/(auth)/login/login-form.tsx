"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { LoginResendVerification } from "@/app/(auth)/login/login-resend-verification";
import { authClient } from "@/lib/auth-client";
import { ORGANIZATION_ONBOARDING_PATH } from "@/lib/onboarding-constants";
import { resolveSafeInternalPath } from "@/lib/safe-internal-path";
import { fieldErrorsFromZodError } from "@/lib/zod-field-errors";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";

import { loginFormSchema } from "./login-form.schema";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postAuthRedirect = resolveSafeInternalPath(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailUnverifiedHelp, setShowEmailUnverifiedHelp] = useState(false);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFieldErrors({});
    setFormError(null);
    setShowEmailUnverifiedHelp(false);
    setResendEmail(null);
    const parsed = loginFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodError(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (result.error) {
        const message = result.error.message ?? "Unable to sign in.";
        setFormError(message);
        const code =
          "code" in result.error
            ? String((result.error as { code?: string }).code ?? "")
            : "";
        const looksUnverified =
          code === "EMAIL_NOT_VERIFIED" ||
          message.toLowerCase().includes("verify");
        setShowEmailUnverifiedHelp(looksUnverified);
        setResendEmail(looksUnverified ? parsed.data.email : null);
        return;
      }
      let destination = postAuthRedirect;
      if (destination === "/dashboard") {
        const listed = await authClient.organization.list();
        if (
          !listed.error &&
          Array.isArray(listed.data) &&
          listed.data.length === 0
        ) {
          destination = ORGANIZATION_ONBOARDING_PATH;
        }
      }
      router.push(destination);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      className="flex w-full flex-col gap-4"
      errors={fieldErrors}
      noValidate
      onFormSubmit={(values) => {
        void handleFormSubmit(values);
      }}
    >
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input
          autoComplete="email"
          id="login-email"
          inputMode="email"
          name="email"
          placeholder="you@company.com"
          required
          type="email"
        />
        <FieldError />
      </Field>
      <Field name="password">
        <FieldLabel>Password</FieldLabel>
        <Input
          autoComplete="current-password"
          id="login-password"
          name="password"
          required
          type="password"
        />
        <FieldError />
      </Field>
      {formError ? (
        <p className="text-destructive text-sm" id="login-error" role="alert">
          {formError}
        </p>
      ) : null}
      {showEmailUnverifiedHelp && resendEmail ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
            Confirm your email using the link we sent when you registered. After
            you confirm, sign in again here.
          </p>
          <LoginResendVerification
            callbackURL={postAuthRedirect}
            email={resendEmail}
          />
        </div>
      ) : null}
      <Button className="w-full" loading={isSubmitting} type="submit">
        Sign in
      </Button>
    </Form>
  );
};
