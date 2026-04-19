"use client"

import * as React from "react"

import type { NavMainItem } from "@/components/nav-main.types"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { OrgSwitcher } from "@/components/org-switcher"
import {
  Activity01Icon,
  Building02Icon,
  Folder01Icon,
  Home11Icon,
  LabelIcon,
  LayoutTwoColumnIcon,
  Notification01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar"
import { UiIcon } from "@workspace/ui/components/ui-icon"

const navMain: NavMainItem[] = [
  {
    title: "Overview",
    url: "/dashboard",
    match: "exact",
    icon: <UiIcon aria-hidden icon={Activity01Icon} />,
  },
  {
    title: "Issues",
    url: "/dashboard/issues",
    icon: <UiIcon aria-hidden icon={LayoutTwoColumnIcon} />,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: <UiIcon aria-hidden icon={Folder01Icon} />,
  },
  {
    title: "Labels",
    url: "/dashboard/labels",
    icon: <UiIcon aria-hidden icon={LabelIcon} />,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: <UiIcon aria-hidden icon={Notification01Icon} />,
  },
  {
    title: "Workspace",
    url: "/dashboard/organization",
    icon: <UiIcon aria-hidden icon={Building02Icon} />,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: <UiIcon aria-hidden icon={UserCircleIcon} />,
  },
]

const navSecondary = [
  {
    title: "Home",
    url: "/",
    icon: <UiIcon aria-hidden icon={Home11Icon} />,
  },
]

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-3">
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groupLabel="Navigation" items={navMain} />
        <NavSecondary className="mt-auto" items={navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
