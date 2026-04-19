"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { DashboardQueryProvider } from "@/app/dashboard/dashboard-query-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

export const DashboardAppShell = ({
  children,
  showEmailVerificationBanner,
}: {
  children: ReactNode
  showEmailVerificationBanner: boolean
}) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger />
          <Separator
            className="data-[orientation=vertical]:h-6"
            orientation="vertical"
          />
          <Link
            className="font-heading text-sm font-medium text-foreground"
            href="/dashboard"
          >
            Tickr
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/15">
          <DashboardQueryProvider>
            {showEmailVerificationBanner ? (
              <div
                className="shrink-0 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 sm:px-6 dark:text-amber-100"
                role="status"
              >
                Please confirm your email address. Check your inbox for the
                link, or send another from{" "}
                <Link
                  className="font-medium underline underline-offset-2"
                  href="/dashboard/profile"
                >
                  Profile
                </Link>
                .
              </div>
            ) : null}
            <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </DashboardQueryProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
