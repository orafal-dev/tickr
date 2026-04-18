import Link from "next/link";

import { getSession } from "@/lib/auth";
import { buttonVariants } from "@workspace/ui/components/button.variants";
import { cn } from "@workspace/ui/lib/utils";

export default async function Page() {
  const session = await getSession();

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-heading font-medium">Tickr</h1>
          <p>
            Next.js is wired with Better Auth (session cookies,{" "}
            <code className="font-mono text-xs">/api/auth</code>, and Postgres
            via <code className="font-mono text-xs">DATABASE_URL</code>).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {session ? (
              <Link
                className={cn(buttonVariants())}
                href="/dashboard"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link className={cn(buttonVariants())} href="/login">
                  Sign in
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href="/register"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        <p className="text-muted-foreground font-mono text-xs">
          Press <kbd>d</kbd> to toggle dark mode
        </p>
      </div>
    </div>
  );
}
