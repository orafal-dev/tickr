/**
 * Entry used only by `bun run auth:migrate`. The Better Auth CLI cannot load configs
 * that transitively import `server-only` (e.g. email modules). Runtime auth stays in
 * `better-auth-instance.ts`.
 */
import { dash, sentinel } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import {
  authDatabasePool,
  resolveAuthBaseURL,
  resolveAuthSecret,
  resolveBetterAuthInfraApiKey,
} from "@/lib/better-auth-env";
import { resolveSocialProvidersConfig } from "@/lib/oauth-providers";

const baseURL = resolveAuthBaseURL();
const betterAuthInfraApiKey = resolveBetterAuthInfraApiKey();

export const auth = betterAuth({
  baseURL,
  secret: resolveAuthSecret(),
  database: authDatabasePool,
  rateLimit: {
    enabled: true,
    customRules: {
      "/send-verification-email": {
        window: 300,
        max: 1,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600 * 24,
    sendVerificationEmail: async () => {},
  },
  socialProviders: resolveSocialProvidersConfig(),
  plugins: [
    nextCookies(),
    dash({
      apiKey: betterAuthInfraApiKey,
    }),
    sentinel({
      apiKey: betterAuthInfraApiKey,
    }),
    organization({
      async sendInvitationEmail() {},
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
