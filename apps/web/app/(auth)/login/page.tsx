import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your email and password to access your workspace.
        </CardDescription>
      </CardHeader>
      <CardPanel className="gap-4">
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-muted-foreground text-center text-sm">
          No account?{" "}
          <Link
            className="text-foreground font-medium underline underline-offset-4"
            href="/register"
          >
            Create one
          </Link>
        </p>
      </CardPanel>
    </Card>
  );
}
