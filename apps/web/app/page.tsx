import type { Metadata } from "next"

import { LandingShell } from "@/components/landing/landing-shell"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Tickr — Issue tracking, beautifully simplified",
  description:
    "Tickr brings clarity to your development cycle. Fast issue tracking, keyboard-first workflows, and a clean interface for modern teams.",
}

export default async function Page() {
  const session = await getSession()
  return <LandingShell isAuthenticated={Boolean(session)} />
}
