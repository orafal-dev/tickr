import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import { AuthOAuthButtons } from "@/components/auth-oauth-buttons";
import { getConfiguredOAuthProviders } from "@/lib/oauth-providers.server";
import { ORGANIZATION_ONBOARDING_PATH } from "@/lib/onboarding-constants";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card";

export default function RegisterPage() {
  const oauthProviders = getConfiguredOAuthProviders();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Register with your email. You can invite teammates later.
        </CardDescription>
      </CardHeader>
      <CardPanel className="flex flex-col gap-4">
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <RegisterForm />
        </Suspense>
        {oauthProviders.length > 0 ? (
          <Suspense
            fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
          >
            <AuthOAuthButtons
              defaultPostAuthPath={ORGANIZATION_ONBOARDING_PATH}
              providers={oauthProviders}
            />
          </Suspense>
        ) : null}
        <p className="text-muted-foreground text-center text-sm">
          Already registered?{" "}
          <Link
            className="text-foreground font-medium underline underline-offset-4"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </CardPanel>
    </Card>
  );
}
