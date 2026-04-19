import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { DashboardAppShell } from "@/app/dashboard/dashboard-app-shell"
import { getSession } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardAppShell
      showEmailVerificationBanner={!session.user.emailVerified}
    >
      {children}
    </DashboardAppShell>
  )
}
