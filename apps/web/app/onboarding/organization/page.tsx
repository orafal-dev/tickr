import { Suspense } from "react"

import { OrganizationOnboardingForm } from "@/app/onboarding/organization/organization-onboarding-form"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card"

const OrganizationOnboardingFallback = () => {
  return (
    <p className="text-sm text-muted-foreground" role="status">
      Loading…
    </p>
  )
}

export default function OnboardingOrganizationPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finish setting up</CardTitle>
        <CardDescription>
          Create your workspace. You can invite teammates and manage access from
          the dashboard later.
        </CardDescription>
      </CardHeader>
      <CardPanel className="gap-4">
        <Suspense fallback={<OrganizationOnboardingFallback />}>
          <OrganizationOnboardingForm />
        </Suspense>
      </CardPanel>
    </Card>
  )
}
