import { z } from "zod";

export const organizationOnboardingFormSchema = z.object({
  name: z.string().trim().min(1, "Enter an organization name."),
  slug: z
    .string()
    .trim()
    .min(1, "Enter a URL slug.")
    .max(64, "Slug is too long.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens between words.",
    ),
});
