"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { authClient } from "@/lib/auth-client"
import { pmJson } from "@/lib/pm-browser"
import type { PmNotification } from "@/lib/pm.types"
import { buttonVariants } from "@workspace/ui/components/button.variants"
import {
  Popover,
  PopoverClose,
  PopoverPopup,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { cn } from "@workspace/ui/lib/utils"
import { Notification01Icon } from "@hugeicons/core-free-icons"

const PREVIEW_LIMIT = 5

export const HeaderNotificationsPopover = () => {
  const { data: session } = authClient.useSession()
  const activeOrganizationId = session?.session.activeOrganizationId ?? ""

  const notificationsQuery = useQuery({
    queryKey: ["pm", "notifications"],
    queryFn: () => pmJson<PmNotification[]>("/notifications"),
    enabled: Boolean(activeOrganizationId),
  })

  const items = (notificationsQuery.data ?? []).slice(0, PREVIEW_LIMIT)
  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.readAt)
    .length

  if (!activeOrganizationId) {
    return (
      <button
        aria-label="Notifications (select a workspace to view)"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "pointer-events-none opacity-40"
        )}
        disabled
        type="button"
      >
        <UiIcon aria-hidden className="size-4" icon={Notification01Icon} />
      </button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative shrink-0"
        )}
        type="button"
      >
        <UiIcon aria-hidden className="size-4" icon={Notification01Icon} />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute end-1 top-1 size-2 rounded-full bg-primary ring-2 ring-background"
          />
        ) : null}
      </PopoverTrigger>
      <PopoverPopup align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex flex-col">
          <div className="border-b px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-xs text-muted-foreground">Latest in this workspace</p>
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {notificationsQuery.isPending ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Loading…
              </li>
            ) : null}
            {!notificationsQuery.isPending && items.length === 0 ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">
                You are all caught up.
              </li>
            ) : null}
            {items.map((notification) => {
              const href = notification.issueId
                ? `/dashboard/issues/${notification.issueId}`
                : "/dashboard/notifications"
              return (
                <li key={notification.id}>
                  <PopoverClose
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-start text-sm transition-colors hover:bg-muted/80"
                    nativeButton={false}
                    render={<Link href={href} prefetch={false} />}
                  >
                    <span className="font-medium leading-snug">
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                      {!notification.readAt ? (
                        <span className="ms-1 text-primary">· Unread</span>
                      ) : null}
                    </span>
                  </PopoverClose>
                </li>
              )
            })}
          </ul>
          <div className="border-t px-2 py-2">
            <PopoverClose
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-8 w-full justify-center text-xs font-medium text-primary"
              )}
              nativeButton={false}
              render={
                <Link href="/dashboard/notifications" prefetch={false} />
              }
            >
              See all
            </PopoverClose>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  )
}
