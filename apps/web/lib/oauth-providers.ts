import { z } from "zod";

import type { OAuthProviderId } from "@/lib/oauth.types";

const oauthCredentialsSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

const parseOAuthCredentials = (
  clientId: string | undefined,
  clientSecret: string | undefined,
) => oauthCredentialsSchema.safeParse({ clientId, clientSecret });

/** Credentials for Better Auth `socialProviders` (only entries with both id and secret). */
export const resolveSocialProvidersConfig = (): {
  google?: { clientId: string; clientSecret: string };
  github?: { clientId: string; clientSecret: string };
  linear?: { clientId: string; clientSecret: string };
} => {
  const google = parseOAuthCredentials(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  const github = parseOAuthCredentials(
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_CLIENT_SECRET,
  );
  const linear = parseOAuthCredentials(
    process.env.LINEAR_CLIENT_ID,
    process.env.LINEAR_CLIENT_SECRET,
  );
  return {
    ...(google.success ? { google: google.data } : {}),
    ...(github.success ? { github: github.data } : {}),
    ...(linear.success ? { linear: linear.data } : {}),
  };
};

export const getConfiguredOAuthProviders = (): OAuthProviderId[] => {
  const configured = resolveSocialProvidersConfig();
  const list: OAuthProviderId[] = [];
  if (configured.google) {
    list.push("google");
  }
  if (configured.github) {
    list.push("github");
  }
  if (configured.linear) {
    list.push("linear");
  }
  return list;
};
