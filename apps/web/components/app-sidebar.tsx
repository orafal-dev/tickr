"use client"

import * as React from "react"

import type { NavMainItem } from "@/components/nav-main.types"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { OrgSwitcher } from "@/components/org-switcher"
import {
  Building02Icon,
  Folder01Icon,
  LabelIcon,
  LayoutTwoColumnIcon,
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
    title: "Workspace",
    url: "/dashboard/organization",
    icon: <UiIcon aria-hidden icon={Building02Icon} />,
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
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
