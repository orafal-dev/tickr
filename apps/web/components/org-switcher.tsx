"use client"

import { UnfoldMoreIcon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { authClient } from "@/lib/auth-client"
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@workspace/ui/components/menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { cn } from "@workspace/ui/lib/utils"

const organizationInitial = (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) {
    return "?"
  }
  return trimmed.slice(0, 1).toUpperCase()
}

export const OrgSwitcher = () => {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const organizations = authClient.useListOrganizations()
  const [isSaving, setIsSaving] = useState(false)

  const activeOrganizationId = session?.session.activeOrganizationId ?? ""

  const organizationOptions = useMemo(() => {
    if (!organizations.data || organizations.error) {
      return []
    }
    return organizations.data.map((organization) => ({
      id: organization.id,
      name: organization.name,
    }))
  }, [organizations.data, organizations.error])

  useEffect(() => {
    if (sessionPending || organizations.isPending) {
      return
    }
    if (!session?.user) {
      return
    }
    if (session.session.activeOrganizationId) {
      return
    }
    const firstId = organizations.data?.[0]?.id
    if (!firstId) {
      return
    }
    let cancelled = false
    void (async () => {
      const result = await authClient.organization.setActive({
        organizationId: firstId,
      })
      if (!cancelled && !result.error) {
        router.refresh()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    organizations.data,
    organizations.isPending,
    organizations.error,
    router,
    session,
    sessionPending,
  ])

  const handleOrganizationChange = useCallback(
    async (nextId: string) => {
      if (!nextId || nextId === activeOrganizationId) {
        return
      }
      setIsSaving(true)
      try {
        const result = await authClient.organization.setActive({
          organizationId: nextId,
        })
        if (!result.error) {
          router.refresh()
        }
      } finally {
        setIsSaving(false)
      }
    },
    [activeOrganizationId, router]
  )

  const selectValue = activeOrganizationId || organizationOptions[0]?.id || ""

  if (sessionPending || organizations.isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "pointer-events-none animate-pulse gap-2"
            )}
            data-sidebar="menu-button"
            data-size="lg"
            data-slot="sidebar-menu-button"
          >
            <span className="flex aspect-square size-8 shrink-0 rounded-lg bg-sidebar-accent" />
            <div className="grid min-w-0 flex-1 gap-1.5 text-left">
              <span className="h-3.5 rounded bg-sidebar-accent" />
              <span className="h-3 w-2/3 rounded bg-sidebar-accent" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!organizations.data || organizations.data.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "pointer-events-none gap-2 text-muted-foreground"
            )}
            data-sidebar="menu-button"
            data-size="lg"
            data-slot="sidebar-menu-button"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-sm font-semibold text-sidebar-primary-foreground">
              T
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-foreground">
                Tickr
              </span>
              <span className="truncate text-xs">
                Create a workspace from onboarding to use issues.
              </span>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            aria-label="Select workspace"
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "w-full aria-expanded:bg-sidebar-accent"
            )}
            data-sidebar="menu-button"
            data-size="lg"
            data-slot="sidebar-menu-button"
            disabled={isSaving}
            nativeButton
            type="button"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-sm font-semibold text-sidebar-primary-foreground">
              T
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Tickr</span>
              <span className="truncate text-xs text-muted-foreground">
                Dashboard
              </span>
            </div>
            <UiIcon
              aria-hidden
              className="ml-auto size-4 shrink-0 opacity-50"
              icon={UnfoldMoreIcon}
            />
          </MenuTrigger>
          <MenuPopup
            align="start"
            className="w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <MenuGroup>
              <MenuGroupLabel className="text-xs text-muted-foreground">
                Workspaces
              </MenuGroupLabel>
              <MenuRadioGroup
                disabled={isSaving}
                onValueChange={(next) => {
                  void handleOrganizationChange(next as string)
                }}
                value={selectValue}
              >
                {organizationOptions.map((organization) => (
                  <MenuRadioItem key={organization.id} value={organization.id}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background text-[0.65rem] font-semibold text-muted-foreground"
                      >
                        {organizationInitial(organization.name)}
                      </span>
                      <span className="truncate">{organization.name}</span>
                    </span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
