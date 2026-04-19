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
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex w-full items-center justify-between gap-4">
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
      <div className="flex min-h-0 flex-1 flex-col">
        <DashboardQueryProvider>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b bg-muted/30 px-4 py-2 sm:px-6">
              <nav
                aria-label="Dashboard sections"
                className="flex w-max min-w-full flex-nowrap gap-1"
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
            <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-muted/15 p-4 sm:p-6 lg:p-8">
              {!session.user.emailVerified ? (
                <div
                  className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
                  role="status"
                >
                  Please confirm your email address. Check your inbox for the
                  link, or send another from{" "}
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
          </div>
        </DashboardQueryProvider>
      </div>
    </div>
  );
}
