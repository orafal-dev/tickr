import Link from "next/link"

import { ProfileResendVerification } from "@/app/dashboard/profile/profile-resend-verification"
import { ProfileSignInMethods } from "@/app/dashboard/profile/profile-sign-in-methods"
import { getSession } from "@/lib/auth"
import { getConfiguredOAuthProviders } from "@/lib/oauth-providers.server"
import { buttonVariants } from "@workspace/ui/components/button.variants"
import { cn } from "@workspace/ui/lib/utils"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) {
    return null
  }

  const oauthProviders = getConfiguredOAuthProviders()
  const emailVerified = Boolean(session.user.emailVerified)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-medium">Profile</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Account details, sign-in methods, and email confirmation.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Email
          </span>
          <span className="text-sm">{session.user.email}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Verification
          </span>
          <span className="text-sm">
            {emailVerified ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                Confirmed
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Pending confirmation
              </span>
            )}
          </span>
        </div>
        {!emailVerified ? (
          <ProfileResendVerification
            callbackURL="/dashboard"
            email={session.user.email}
          />
        ) : null}
      </div>
      <ProfileSignInMethods configuredProviders={oauthProviders} />
      <Link
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        href="/dashboard"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
