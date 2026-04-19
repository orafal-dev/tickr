import Link from "next/link"
import { Suspense } from "react"

import { LoginForm } from "@/app/(auth)/login/login-form"
import { AuthOAuthButtons } from "@/components/auth-oauth-buttons"
import { getConfiguredOAuthProviders } from "@/lib/oauth-providers.server"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card"

export default function LoginPage() {
  const oauthProviders = getConfiguredOAuthProviders()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your email and password to access your workspace.
        </CardDescription>
      </CardHeader>
      <CardPanel className="flex flex-col gap-4">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <LoginForm />
        </Suspense>
        {oauthProviders.length > 0 ? (
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
          >
            <AuthOAuthButtons
              defaultPostAuthPath="/dashboard"
              providers={oauthProviders}
            />
          </Suspense>
        ) : null}
        <p className="text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            href="/register"
          >
            Create one
          </Link>
        </p>
      </CardPanel>
    </Card>
  )
}
