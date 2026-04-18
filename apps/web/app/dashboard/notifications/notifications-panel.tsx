"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { pmJson } from "@/lib/pm-browser";
import type { PmNotification } from "@/lib/pm.types";
import { Button } from "@workspace/ui/components/button";

export const NotificationsPanel = () => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const activeOrganizationId = session?.session.activeOrganizationId ?? "";

  const notificationsQuery = useQuery({
    queryKey: ["pm", "notifications"],
    queryFn: () => pmJson<PmNotification[]>("/notifications"),
    enabled: Boolean(activeOrganizationId),
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await pmJson<undefined>(`/notifications/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await pmJson<undefined>("/notifications/read-all", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pm", "notifications"] });
    },
  });

  if (!activeOrganizationId) {
    return (
      <p className="text-muted-foreground text-sm">
        Select a workspace from the header first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium">Notifications</h1>
          <p className="text-muted-foreground text-sm">
            Assignment and comment activity for your user in this workspace.
          </p>
        </div>
        <Button
          disabled={markAllMutation.isPending}
          onClick={() => {
            markAllMutation.mutate();
          }}
          type="button"
          variant="outline"
        >
          Mark all read
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {(notificationsQuery.data ?? []).map((notification) => (
          <li
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-sm shadow-xs/5 sm:flex-row sm:items-start sm:justify-between"
            key={notification.id}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{notification.title}</p>
              {notification.body ? (
                <p className="text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                  {notification.body}
                </p>
              ) : null}
              <p className="text-muted-foreground mt-2 text-xs">
                {new Date(notification.createdAt).toLocaleString()}
                {notification.readAt ? (
                  <span className="ms-2">· Read</span>
                ) : (
                  <span className="ms-2">· Unread</span>
                )}
              </p>
              {notification.issueId ? (
                <Link
                  className="text-primary mt-2 inline-block text-xs underline-offset-2 hover:underline"
                  href={`/dashboard/issues/${notification.issueId}`}
                >
                  Open issue
                </Link>
              ) : null}
            </div>
            {!notification.readAt ? (
              <Button
                disabled={markReadMutation.isPending}
                onClick={() => {
                  markReadMutation.mutate(notification.id);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Mark read
              </Button>
            ) : null}
          </li>
        ))}
        {!notificationsQuery.isPending &&
        (notificationsQuery.data ?? []).length === 0 ? (
          <li className="text-muted-foreground text-sm">You are all caught up.</li>
        ) : null}
      </ul>
    </div>
  );
};
