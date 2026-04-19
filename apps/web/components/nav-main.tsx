"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavMainItem } from "@/components/nav-main.types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar"
import { UiIcon } from "@workspace/ui/components/ui-icon"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

const isItemActive = (pathname: string, item: NavMainItem): boolean => {
  if (item.items?.length) {
    if (pathname === item.url) {
      return true
    }
    return item.items.some((sub) => pathname === sub.url)
  }
  const mode = item.match ?? "prefix"
  if (mode === "exact") {
    return pathname === item.url
  }
  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}

export const NavMain = ({
  items,
  groupLabel = "Workspace",
}: {
  items: NavMainItem[]
  groupLabel?: string
}) => {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = Boolean(item.items?.length)
          const active = isItemActive(pathname, item)

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={active}
                  render={<Link href={item.url} />}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              defaultOpen={active}
              render={<SidebarMenuItem />}
            >
              <SidebarMenuButton
                isActive={active && pathname === item.url}
                render={<Link href={item.url} />}
                tooltip={item.title}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
              <CollapsibleTrigger
                render={
                  <SidebarMenuAction className="aria-expanded:rotate-90" />
                }
              >
                <UiIcon aria-hidden icon={ArrowRight01Icon} />
                <span className="sr-only">Toggle {item.title}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={pathname === subItem.url}
                        render={<Link href={subItem.url} />}
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
