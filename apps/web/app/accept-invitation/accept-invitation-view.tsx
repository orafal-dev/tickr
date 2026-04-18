"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card";

export const AcceptInvitationView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [status, setStatus] = useState<"idle" | "accepting" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const loginHref = invitationId
    ? `/login?callbackUrl=${encodeURIComponent(
        `/accept-invitation?invitationId=${invitationId}`,
      )}`
    : "/login";

  useEffect(() => {
    if (!invitationId) {
      setStatus("error");
      setMessage("Missing invitation. Check the link in your email.");
      return;
    }
    if (sessionPending) {
      return;
    }
    if (!session) {
      return;
    }
    if (attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;

    const accept = async () => {
      setStatus("accepting");
      setMessage(null);
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });
      if (result.error) {
        setStatus("error");
        setMessage(result.error.message ?? "Could not accept invitation.");
        attemptedRef.current = false;
        return;
      }
      router.refresh();
      router.push("/dashboard");
    };

    void accept();
  }, [invitationId, router, session, sessionPending]);

  if (!invitationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid invitation</CardTitle>
          <CardDescription>
            This link is missing the invitation identifier.
          </CardDescription>
        </CardHeader>
        <CardPanel>
          <Button className="w-full" render={<Link href="/login" />}>
            Sign in
          </Button>
        </CardPanel>
      </Card>
    );
  }

  if (sessionPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
          <CardDescription>Checking your session…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            You need an account that matches the invited email before accepting
            this invitation.
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-3">
          <Button className="w-full" render={<Link href={loginHref} />}>
            Sign in
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link
              className="text-foreground font-medium underline underline-offset-4"
              href={`/register?callbackUrl=${encodeURIComponent(
                `/accept-invitation?invitationId=${invitationId}`,
              )}`}
            >
              Create an account
            </Link>
          </p>
        </CardPanel>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription aria-live="polite" role="status">
            {message}
          </CardDescription>
        </CardHeader>
        <CardPanel className="flex flex-col gap-2">
          <Button
            onClick={() => {
              attemptedRef.current = false;
              setStatus("idle");
              setMessage(null);
            }}
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
          <Button render={<Link href="/dashboard" />} variant="ghost">
            Go to dashboard
          </Button>
        </CardPanel>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accepting invitation</CardTitle>
        <CardDescription>Adding you to the organization…</CardDescription>
      </CardHeader>
    </Card>
  );
};
