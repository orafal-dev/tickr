import { Suspense } from "react"

import { OAuthContinueView } from "@/app/auth/oauth-continue/oauth-continue-view"

export default function OAuthContinuePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">
              Loading…
            </p>
          }
        >
          <OAuthContinueView />
        </Suspense>
      </div>
    </div>
  )
}
