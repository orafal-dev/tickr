"use client"

import {
  LogoutIcon,
  NotificationIcon,
  UnfoldMoreIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import { authClient } from "@/lib/auth-client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@workspace/ui/components/menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
  sidebarMenuButtonVariants,
} from "@workspace/ui/components/sidebar"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { cn } from "@workspace/ui/lib/utils"

const userInitials = (name: string | null | undefined, email: string) => {
  const trimmedName = name?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase()
    }
    const single = parts[0]
    if (single && single.length >= 2) {
      return single.slice(0, 2).toUpperCase()
    }
    if (single && single.length === 1) {
      return single.toUpperCase()
    }
  }
  const local = email.split("@")[0] ?? ""
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase()
  }
  return email[0]?.toUpperCase() ?? "?"
}

export const NavUser = () => {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session, isPending } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      router.push("/")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }, [router])

  if (isPending || !session?.user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "pointer-events-none animate-pulse gap-2"
            )}
            data-sidebar="menu-button"
            data-slot="sidebar-menu-button"
          >
            <span className="size-8 rounded-lg bg-sidebar-accent" />
            <div className="grid flex-1 gap-1.5 text-left">
              <span className="h-3.5 rounded bg-sidebar-accent" />
              <span className="h-3 w-2/3 rounded bg-sidebar-accent" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const user = session.user
  const displayName = user.name?.trim() || "Account"
  const email = user.email
  const avatarUrl = user.image ?? ""
  const initials = userInitials(user.name, email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "w-full aria-expanded:bg-sidebar-accent"
            )}
            data-sidebar="menu-button"
            data-size="lg"
            data-slot="sidebar-menu-button"
            nativeButton
          >
            <Avatar className="size-8 rounded-lg">
              {avatarUrl ? (
                <AvatarImage alt={displayName} src={avatarUrl} />
              ) : null}
              <AvatarFallback className="rounded-lg text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
            <UiIcon
              aria-hidden
              className="ml-auto size-4 shrink-0"
              icon={UnfoldMoreIcon}
            />
          </MenuTrigger>
          <MenuPopup
            align="end"
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <MenuGroup>
              <MenuGroupLabel className="font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    {avatarUrl ? (
                      <AvatarImage alt={displayName} src={avatarUrl} />
                    ) : null}
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                </div>
              </MenuGroupLabel>
            </MenuGroup>
            <MenuSeparator />
            <MenuGroup>
              <MenuLinkItem
                closeOnClick
                render={<Link href="/dashboard/profile" />}
              >
                <UiIcon aria-hidden icon={UserCircleIcon} />
                Profile
              </MenuLinkItem>
              <MenuLinkItem
                closeOnClick
                render={<Link href="/dashboard/notifications" />}
              >
                <UiIcon aria-hidden icon={NotificationIcon} />
                Notifications
              </MenuLinkItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem
              closeOnClick
              disabled={isSigningOut}
              onClick={() => {
                void handleSignOut()
              }}
              variant="destructive"
            >
              <UiIcon aria-hidden icon={LogoutIcon} />
              Sign out
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
