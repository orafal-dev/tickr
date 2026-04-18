import { getSession } from "@/lib/auth";

export default async function DashboardHomePage() {
  const session = await getSession();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Use the navigation bar for{" "}
        <span className="font-medium text-foreground">Issues</span>,{" "}
        <span className="font-medium text-foreground">Projects</span>,{" "}
        <span className="font-medium text-foreground">Labels</span>, and{" "}
        <span className="font-medium text-foreground">Notifications</span>{" "}
        (Linear-style MVP). Server code calls Nest through{" "}
        <code className="font-mono text-xs">apiFetch</code> from{" "}
        <code className="font-mono text-xs">@/lib/api</code>, which forwards{" "}
        <code className="font-mono text-xs">x-user-id</code>,{" "}
        <code className="font-mono text-xs">x-organization-id</code>, and{" "}
        <code className="font-mono text-xs">x-api-internal-key</code>.
      </p>
      {session ? (
        <p className="text-sm">
          Current user id:{" "}
          <span className="font-mono text-xs">{session.user.id}</span>
        </p>
      ) : null}
    </div>
  );
}
