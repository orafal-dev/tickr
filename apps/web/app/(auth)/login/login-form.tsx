"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFieldErrors({});
    setFormError(null);
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
        setFormError(result.error.message ?? "Unable to sign in.");
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
      <Button className="w-full" loading={isSubmitting} type="submit">
        Sign in
      </Button>
    </Form>
  );
};
