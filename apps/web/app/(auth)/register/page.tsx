import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Register with your email. You can invite teammates later.
        </CardDescription>
      </CardHeader>
      <CardPanel className="gap-4">
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <RegisterForm />
        </Suspense>
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
