import type { organizationOnboardingFormSchema } from "./organization-onboarding-form.schema"
import type { z } from "zod"

export type OrganizationOnboardingFormValues = z.infer<
  typeof organizationOnboardingFormSchema
>
