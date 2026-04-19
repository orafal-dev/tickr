"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { ORGANIZATION_ONBOARDING_PATH } from "@/lib/onboarding-constants"
import { resolveSafeInternalPath } from "@/lib/safe-internal-path"

export const OAuthContinueView = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const next = resolveSafeInternalPath(
        searchParams.get("next"),
        "/dashboard"
      )
      const session = await authClient.getSession()
      if (cancelled) {
        return
      }
      if (!session.data?.session) {
        router.replace("/login")
        return
      }
      let destination = next
      if (destination === "/dashboard") {
        const listed = await authClient.organization.list()
        if (cancelled) {
          return
        }
        if (
          !listed.error &&
          Array.isArray(listed.data) &&
          listed.data.length === 0
        ) {
          destination = ORGANIZATION_ONBOARDING_PATH
        }
      }
      router.replace(destination)
      router.refresh()
    }
    void run().catch((error: unknown) => {
      if (cancelled) {
        return
      }
      const message =
        error instanceof Error ? error.message : "Unable to finish sign-in."
      setErrorMessage(message)
    })
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
        <button
          className="text-sm font-medium text-foreground underline underline-offset-4"
          onClick={() => {
            router.replace("/login")
          }}
          type="button"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <p className="text-center text-sm text-muted-foreground">Signing you in…</p>
  )
}
