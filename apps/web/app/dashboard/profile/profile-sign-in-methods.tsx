"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ProfilePasswordForm } from "@/app/dashboard/profile/profile-password-form"
import { authClient } from "@/lib/auth-client"
import {
  googleColoredOAuthIcon,
  linearOAuthIcon,
} from "@/lib/oauth-provider-icons"
import type { OAuthProviderId } from "@/lib/oauth.types"
import { GithubIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import { UiIcon } from "@workspace/ui/components/ui-icon"

import type { LinkedAuthAccount } from "./profile-linked-accounts.types"

const OAUTH_CONTINUE_PATH = "/auth/oauth-continue" as const

const providerLabel = (providerId: string): string => {
  if (providerId === "credential") {
    return "Email and password"
  }
  if (providerId === "google") {
    return "Google"
  }
  if (providerId === "github") {
    return "GitHub"
  }
  if (providerId === "linear") {
    return "Linear"
  }
  return providerId
}

const isOAuthProviderId = (id: string): id is OAuthProviderId =>
  id === "google" || id === "github" || id === "linear"

type ProfileSignInMethodsProps = {
  configuredProviders: OAuthProviderId[]
}

export const ProfileSignInMethods = ({
  configuredProviders,
}: ProfileSignInMethodsProps) => {
  const router = useRouter()
  const [accounts, setAccounts] = useState<LinkedAuthAccount[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [linkingProvider, setLinkingProvider] = useState<OAuthProviderId | null>(
    null
  )
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoadError(null)
    const res = await authClient.listAccounts()
    if (res.error) {
      setLoadError(res.error.message ?? "Unable to load sign-in methods.")
      setAccounts([])
      return
    }
    const data = res.data
    if (!Array.isArray(data)) {
      setAccounts([])
      return
    }
    setAccounts(
      data.map((a) => ({
        id: String(a.id),
        providerId: String(a.providerId),
        accountId: String(a.accountId),
      }))
    )
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const hasCredential = useMemo(
    () => accounts?.some((a) => a.providerId === "credential") ?? false,
    [accounts]
  )

  const linkedProviderIds = useMemo(() => {
    if (!accounts) {
      return new Set<string>()
    }
    return new Set(accounts.map((a) => a.providerId))
  }, [accounts])

  const providersToConnect = useMemo(
    () => configuredProviders.filter((p) => !linkedProviderIds.has(p)),
    [configuredProviders, linkedProviderIds]
  )

  const handleLinkProvider = useCallback(
    async (provider: OAuthProviderId) => {
      setActionError(null)
      setLinkingProvider(provider)
      try {
        const next = encodeURIComponent("/dashboard/profile")
        const callbackURL = `${OAUTH_CONTINUE_PATH}?next=${next}`
        const result = await authClient.linkSocial({
          provider,
          callbackURL,
          errorCallbackURL: "/dashboard/profile",
        })
        if (result.error) {
          setActionError(result.error.message ?? "Unable to start linking.")
          return
        }
        const url =
          result.data &&
          typeof result.data === "object" &&
          "url" in result.data &&
          typeof (result.data as { url?: unknown }).url === "string"
            ? (result.data as { url: string }).url
            : null
        if (url) {
          window.location.assign(url)
          return
        }
        setActionError("Linking did not return a redirect URL.")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong."
        setActionError(message)
      } finally {
        setLinkingProvider(null)
      }
    },
    []
  )

  const handleUnlinkAccount = useCallback(
    async (account: LinkedAuthAccount) => {
      if (!isOAuthProviderId(account.providerId)) {
        return
      }
      setActionError(null)
      setUnlinkingKey(account.id)
      try {
        const result = await authClient.unlinkAccount({
          providerId: account.providerId,
          accountId: account.accountId,
        })
        if (result.error) {
          setActionError(result.error.message ?? "Unable to disconnect.")
          return
        }
        await loadAccounts()
        router.refresh()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong."
        setActionError(message)
      } finally {
        setUnlinkingKey(null)
      }
    },
    [loadAccounts, router]
  )

  if (accounts === null) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Sign-in methods</h2>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Connected accounts</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Link Google, GitHub, or Linear to sign in with any of them on the
            same profile.
          </p>
        </div>
        {loadError ? (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        ) : null}
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2" role="list">
          {accounts.map((account) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              key={account.id}
            >
              <span className="text-sm">
                {providerLabel(account.providerId)}
              </span>
              {isOAuthProviderId(account.providerId) ? (
                <Button
                  aria-label={`Disconnect ${providerLabel(account.providerId)}`}
                  loading={unlinkingKey === account.id}
                  onClick={() => {
                    void handleUnlinkAccount(account)
                  }}
                  type="button"
                  variant="outline"
                >
                  Disconnect
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {hasCredential ? (
          <p className="text-xs text-muted-foreground">
            You can sign in with your email and password. Keep at least one
            sign-in method connected.
          </p>
        ) : null}
        {providersToConnect.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Connect another provider
            </span>
            <div className="flex flex-col gap-2">
              {providersToConnect.map((provider) => (
                <Button
                  aria-busy={linkingProvider === provider}
                  aria-label={`Connect ${providerLabel(provider)}`}
                  className="w-full sm:w-auto"
                  disabled={linkingProvider !== null}
                  key={provider}
                  loading={linkingProvider === provider}
                  onClick={() => {
                    void handleLinkProvider(provider)
                  }}
                  type="button"
                  variant="outline"
                >
                  {provider === "google" ? (
                    <HugeiconsIcon
                      aria-hidden
                      className="opacity-100"
                      icon={googleColoredOAuthIcon}
                      size={16}
                    />
                  ) : provider === "linear" ? (
                    <HugeiconsIcon
                      aria-hidden
                      className="opacity-80"
                      icon={linearOAuthIcon}
                      size={16}
                    />
                  ) : (
                    <UiIcon
                      aria-hidden
                      className="opacity-80"
                      icon={GithubIcon}
                      size={16}
                    />
                  )}
                  Connect {providerLabel(provider)}
                </Button>
              ))}
            </div>
          </div>
        ) : configuredProviders.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            All configured providers are connected.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            OAuth is not configured for this environment. Only email sign-in is
            available.
          </p>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <ProfilePasswordForm
          hasCredentialAccount={hasCredential}
          onPasswordSaved={loadAccounts}
        />
      </div>
    </div>
  )
}
