import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardOrganizationSwitcher } from "@/app/dashboard/dashboard-organization-switcher";
import { DashboardQueryProvider } from "@/app/dashboard/dashboard-query-provider";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { getSession } from "@/lib/auth";
import { buttonVariants } from "@workspace/ui/components/button.variants";
import { cn } from "@workspace/ui/lib/utils";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col">
            <Link className="font-heading text-lg font-medium" href="/">
              Tickr
            </Link>
            <span className="text-muted-foreground truncate text-xs">
              Signed in as {session.user.email}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DashboardOrganizationSwitcher />
            <Link
              className={cn(buttonVariants({ variant: "ghost" }), "text-sm")}
              href="/dashboard/profile"
            >
              Profile
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/"
            >
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <DashboardQueryProvider>
        <div className="border-b bg-muted/20 px-6 py-2">
          <nav
            aria-label="Dashboard sections"
            className="mx-auto flex w-full max-w-5xl flex-wrap gap-1"
          >
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8",
              )}
              href="/dashboard"
            >
              Overview
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8",
              )}
              href="/dashboard/issues"
            >
              Issues
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8",
              )}
              href="/dashboard/projects"
            >
              Projects
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8",
              )}
              href="/dashboard/labels"
            >
              Labels
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8",
              )}
              href="/dashboard/notifications"
            >
              Notifications
            </Link>
          </nav>
        </div>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
          {!session.user.emailVerified ? (
            <div
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
              role="status"
            >
              Please confirm your email address. Check your inbox for the link,
              or send another from{" "}
              <Link
                className="font-medium underline underline-offset-2"
                href="/dashboard/profile"
              >
                Profile
              </Link>
              .
            </div>
          ) : null}
          {children}
        </main>
      </DashboardQueryProvider>
    </div>
  );
}
