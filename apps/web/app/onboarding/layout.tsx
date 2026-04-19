import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/app/dashboard/sign-out-button"
import { getSession } from "@/lib/auth"

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4">
          <Link className="font-heading text-lg font-medium" href="/">
            Tickr
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center p-6">
        {children}
      </main>
    </div>
  )
}
