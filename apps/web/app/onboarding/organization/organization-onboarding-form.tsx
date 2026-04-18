"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { slugifyOrganizationSlug } from "@/lib/slugify-organization";
import { fieldErrorsFromZodError } from "@/lib/zod-field-errors";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Form } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";

import { organizationOnboardingFormSchema } from "./organization-onboarding-form.schema";

export const OrganizationOnboardingForm = () => {
  const router = useRouter();
  const organizations = authClient.useListOrganizations();
  const slugEditedByUserRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [slugHint, setSlugHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organizations.isPending) {
      return;
    }
    if (organizations.data && organizations.data.length > 0) {
      router.replace("/dashboard");
    }
  }, [organizations.data, organizations.isPending, router]);

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFieldErrors({});
    setFormError(null);
    const parsed = organizationOnboardingFormSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZodError(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await authClient.organization.create({
        name: parsed.data.name,
        slug: parsed.data.slug,
      });
      if (created.error) {
        setFormError(created.error.message ?? "Could not create workspace.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (organizations.isPending) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading your workspace…
      </p>
    );
  }

  if (organizations.data && organizations.data.length > 0) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Redirecting…
      </p>
    );
  }

  return (
    <Form
      className="flex w-full flex-col gap-4"
      errors={fieldErrors}
      noValidate
      onFormSubmit={(values) => {
        void handleFormSubmit(values);
      }}
    >
      <Field name="name">
        <FieldLabel>Organization name</FieldLabel>
        <Input
          ref={nameInputRef}
          autoComplete="organization"
          id="onboarding-org-name"
          name="name"
          onChange={(e) => {
            if (slugEditedByUserRef.current) {
              return;
            }
            const nextSlug = slugifyOrganizationSlug(e.target.value);
            if (slugInputRef.current) {
              slugInputRef.current.value = nextSlug;
            }
          }}
          placeholder="Acme Capital"
          required
          type="text"
        />
        <FieldError />
      </Field>
      <Field name="slug">
        <FieldLabel>URL slug</FieldLabel>
        <Input
          ref={slugInputRef}
          autoComplete="off"
          id="onboarding-org-slug"
          name="slug"
          onBlur={async (e) => {
            const slug = e.target.value.trim();
            if (!slug) {
              setSlugHint(null);
              return;
            }
            const checked = await authClient.organization.checkSlug({
              slug,
            });
            if (checked.error) {
              setSlugHint("That slug is already taken. Try another.");
              return;
            }
            setSlugHint("That slug is available.");
          }}
          onChange={() => {
            slugEditedByUserRef.current = true;
            setSlugHint(null);
          }}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="acme-capital"
          required
          spellCheck={false}
          title="Lowercase letters, numbers, and hyphens only"
          type="text"
        />
        <FieldError />
        {slugHint ? (
          <p
            className={
              slugHint.includes("taken")
                ? "text-destructive text-sm"
                : "text-muted-foreground text-sm"
            }
            id="onboarding-slug-hint"
            role="status"
          >
            {slugHint}
          </p>
        ) : null}
      </Field>
      {formError ? (
        <p
          className="text-destructive text-sm"
          id="onboarding-org-error"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <Button className="w-full" loading={isSubmitting} type="submit">
        Continue to dashboard
      </Button>
    </Form>
  );
};
