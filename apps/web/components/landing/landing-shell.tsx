import { LandingFooter } from "./landing-footer"
import { LandingMain } from "./landing-main"
import { LandingNavbar } from "./landing-navbar"
import type { LandingShellProps } from "./landing-shell.types"

export const LandingShell = ({ isAuthenticated }: LandingShellProps) => (
  <div className="relative flex min-h-svh flex-col overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
    <LandingNavbar isAuthenticated={isAuthenticated} />
    <main className="grow pt-20">
      <LandingMain isAuthenticated={isAuthenticated} />
    </main>
    <LandingFooter />
  </div>
)
