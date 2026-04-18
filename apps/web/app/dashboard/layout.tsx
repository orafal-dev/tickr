import Link from "next/link";
import { redirect } from "next/navigation";

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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        {children}
      </main>
    </div>
  );
}
