import Link from "next/link";

import { getSession } from "@/lib/auth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@workspace/ui/components/card";

const dashboardShortcuts = [
  {
    href: "/dashboard/issues",
    title: "Issues",
    description: "Board and table views, filters, and issue keys for your workspace.",
  },
  {
    href: "/dashboard/projects",
    title: "Projects",
    description: "Group work and keep issue lists scoped to the right initiative.",
  },
  {
    href: "/dashboard/labels",
    title: "Labels",
    description: "Tag and filter issues with shared labels across the org.",
  },
  {
    href: "/dashboard/notifications",
    title: "Notifications",
    description: "Stay on top of updates without leaving the product surface.",
  },
] as const;

export default async function DashboardHomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
          Overview
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed sm:text-base">
          Your workspace hub: jump into tracking work, organizing projects, and
          managing how issues are labeled and surfaced.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardShortcuts.map((item) => (
          <Link
            className="group block h-full min-h-[9.5rem] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            href={item.href}
            key={item.href}
          >
            <Card className="h-full border-border/80 bg-card/80 transition-[border-color,box-shadow,background-color] group-hover:border-primary/25 group-hover:bg-card group-hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  {item.title}
                  <span
                    aria-hidden
                    className="text-muted-foreground text-sm transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Session & API</CardTitle>
          <CardDescription>
            Server code calls Nest through{" "}
            <code className="font-mono text-xs text-foreground">apiFetch</code>{" "}
            from{" "}
            <code className="font-mono text-xs text-foreground">@/lib/api</code>
            , forwarding{" "}
            <code className="font-mono text-xs text-foreground">x-user-id</code>,{" "}
            <code className="font-mono text-xs text-foreground">
              x-organization-id
            </code>
            , and{" "}
            <code className="font-mono text-xs text-foreground">
              x-api-internal-key
            </code>
            .
          </CardDescription>
        </CardHeader>
        {session ? (
          <CardPanel className="border-t pt-0">
            <p className="text-muted-foreground text-sm">
              Current user id:{" "}
              <span className="font-mono text-xs text-foreground">
                {session.user.id}
              </span>
            </p>
          </CardPanel>
        ) : null}
      </Card>
    </div>
  );
}
