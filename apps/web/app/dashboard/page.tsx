import { getSession } from "@/lib/auth";

export default async function DashboardHomePage() {
  const session = await getSession();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        You are authenticated with Better Auth. Server Components and server
        actions can call <code className="font-mono text-xs">getSession()</code>{" "}
        from{" "}
        <code className="font-mono text-xs">@/lib/auth</code>, and API calls to
        Nest can use{" "}
        <code className="font-mono text-xs">apiFetch</code> from{" "}
        <code className="font-mono text-xs">@/lib/api</code> to forward{" "}
        <code className="font-mono text-xs">x-user-id</code> (and optional{" "}
        <code className="font-mono text-xs">x-organization-id</code>) headers.
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
