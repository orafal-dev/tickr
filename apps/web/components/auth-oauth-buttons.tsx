"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { googleColoredOAuthIcon, linearOAuthIcon } from "@/lib/oauth-provider-icons";
import type { OAuthProviderId } from "@/lib/oauth.types";
import { resolveSafeInternalPath } from "@/lib/safe-internal-path";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { UiIcon } from "@workspace/ui/components/ui-icon";

const OAUTH_CONTINUE_PATH = "/auth/oauth-continue" as const;

const providerLabel: Record<OAuthProviderId, string> = {
  google: "Google",
  github: "GitHub",
  linear: "Linear",
};

type AuthOAuthButtonsProps = {
  providers: OAuthProviderId[];
  /** Used when `callbackUrl` query param is absent */
  defaultPostAuthPath: string;
};

export const AuthOAuthButtons = ({
  providers,
  defaultPostAuthPath,
}: AuthOAuthButtonsProps) => {
  const searchParams = useSearchParams();
  const [activeProvider, setActiveProvider] = useState<OAuthProviderId | null>(
    null,
  );
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleOAuthClick = useCallback(
    async (provider: OAuthProviderId) => {
      setOauthError(null);
      setActiveProvider(provider);
      try {
        const postAuthRedirect = resolveSafeInternalPath(
          searchParams.get("callbackUrl"),
          defaultPostAuthPath,
        );
        const next = encodeURIComponent(postAuthRedirect);
        const callbackURL = `${OAUTH_CONTINUE_PATH}?next=${next}`;
        const result = await authClient.signIn.social({
          provider,
          callbackURL,
        });
        if (result.error) {
          setOauthError(result.error.message ?? "Unable to start sign-in.");
          return;
        }
        const url =
          result.data &&
          typeof result.data === "object" &&
          "url" in result.data &&
          typeof (result.data as { url?: unknown }).url === "string"
            ? (result.data as { url: string }).url
            : null;
        if (url) {
          window.location.assign(url);
          return;
        }
        setOauthError("Sign-in did not return a redirect URL.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong.";
        setOauthError(message);
      } finally {
        setActiveProvider(null);
      }
    },
    [defaultPostAuthPath, searchParams],
  );

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground shrink-0 text-xs">or</span>
        <Separator className="flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <Button
            aria-busy={activeProvider === provider}
            className="w-full"
            disabled={activeProvider !== null}
            key={provider}
            loading={activeProvider === provider}
            onClick={() => {
              void handleOAuthClick(provider);
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
            Continue with {providerLabel[provider]}
          </Button>
        ))}
      </div>
      {oauthError ? (
        <p className="text-destructive text-sm" role="alert">
          {oauthError}
        </p>
      ) : null}
    </div>
  );
};
